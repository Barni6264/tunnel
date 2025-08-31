const TEXT_MARK = "!?>";

const RECONNECT_TIMEOUT_MS = 2000;
const ENCRYPT_ITERATIONS = 100_000;

const MAX_DISCORD_MESSAGE_LENGTH_IN_CHARS = 2000;

const TYPES_REQUEST = "request";
const TYPES_RESPONSE = "response";

const CRYPT_REASON_EN = "encrypt";
const CRYPT_REASON_DE = "decrypt";

const PING_REQUEST = "u alive?";

const enc = new TextEncoder();
const dec = new TextDecoder();

const shield = crypto.getRandomValues(new Uint32Array(8)).join("+");

// settings synced from background.js
const settings = {
    password: "bPTH9ZMK3pRJikpxeFSizeZxL2SKzykz",
    enabled: false
};
chrome.runtime.onMessage.addListener((message) => {
    console.log(`Set ${message.data[0]} to ${message.data[1]}.`);
    settings[message.data[0]] = message.data[1];
});

// reconnect to injected script just in case
const reconnectTimeout = setTimeout(() => {
    console.log("Couldn't find injected script. Injecting new one...");
    inject();
    alert("Injected!");
}, RECONNECT_TIMEOUT_MS);
sendToInjected({
    type: TYPES_REQUEST,
    data: PING_REQUEST
});

/// injected script comms
// message from injected script
window.addEventListener("message", async (message) => {
    if (message.shield !== shield) {
        console.warn(`Mismatch between shared secrets. Expected: ${shield}; Actual: ${message.shield}`);
        return;
    }
    switch (message.type) {
        case TYPES_REQUEST:
            if (message.data.reason === CRYPT_REASON_EN) {
                const encrypted = await encrypt(message.data.content);
                sendToInjected({
                    type: TYPES_RESPONSE,
                    data: {
                        id: message.data.id,
                        content: encrypted.message,
                        success: encrypted.success
                    }
                });
            } else if (message.data.reason === CRYPT_REASON_DE) {
                const decrypted = await decrypt(message.data.content);
                sendToInjected({
                    type: TYPES_RESPONSE,
                    data: {
                        id: message.data.id,
                        content: decrypted.message,
                        success: decrypted.success
                    }
                });
            }
            break;
        case TYPES_RESPONSE:
            if (message.data === PING_REQUEST) {
                clearTimeout(reconnectTimeout);
                console.log("Reconnected to an old script. I'll reload the page and reinject.");
                if (confirm("Old injected script detected.\nIt is highly recommended to reload the page.\n\nOutdated scripts or multiple injected instances will lead to errors.\n\nYou can reload now, or manually if you want to finish something.")) {
                    location.reload();
                    alert("Reloading...");
                } else {
                    alert("Please reload manually ASAP!");
                }
            }
            break;
        default:
            console.error("Invalid message", message);
            break;
    }
});

function sendToInjected(message) {
    message.shield = shield;
    window.postMessage(message);
}
// inject
function inject() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("discord_injected.js");
    script.dataset.shield = shield;
    console.log(`Injecting ${script.src}...`);
    script.onload = () => {
        console.log(`Sneaky ~`);
        script.remove();
        console.log(`~ Wooosh!`);
    }
    (document.head || document.documentElement).append(script);
}

// magic
//#region crypto
async function encrypt(message) {
    if (!settings.enabled) return { message: result, success: false };

    let success = true;
    try {
        const salt = crypto.getRandomValues(new Uint8Array(16)); // a pinch of salt
        const key = crypto.subtle.deriveKey({ // this is a key moment!
            name: "PBKDF2",
            salt: salt,
            iterations: ENCRYPT_ITERATIONS,
            hash: "SHA-256"
        },
            await crypto.subtle.importKey(
                "raw",
                enc.encode(settings.password),
                "PBKDF2",
                false,
                ["deriveKey"]
            ),
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            await key,
            enc.encode(message)
        );

        //mark salt iv encrypted
        const finalArray = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        finalArray.set(salt, 0);
        finalArray.set(iv, salt.length);
        finalArray.set(new Uint8Array(encrypted), salt.length + iv.length);

        const result = `${TEXT_MARK}${finalArray.toBase64()}`;
        if (result.length > MAX_DISCORD_MESSAGE_LENGTH_IN_CHARS) throw new Error(`Ciphertext length overflow; Length: ${result.length}; Max: ${MAX_DISCORD_MESSAGE_LENGTH_IN_CHARS}`);
    } catch (err) {
        success = false;
        console.error("Failed to encrypt message", message.content, err);
    }

    return { message: result, success };
}
async function decrypt(message) {
    if (!settings.enabled || !message.startsWith(TEXT_MARK)) return { message: result, success: false };

    let success = true;
    try {
        const bytes = Uint8Array.from(atob(message.slice(TEXT_MARK.length)), c => c.charCodeAt(0));

        const salt = bytes.slice(0, 16);
        const iv = bytes.slice(16, 28);
        const encrypted = bytes.slice(28);

        const key = await crypto.subtle.deriveKey({
            name: "PBKDF2",
            salt: salt,
            iterations: ENCRYPT_ITERATIONS,
            hash: "SHA-256"
        },
            await crypto.subtle.importKey(
                "raw",
                enc.encode(settings.password),
                "PBKDF2",
                false,
                ["deriveKey"]
            ),
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        const finalArray = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encrypted
        );
        message = dec.decode(finalArray);
    } catch (err) {
        success = false;
        console.error("Failed to decrypt message", message, err);
    }

    return { message, success };
}
//#endregion

console.log("Hello from content script!");