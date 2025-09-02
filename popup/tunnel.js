// Cross-browser compatibility layer
const browserAPI = (() => {
    if (typeof browser !== 'undefined') {
        return browser;
    } else if (typeof chrome !== 'undefined') {
        return chrome;
    }
    throw new Error('No browser API available');
})();

let enabledToggle, statusIndicator, statusText, passwordInput, showPasswordBtn;
let colorSectionHeader, colorSectionContent, colorSectionArrow;
let bgColorOption, textColorOption, customColorPicker, colorPickerTitle;
let colorSpectrum, colorCursor, hueBar, hueCursor, hexInput, currentColorDisplay;
let bgColorPreview, textColorPreview, contrastValue, contrastStatus;

// Color picker state
let currentEditingColor = null;
let currentHue = 0;
let currentSaturation = 100;
let currentLightness = 50;
let backgroundColor = '#000000';
let textColor = '#ffffff';

async function main() {
    // Initialize DOM elements
    enabledToggle = document.getElementById('enabled-toggle');
    statusIndicator = document.getElementById('status-indicator');
    statusText = document.getElementById('status-text');
    passwordInput = document.getElementById('password-input');
    showPasswordBtn = document.getElementById('show-password');
    colorSectionHeader = document.getElementById('color-section-header');
    colorSectionContent = document.getElementById('color-section-content');
    colorSectionArrow = document.getElementById('color-section-arrow');
    bgColorOption = document.getElementById('bg-color-option');
    textColorOption = document.getElementById('text-color-option');
    customColorPicker = document.getElementById('custom-color-picker');
    colorPickerTitle = document.getElementById('color-picker-title');
    colorSpectrum = document.getElementById('color-spectrum');
    colorCursor = document.getElementById('color-cursor');
    hueBar = document.getElementById('hue-bar');
    hueCursor = document.getElementById('hue-cursor');
    hexInput = document.getElementById('hex-input');
    currentColorDisplay = document.getElementById('current-color');
    bgColorPreview = document.getElementById('bg-color-preview');
    textColorPreview = document.getElementById('text-color-preview');
    contrastValue = document.getElementById('contrast-value');
    contrastStatus = document.getElementById('contrast-status');

    // Load initial values
    await loadInitialValues();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize color previews and contrast check
    updateColorPreviews();
    checkContrast();
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
        
        // Load colors
        backgroundColor = await getValue('backgroundColor') || "#000000";
        textColor = await getValue('textColor') || "#ffffff";
        
        // Load collapsed state
        const isColorSectionExpanded = await getValue('colorSectionExpanded') || false;
        if (isColorSectionExpanded) {
            toggleColorSection();
        }
        
        // Apply colors
        applyColors(backgroundColor, textColor);
    } catch (error) {
        console.error('Error loading initial values:', error);
        // set default on error
        enabledToggle.checked = false;
        updateStatusIndicator(false);
        passwordInput.value = "bPTH9ZMK3pRJikpxeFSizeZxL2SKzykz";
        backgroundColor = "#000000";
        textColor = "#ffffff";
        applyColors(backgroundColor, textColor);
    }
}

