async function main() {
    await loadValue(TODO);
}

// use these to sync gui state with the background script,
// like "on/off" values and current settings
function getValue(key){
    return new Promise((resolve, _) => {
        chrome.runtime.sendMessage({
            type: 'get',
            data: [key]
        }, (response) => {
            resolve(response);
        });
    });
}
function setValue(key, value) {
    chrome.runtime.sendMessage({
        type: 'set',
        data: [key, value]
    });
}

main();