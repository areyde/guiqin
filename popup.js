document.getElementById('loadCache').addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: "loadCache" });
});

document.getElementById('clearCache').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "clearCache" });
});