function setupEventListeners() {
    enabledToggle.addEventListener('change', function() {
        const isEnabled = this.checked;
        setValue('enabled', isEnabled);
        updateStatusIndicator(isEnabled);
        if (isEnabled) {
            setValue('password', passwordInput.value);
        }
    });

    document.querySelector('.slider').addEventListener('click', function(e) {
        e.preventDefault();
        enabledToggle.checked = !enabledToggle.checked;
        const isEnabled = enabledToggle.checked;
        setValue('enabled', isEnabled);
        updateStatusIndicator(isEnabled);
        if (isEnabled) {
            setValue('password', passwordInput.value);
        }
    });

    // Password input event listener
    passwordInput.addEventListener('input', function() {
        setValue('password', this.value);
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

    // Color section toggle
    colorSectionHeader.addEventListener('click', function() {
        toggleColorSection();
        setValue('colorSectionExpanded', colorSectionContent.classList.contains('expanded'));
    });

    bgColorOption.addEventListener('click', () => selectColorOption('background'));
    textColorOption.addEventListener('click', () => selectColorOption('text'));
    setupColorPickerEvents();
}

function updateStatusIndicator(enabled) {
    statusIndicator.className = 'status-indicator ' + (enabled ? 'enabled' : 'disabled');
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
}

function toggleColorSection() {
    const isExpanded = colorSectionContent.classList.contains('expanded');
    
    if (isExpanded) {
        colorSectionContent.classList.remove('expanded');
        colorSectionArrow.classList.remove('expanded');
        customColorPicker.classList.remove('visible');
        bgColorOption.classList.remove('selected');
        textColorOption.classList.remove('selected');
        currentEditingColor = null;
    } else {
        colorSectionContent.classList.add('expanded');
        colorSectionArrow.classList.add('expanded');
    }
}

function selectColorOption(colorType) {
    currentEditingColor = colorType;
    
    // Remove selection from all options
    bgColorOption.classList.remove('selected');
    textColorOption.classList.remove('selected');
    
    // Add selection to current option
    if (colorType === 'background') {
        bgColorOption.classList.add('selected');
        colorPickerTitle.textContent = 'Select Background Color';
        initColorPicker(backgroundColor);
    } else {
        textColorOption.classList.add('selected');
        colorPickerTitle.textContent = 'Select Text Color';
        initColorPicker(textColor);
    }
    // show color picker
    customColorPicker.classList.add('visible');
}

function initColorPicker(hexColor) {
    const hsl = hexToHsl(hexColor);
    currentHue = hsl.h;
    currentSaturation = hsl.s;
    currentLightness = hsl.l;
    
    updateColorSpectrum();
    updateCursors();
    updateCurrentColor();
    hexInput.value = hexColor;
}

function setupColorPickerEvents() {
    // Color spectrum click
    colorSpectrum.addEventListener('mousedown', function(e) {
        handleSpectrumInteraction(e);
        
        const handleMouseMove = (e) => handleSpectrumInteraction(e);
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    // Hue bar click
    hueBar.addEventListener('mousedown', function(e) {
        handleHueInteraction(e);
        
        const handleMouseMove = (e) => handleHueInteraction(e);
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    // Hex input
    hexInput.addEventListener('input', function() {
        const hex = this.value;
        if (hex.match(/^#[0-9a-fA-F]{6}$/)) {
            initColorPicker(hex);
            updateSelectedColor(hex);
        }
    });
}

function handleSpectrumInteraction(e) {
    const rect = colorSpectrum.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    
    currentSaturation = (x / rect.width) * 100;
    currentLightness = 100 - (y / rect.height) * 100;
    
    updateCursors();
    updateCurrentColor();
    
    const newColor = hslToHex(currentHue, currentSaturation, currentLightness);
    hexInput.value = newColor;
    updateSelectedColor(newColor);
}

function handleHueInteraction(e) {
    const rect = hueBar.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    
    currentHue = (y / rect.height) * 360;
    
    updateColorSpectrum();
    updateCursors();
    updateCurrentColor();
    
    const newColor = hslToHex(currentHue, currentSaturation, currentLightness);
    hexInput.value = newColor;
    updateSelectedColor(newColor);
}

function updateColorSpectrum() {
    const baseColor = `hsl(${currentHue}, 100%, 50%)`;
    colorSpectrum.style.background = `
        linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%),
        linear-gradient(to right, rgba(255,255,255,1) 0%, ${baseColor} 100%)
    `;
}

function updateCursors() {
    // Update spectrum cursor
    const spectrumRect = colorSpectrum.getBoundingClientRect();
    const spectrumX = (currentSaturation / 100) * spectrumRect.width;
    const spectrumY = ((100 - currentLightness) / 100) * spectrumRect.height;
    
    colorCursor.style.left = spectrumX + 'px';
    colorCursor.style.top = spectrumY + 'px';
    
    // Update hue cursor
    const hueRect = hueBar.getBoundingClientRect();
    const hueY = (currentHue / 360) * hueRect.height;
    
    hueCursor.style.top = hueY + 'px';
}

function updateCurrentColor() {
    const color = hslToHex(currentHue, currentSaturation, currentLightness);
    currentColorDisplay.style.backgroundColor = color;
}

function updateSelectedColor(color) {
    if (currentEditingColor === 'background') {
        backgroundColor = color;
        setValue('backgroundColor', color);
    } else if (currentEditingColor === 'text') {
        textColor = color;
        setValue('textColor', color);
    }
    
    applyColors(backgroundColor, textColor);
    updateColorPreviews();
    checkContrast();
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

// Color management functions
function applyColors(backgroundColor, textColor) {
    document.body.style.setProperty('background-color', backgroundColor, 'important');
    document.body.style.setProperty('color', textColor, 'important');
    
    document.documentElement.style.setProperty('--bg-color', backgroundColor);
    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--text-color-60', hexToRgba(textColor, 0.6));
    document.documentElement.style.setProperty('--text-color-70', hexToRgba(textColor, 0.7));
    
    const textElements = document.querySelectorAll('h1, label, .status-text, .color-section-title');
    textElements.forEach(element => {
        element.style.setProperty('color', textColor, 'important');
    });
    
    // update dynamic styles
    updateDynamicStyles(backgroundColor, textColor);
}

function updateDynamicStyles(backgroundColor, textColor) {
    // remove old dynamic
    const oldStyle = document.getElementById('dynamic-colors');
    if (oldStyle) oldStyle.remove();
    
    // new dynamic style
    const style = document.createElement('style');
    style.id = 'dynamic-colors';
    style.textContent = `
        .password-input::placeholder { color: ${hexToRgba(textColor, 0.6)} !important; }
        .password-info small, .contrast-info small { color: ${hexToRgba(textColor, 0.7)} !important; }
        .color-section-arrow { color: ${hexToRgba(textColor, 0.7)} !important; }
    `;
    document.head.appendChild(style);
}

function updateColorPreviews() {
    bgColorPreview.style.backgroundColor = backgroundColor;
    textColorPreview.style.backgroundColor = textColor;
}

function checkContrast() {
    const ratio = calculateContrastRatio(backgroundColor, textColor);
    contrastValue.textContent = ratio.toFixed(2) + ':1';
    
    if (ratio >= 7) {
        contrastStatus.textContent = '✓ WCAG AAA';
        contrastStatus.className = 'contrast-good';
    } else if (ratio >= 4.5) {
        contrastStatus.textContent = '✓ WCAG AA';
        contrastStatus.className = 'contrast-good';
    } else if (ratio >= 3) {
        contrastStatus.textContent = '⚠ WCAG AA Large';
        contrastStatus.className = 'contrast-warning';
    } else {
        contrastStatus.textContent = '✗ Poor contrast';
        contrastStatus.className = 'contrast-bad';
    }
}

// util function for color calc
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex;
}

function getLuminance(r, g, b) {
    // Convert to sRGB
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    // Calculate luminance
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 1;
    
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
}

function getContrastColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// HSL conversion function
function hexToHsl(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return { h: 0, s: 0, l: 0 };
    
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', main);

// Save data before popup close
window.addEventListener('beforeunload', function() {
    if (backgroundColor && textColor) {
        setValue('backgroundColor', backgroundColor);
        setValue('textColor', textColor);
    }
});

/*
//close when losing focus
window.addEventListener('blur', function() {
    if (backgroundColor && textColor) {
        setValue('backgroundColor', backgroundColor);
        setValue('textColor', textColor);
    }
});
*/