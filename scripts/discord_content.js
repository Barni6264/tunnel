const TEXT_MARK = "!?>";

const RECONNECT_TIMEOUT_MS = 5000;
const ENCRYPT_ITERATIONS = 100_000;

const MAX_DISCORD_MESSAGE_LENGTH_IN_CHARS = 2000;

const TYPES_REQUEST = "request";
const TYPES_RESPONSE = "response";
const TYPES_PING = "u alive?";

const CRYPT_REASON_EN = "encrypt";
const CRYPT_REASON_DE = "decrypt";

const DIRECTION_I2C = "injected2content";
const DIRECTION_C2I = "content2injected";

const enc = new TextEncoder();
const dec = new TextDecoder();

const shield = crypto.getRandomValues(new Uint32Array(8)).join("+");

// settings synced from background.js
const settings = {};
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
    type: TYPES_PING
});

/// injected script comms
// message from injected script
window.addEventListener("message", async (message) => {
    const data = message.data;
    if (data.direction !== DIRECTION_I2C) return;

    if (data.shield !== shield) {
        console.warn(`Mismatch between shared secrets. Expected: ${shield}; Actual: ${data.shield}`);
        return;
    }
    switch (data.type) {
        case TYPES_REQUEST:
            if (data.reason === CRYPT_REASON_EN) {
                const encrypted = await encrypt(data.content);
                sendToInjected({
                    type: TYPES_RESPONSE,
                    id: data.id,
                    content: encrypted.message,
                    success: encrypted.success
                });
            } else if (data.reason === CRYPT_REASON_DE) {
                const decrypted = await decrypt(data.content);
                sendToInjected({
                    type: TYPES_RESPONSE,
                    id: data.id,
                    content: decrypted.message,
                    success: decrypted.success
                });
            }
            break;
        case TYPES_RESPONSE:
            // Reserved for later use
            break;
        case TYPES_PING:
            clearTimeout(reconnectTimeout);
            console.log("Reconnected to an old script. I'll reload the page and reinject.");
            if (confirm("Old injected script detected.\nIt is highly recommended to reload the page.\n\nOutdated scripts or multiple injected instances WILL lead to errors.\n\nYou can reload now, or manually if you want to finish something.")) {
                location.reload();
                alert("Reloading...");
            } else {
                alert("Please reload manually ASAP!");
            }
            break;
        default:
            console.error("Invalid message", message);
            break;
    }
});

function sendToInjected(message) {
    message.shield = shield;
    message.direction = DIRECTION_C2I;
    window.postMessage(message);
}
// inject
function inject() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("scripts/discord_injected.js");
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
    if (!settings.enabled) return { message, success: true };

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
        return { message: result, success: true };
    } catch (err) {
        console.error("Failed to encrypt message", message.content, err);
        return { message: result, success: false };
    }
}
async function decrypt(message) {
    if (!settings.enabled || !message.startsWith(TEXT_MARK)) return { message, success: false };

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

        return { message, success: true };
    } catch (err) {
        console.error("Failed to decrypt message", message, err);
        return { message, success: false };
    }
}
//#endregion

console.log("Hello from content script!");