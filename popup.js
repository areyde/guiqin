document.getElementById('loadCache').addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: "loadCache" });
});

document.getElementById('clearCache').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "clearCache" });
});

// Request the current cache status on popup open
chrome.runtime.sendMessage({ action: "getCacheStatus" });

// Listen for responses from the background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateStatus") {
        const status = document.getElementById('status');
        if (message.status) {
            status.textContent = "Loaded";
            status.style.color = "#02590f";
        } else {
            status.textContent = "Not Loaded";
            status.style.color = "#8B0000";
        }
    }
});
