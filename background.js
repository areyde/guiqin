chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "lookupWord",
        title: "Look up '%s' in Spreadsheet",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "lookupWord") {
        const selectedText = info.selectionText.trim();
        const result = await lookupWordInCSV(selectedText);
        chrome.tabs.sendMessage(tab.id, { word: selectedText, result: result });
    }
});

async function lookupWordInCSV(word) {
    const sheetId = "1SxoqHYYJOBF0TBHHkFJfwIR6RuQzfbr5c4wXn8cR54M";
    const sheetName = "My words"; // Replace with your sheet name
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const rows = csvText.split("\n").map(row => row.split(","));

        const matchingRow = rows.find(row => row.includes(word));

        return matchingRow ? matchingRow : "Word not found";
    } catch (error) {
        console.error("Error fetching CSV data:", error);
        return "Error fetching data";
    }
}