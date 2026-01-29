// js/settings.js

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
});

function switchTab(tabId) {
    // UI Tab Switching Logic
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.settings-section').forEach(section => section.classList.remove('active'));
    
    // Activate target
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if(activeBtn) activeBtn.classList.add('active');
    document.getElementById(tabId + 'Section').classList.add('active');
}

// --- SAVE SETTINGS ---
function saveSettings() {
    const settings = {
        // Store Info
        storeName: document.getElementById('storeName').value,
        storePhone: document.getElementById('storePhone').value,
        storeAddress: document.getElementById('storeAddress').value,
        
        // Receipt Preferences
        showAddress: document.getElementById('toggleAddress').checked,
        showPhone: document.getElementById('togglePhone').checked,
        showDesc: document.getElementById('toggleDesc').checked,
        receiptDesc: document.getElementById('receiptDesc').value
    };

    localStorage.setItem('swiftPosSettings', JSON.stringify(settings));
    alert("Settings Saved Successfully!");
}

// --- LOAD SETTINGS ---
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('swiftPosSettings'));
    if (!settings) return;

    // Fill Inputs
    if(document.getElementById('storeName')) document.getElementById('storeName').value = settings.storeName || "";
    if(document.getElementById('storePhone')) document.getElementById('storePhone').value = settings.storePhone || "";
    if(document.getElementById('storeAddress')) document.getElementById('storeAddress').value = settings.storeAddress || "";
    if(document.getElementById('receiptDesc')) document.getElementById('receiptDesc').value = settings.receiptDesc || "";

    // Set Toggles
    if(document.getElementById('toggleAddress')) document.getElementById('toggleAddress').checked = settings.showAddress;
    if(document.getElementById('togglePhone')) document.getElementById('togglePhone').checked = settings.showPhone;
    if(document.getElementById('toggleDesc')) document.getElementById('toggleDesc').checked = settings.showDesc;
}