const TYPES_REQUEST = "request";
const TYPES_RESPONSE = "response";
const TYPES_PING = "u alive?";

const CRYPT_REASON_EN = "encrypt";
const CRYPT_REASON_DE = "decrypt";

const DIRECTION_I2C = "injected2content";
const DIRECTION_C2I = "content2injected";

const shield = document.currentScript.dataset["shield"];

//#region Content script comms
window.addEventListener("message", async (message) => {
    const data = message.data;
    if (data.direction !== DIRECTION_C2I) return;

    if (data.shield !== shield) {
        console.warn(`Mismatch between shared secrets. Expected: ${shield}; Actual: ${data.shield}`);
        return;
    }

    switch (data.type) {
        case TYPES_PING:
            sendToContent({
                type: TYPES_PING
            });
            break;
        case TYPES_REQUEST:
            // Reserved for later use
            break;
        case TYPES_RESPONSE:
            // Resolve { content, success }
            messageMap.get(data.id)(data);
            messageMap.delete(data.id);
            break;
        default:
            console.error("Invalid message", message);
            break;
    }
});

function sendToContent(message) {
    message.shield = shield;
    message.direction = DIRECTION_I2C;
    window.postMessage(message);
}
//#endregion

//#region Messages
const messageMap = new Map();
function onIncomingMessage(message) {
    const id = crypto.getRandomValues(new Uint32Array(8)).join("+");
    return new Promise((resolve) => {
        messageMap.set(id, resolve);
        sendToContent({
            type: TYPES_REQUEST,
            reason: CRYPT_REASON_DE,
            id: id,
            content: message
        });
    });
}
function onOutgoingMessage(message) {
    const id = crypto.getRandomValues(new Uint32Array(8)).join("+");
    return new Promise((resolve) => {
        messageMap.set(id, resolve);
        sendToContent({
            type: TYPES_REQUEST,
            reason: CRYPT_REASON_EN,
            id: id,
            content: message
        });
    });
}
//#endregion

//#region Overwrite outgoing
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._method = method;
    this._url = url;
    return originalOpen.call(this, method, url, ...rest);
};
XMLHttpRequest.prototype.send = function (body) {
    if (!this._url.includes("/api/v9/channels/") || !this._url.endsWith("/messages") || !body) {
        originalSend.call(this, body);
        return;
    }

    console.log("Intercepted message.");
    let parsed;
    try {
        parsed = JSON.parse(body);
    } catch {
        originalSend.call(this, body);
        return;
    }

    if (parsed.content) {
        console.log("Encrypting...");
        onOutgoingMessage(parsed.content).then((newMessage) => {
            console.log("Attempting to send...");
            if (newMessage.success === true) {
                parsed.content = newMessage.content;
                originalSend.call(this, JSON.stringify(parsed));
                console.log("Finished sending modified message.");
            }
        });
    }
};
//#endregion

//#region Decrypt messages in the HTML (including incoming and outgoing; basically all rendered messages)
const observer = new MutationObserver(async mutations => {
    for (const mutation of mutations) {
        // When new nodes (possibly messages or nodes that hold message nodes) are added
        for (const node of mutation.addedNodes)
            iterateNodeTree(node);

        // When an existing encrypted message content got modified instead
        /* Note
            try to decrypt again
                + new encrypted message; displays a fresh green html
                - keep the old green, TODO
        */
        if (isDecryptedNode(mutation.target.parentNode)) {
            console.log("Existing node modified. Rebuilding span...");
            modifyNode(mutation.target.parentNode);
        }
    }
});
function iterateNodeTree(n) {
    n.childNodes.forEach(async (node) => {
        if (!isTextMessageNode(node)) {
            iterateNodeTree(node);
            return;
        }
        console.log("Fresh message node found. Modifying...");
        modifyNode(node);
    });
}

// Modify a <span> node that may or may not contain encrypted text
async function modifyNode(node) {
    const spanParent = node.parentElement;
    const textContent = node.textContent;
    const fullSpanParentContent = spanParent.innerHTML;

    // Decrypt
    const dataPromise = onIncomingMessage(textContent);

    // Display "Loading message..." text
    spanParent.innerHTML = "";
    spanParent.appendChild(buildLoadingHtml());

    const data = await dataPromise;
    // If the message is encrypted
    if (data.success === true) {
        console.log("Patching node...");
        spanParent.innerHTML = "";
        const newSpan = buildHtmlEncrypted(data.content);

        // Use the shield as a flag to mark spans, and tell the observer to ignore the update (to prevent an infinite loop)
        newSpan.dataset.shield = shield;

        spanParent.appendChild(newSpan);

    } else {
        // Restore whole old content
        console.log("Restoring node.");
        spanParent.innerHTML = fullSpanParentContent;
    }
}

function isTextMessageNode(node) {
    return node.nodeType === Node.ELEMENT_NODE && node.textContent && node.parentElement.id.startsWith("message-content-");
}
function isDecryptedNode(node) {
    return node.dataset["shield"] === shield;
}
//#endregion

//#region HTML builders
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

    outer.appendChild(label);
    outer.append(message);

    return outer;
}
function buildLoadingHtml() {
    const label = document.createElement("span");
    label.style.color = "#777777";
    label.textContent = "Loading message...";

    return label;
}
//#endregion

// Main
console.log("Hello from injected script!");
observer.observe(document.body,
    { childList: true, subtree: true, characterData: true }
);