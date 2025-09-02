const TYPES_REQUEST = "request";
const TYPES_RESPONSE = "response";

const CRYPT_REASON_EN = "encrypt";
const CRYPT_REASON_DE = "decrypt";

const PING_REQUEST = "u alive?";

const shield = document.currentScript.dataset.shield;

//#region content script comms
window.addEventListener("message", async (message) => {
    if (message.shield !== shield) {
        console.warn(`Mismatch between shared secrets. Expected: ${shield}; Actual: ${message.shield}`);
        return;
    }

    switch (message.type) {
        case TYPES_REQUEST:
            if (message.data === PING_REQUEST) {
                sendToContent({
                    type: TYPES_RESPONSE,
                    data: PING_REQUEST
                });
            }
            break;
        case TYPES_RESPONSE:
            messageMap.get(message.data.id)(message.data); // resolves { content, success }
            messageMap.delete(message.data.id);
            break;
        default:
            console.error("Invalid message", message);
            break;
    }
});

function sendToContent(message) {
    message.shield = shield;
    window.postMessage(message);
}
//#endregion

//#region messages
const messageMap = new Map();
function onIncomingMessage(message) {
    const id = crypto.getRandomValues(new Uint32Array(8)).join("+");
    return new Promise((resolve) => {
        messageMap.set(id, resolve);
        sendToContent({
            type: TYPES_REQUEST,
            data: {
                reason: CRYPT_REASON_DE,
                id: id,
                content: message,
            }
        });
    });
}
function onOutgoingMessage(message) {
    const id = crypto.getRandomValues(new Uint32Array(8)).join("+");
    return new Promise((resolve) => {
        messageMap.set(id, resolve);
        sendToContent({
            type: TYPES_REQUEST,
            data: {
                reason: CRYPT_REASON_EN,
                id: id,
                content: message,
            }
        });
    });
}

//#region overwrite outgoing
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._method = method;
    this._url = url;
    return originalOpen.call(this, method, url, ...rest);
};
XMLHttpRequest.prototype.send = function (body) {
    try {
        if (this._url.includes("/api/v9/channels/") && this._url.endsWith("/messages")) {
            console.log("Intercepted message.");

            if (body) {
                let parsed;
                try { parsed = JSON.parse(body); } catch { }
                if (parsed && parsed.content) {
                    console.log("Parsing...");
                    onOutgoingMessage(parsed.content).then((newMessage) => {
                        console.log("Finished parsing.");
                        parsed.content = newMessage;
                        body = JSON.stringify(parsed);
                        originalSend.call(this, body);
                    });
                }
            } else {
                return originalSend.call(this, body);
            }
        } else {
            return originalSend.call(this, body);
        }
    } catch (err) {
        console.error("XHR hook died", e);
    }
};
//#endregion

//#region overwrite incoming
const observer = new MutationObserver(async muts => {
    for (const mut of muts) {
        // new nodes (*1)
        for (const node of mut.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "LI") iterateNodeTree(node);
        }

        // node text content override
        if (mut.type === "characterData" && isMessageNode(mut.target.parentNode) && mut.target.parentNode.dataset.shield === shield) {
            console.log("Text node changed.");
            mut.target.nodeValue = await onIncomingMessage(mut.target.nodeValue);
        }
    }
});
function iterateNodeTree(node) { // for new nodes (*1)
    node.childNodes.forEach(async (n) => {
        if (!isMessageNode(n)) {
            iterateNodeTree(n);
            return;
        }

        console.log("Message node found.");
        const spansParent = n.parentElement;

        // "loading"
        spansParent.innerHTML = "";
        spansParent.appendChild(buildLoadingHtml());

        const data = await onIncomingMessage(n.textContent);
        if (data.success === true) { // "encrypted"
            spansParent.innerHTML = "";
            const newSpan = buildHtmlEncrypted(data.content);
            spansParent.appendChild(newSpan);

            // also use shield as a flag for elements decrypted (these will not be ignored by the text node override fix)
            newSpan.dataset.shield = shield;
        } else { // plain text original message
            n.textContent = data.content;
        }
    });
}
function isMessageNode(node) {
    return node.nodeType === Node.ELEMENT_NODE && node.textContent && node.parentElement.id.startsWith("message-content-");
}

observer.observe(document.body,
    { childList: true, subtree: true, characterData: true }
);
//#endregion
//#endregion

//#region build htmls
function buildHtmlEncrypted(message) {
    const outer = document.createElement("span");
    outer.style.border = "2px solid #008800";
    outer.style.borderRadius = "5px";
    outer.style.padding = "5px";
    outer.style.background = "#00FF0011";
    outer.style.margin = "2px 2px 2px 2px";

    const label = document.createElement("span");
    label.style.padding = "1px 1px";
    label.style.fontSize = "60%";
    label.style.color = "#008800";
    label.style.backgroundColor = "transparent";
    label.style.textTransform = "uppercase";
    label.style.margin = "0px 10px 0px 0px";
    label.textContent = "E2EE";

    const content = document.createElement("span");
    content.textContent = message;

    outer.appendChild(label);
    outer.appendChild(content);

    return outer;
}

function buildLoadingHtml() {
    const label = document.createElement("span");
    label.style.color = "#777777";
    label.textContent = "Loading message...";

    return label;
}

console.log("Hello from injected script!");