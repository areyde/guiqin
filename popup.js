// Initial setup for the status text
document.addEventListener('DOMContentLoaded', () => {
    updateStatus("Checking status...", "#666666");  // Blue color for neutral initial status
});

document.getElementById('loadCache').addEventListener('click', async () => {
    updateStatus("Loading...", "#040273");  // Immediately show loading status on action
    chrome.runtime.sendMessage({ action: "loadCache" });
});

document.getElementById('clearCache').addEventListener('click', () => {
    updateStatus("Clearing...", "#040273");  // Immediately show clearing status on action
    chrome.runtime.sendMessage({ action: "clearCache" });
});

function updateStatus(text, color) {
    const status = document.getElementById('status');
    status.textContent = text;
    status.style.color = color;
}

// Request the current cache status when the popup opens
chrome.runtime.sendMessage({ action: "getCacheStatus" });

// Handle messages from the background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateStatus") {
        if (message.isLoading) {
            updateStatus("Loading...", "#040273");
        } else {
            const color = message.status ? "#02590f" : "#8B0000";  // Loaded in green, not loaded in red
            updateStatus(message.status ? "Loaded" : "Not Loaded", color);
        }
    }
});