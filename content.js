chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.result) {
        displayResult(message.word, message.result);
    }
});

function displayResult(word, result) {
    const bubble = document.createElement("div");
    bubble.className = "result-bubble";
    bubble.textContent = typeof result === "string" ? result : `Result for '${word}': ${result.join(", ")}`;
    document.body.appendChild(bubble);

    setTimeout(() => {
        bubble.remove();
    }, 5000);
}