async function main() {
    await loadValue(TODO);
}

// use these to sync gui state with the background script,
// like "on/off" values and current settings
function loadValue(key){
    return new Promise((resolve, _) => {
        chrome.runtime.sendMessage({
            type: 'get',
            key
        }, (response) => {
            encrypt.checked = response.state;
            resolve();
        });
    });
}
function updateValue(key, value) {
    chrome.runtime.sendMessage({
        type: 'set',
        pair: {
            [key]: value
        }
    });
}

main();