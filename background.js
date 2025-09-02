const settings = {};

// store synced variables and forward to content scripts
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    switch (message.type) {
        case "get":
                sendResponse(settings[message.key]);
            break;
        case "set":
                console.log(`Set ${message.data[0]} to ${message.data[1]}.`);
                settings[message.data[0]] = message.data[1];
                broadcastToContentScripts(message.data[0], message.data[1]);
            break;
        default:
            console.error("Invalid message", message);
            break;
    }
});

function broadcastToContentScripts(key, value) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            try {
                chrome.tabs.sendMessage(tab.id, {
                    data: [key, value]
                })
            } catch (err) {
                // content script not found on page
            }
        });
    });
}