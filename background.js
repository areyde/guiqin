try {
    importScripts('papaparse.min.js');
} catch (e) {
    console.error('Failed to load PapaParse:', e);
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "lookupWord",
        title: "Look up '%s' in 中文数据库",
        contexts: ["selection"]
    });
    console.log("Context menu created");
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("Context menu clicked, selected text:", info.selectionText);
    if (info.menuItemId === "lookupWord") {
        const selectedText = info.selectionText.trim();
        const result = await lookupWordInCSV(selectedText);
        console.log("Result from CSV lookup:", result);

        const resultText = result === "Word not found" ? result : JSON.stringify(result);

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: displayResultDirectly,
            args: [resultText]
        });
    }
});


function displayResultDirectly(resultText) {
    let result = resultText;
    try {
        result = JSON.parse(resultText);
    } catch (e) {
        // If parsing fails, keep the original resultText
    }

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const bubble = document.createElement("div");
    bubble.style.position = "absolute";
    bubble.style.left = `${rect.right + window.scrollX}px`;
    bubble.style.top = `${rect.top + window.scrollY}px`;
    bubble.style.padding = "10px";
    bubble.style.backgroundColor = "white";
    bubble.style.color = "black";
    bubble.style.zIndex = "10000";
    bubble.style.borderRadius = "5px";
    bubble.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.1)";
    bubble.style.width = "300px";
    bubble.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(bubble);

    const content = document.createElement("div");
    content.innerHTML = result === "Word not found" ? "<strong>Not found</strong>" : `
        🎉 You already learned this word!<br><br>
        <strong>Word:</strong> ${result[7]}<br>
        <strong>Pronunciation:</strong> ${result[9]}<br>
        <strong>Meaning:</strong> ${result[10]}<br><br>
        <strong>Frequency:</strong> ${result[2]}<br>
        <strong>HSK 2.0 level:</strong> ${result[5] ? result[5] : "—"}<br>
        <strong>HSK 3.0 band:</strong> ${result[6] ? result[6] : "—"}
    `;

    bubble.appendChild(content);

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.float = "right";
    closeButton.style.color = "black";
    closeButton.style.border = "none";
    closeButton.style.background = "none";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = function() {
        bubble.remove();
    };

    bubble.appendChild(closeButton);

    document.addEventListener('click', function(event) {
        if (!bubble.contains(event.target)) {
            bubble.remove();
        }
    }, { capture: true, once: true });
}


async function lookupWordInCSV(word) {
    console.log("Looking up word in CSV:", word);
    const sheetId = "1SxoqHYYJOBF0TBHHkFJfwIR6RuQzfbr5c4wXn8cR54M";
    const sheetName = "My words";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

    try {
        const response = await fetch(url);
        const csvText = await response.text();

        // Use PapaParse to parse the CSV
        const rows = Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            dynamicTyping: true
        }).data;

        console.log("CSV data fetched and parsed:", rows);

        const normalizedWord = word.trim().normalize("NFC");

        // Search for the word in the cleaned rows
        const matchingRow = rows.find(row =>
            row.some(cell => String(cell).normalize("NFC") === normalizedWord)
        );

        console.log("Matching row:", matchingRow);

        return matchingRow ? matchingRow : "Word not found";
    } catch (error) {
        console.error("Error fetching CSV data:", error);
        return "Error fetching data";
    }
}



