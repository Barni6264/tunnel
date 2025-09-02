// Cross-browser compatibility layer
const browserAPI = (() => {
    if (typeof browser !== 'undefined') {
        return browser; // Firefox
    } else if (typeof chrome !== 'undefined') {
        return chrome; // Chrome
    }
    throw new Error('No browser API available');
})();

// DOM elements
let enabledToggle;
let statusIndicator;
let statusText;
let passwordInput;
let showPasswordBtn;

async function main() {
    // Initialize DOM elements
    enabledToggle = document.getElementById('enabled-toggle');
    statusIndicator = document.getElementById('status-indicator');
    statusText = document.getElementById('status-text');
    passwordInput = document.getElementById('password-input');
    showPasswordBtn = document.getElementById('show-password');

    // Load initial values
    await loadInitialValues();
    
    // Set up event listeners
    setupEventListeners();
}

async function loadInitialValues() {
    try {
        // Load enabled state
        const enabled = await getValue('enabled') || false;
        enabledToggle.checked = enabled;
        updateStatusIndicator(enabled);
        
        // Load password
        const password = await getValue('password') || "bPTH9ZMK3pRJikpxeFSizeZxL2SKzykz";
        passwordInput.value = password;
    } catch (error) {
        console.error('Error loading initial values:', error);
        // Set defaults if there's an error
        enabledToggle.checked = false;
        updateStatusIndicator(false);
        passwordInput.value = "bPTH9ZMK3pRJikpxeFSizeZxL2SKzykz";
    }
}

function setupEventListeners() {
    // Toggle switch event listener
    enabledToggle.addEventListener('change', function() {
        const isEnabled = this.checked;
        setValue('enabled', isEnabled);
        updateStatusIndicator(isEnabled);
    });

    // Slider click event listener
    const slider = document.querySelector('.slider');
    slider.addEventListener('click', function(e) {
        e.preventDefault();
        enabledToggle.checked = !enabledToggle.checked;
        const isEnabled = enabledToggle.checked;
        setValue('enabled', isEnabled);
        updateStatusIndicator(isEnabled);
    });

    // Password input event listener
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        setValue('password', password);
    });

    // Show/hide password button
    showPasswordBtn.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            showPasswordBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            showPasswordBtn.textContent = '👁️';
        }
    });
}

function updateStatusIndicator(enabled) {
    statusIndicator.className = 'status-indicator ' + (enabled ? 'enabled' : 'disabled');
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
}

// use these to sync gui state with the background script,
// like "on/off" values and current settings
function getValue(key) {
    return new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage({
            type: 'get',
            key: key
        }, (response) => {
            if (browserAPI.runtime.lastError) {
                reject(browserAPI.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

function setValue(key, value) {
    browserAPI.runtime.sendMessage({
        type: 'set',
        data: [key, value]
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', main);