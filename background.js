try {
    importScripts('papaparse.min.js');
} catch (e) {
    console.error('Failed to load PapaParse:', e);
}

let cachedData = {
    "All Words (Frequency)": null,
    "All Characters (Frequency)": null
};
let cacheTimer = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "loadCache") {
        loadDataToCache();
    } else if (message.action === "clearCache") {
        clearCache();
    }
});

async function loadDataToCache() {
    console.log("Loading data to cache...")
    cachedData["All Words (Frequency)"] = await fetchCSVData("All Words (Frequency)");
    cachedData["All Characters (Frequency)"] = await fetchCSVData("All Characters (Frequency)");
    resetCacheTimer();
    console.log(`Cache loaded... Timer is ${cacheTimer}`)
}

function clearCache() {
    console.log("Clearing cache...")
    cachedData["All Words (Frequency)"] = null;
    cachedData["All Characters (Frequency)"] = null;
    clearTimeout(cacheTimer);
    cacheTimer = null;
    console.log("Cache cleared...")
}

function resetCacheTimer() {
    clearTimeout(cacheTimer);
    cacheTimer = setTimeout(clearCache, 1800000); // 30 minutes
}

async function fetchCSVData(sheetName) {
    console.log("Fetching data to cache...")
    const sheetId = "1SxoqHYYJOBF0TBHHkFJfwIR6RuQzfbr5c4wXn8cR54M";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    const response = await fetch(url);
    console.log(`Fetched data to cache... Timer is ${cacheTimer}`)
    return response.text();
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "lookupWord",
        title: "Look up \"%s\" in 中文数据库",
        contexts: ["selection"]
    });
    console.log("Context menu created");
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const selectedText = info.selectionText.trim();
    const searchType = selectedText.length === 1 ? "character" : "word";
    const sheetOrder = searchType === "character" ? ["My characters", "All Characters (Frequency)"] : ["My words", "All Words (Frequency)"];

    let result, sourceSheet;
    for (const sheetName of sheetOrder) {
        result = await lookupWordInCSV(selectedText, sheetName);
        if (result) {
            sourceSheet = sheetName;
            break;
        }
    }

    const resultData = {
        result: result ? result : `This ${searchType} is not in our database`,
        sheetName: result ? sourceSheet : "Not found",
        searchType  // Include search type for custom "not found" messages
    };

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: displayResultDirectly,
        args: [JSON.stringify(resultData)]
    });
});

function displayResultDirectly(resultText) {
    let data;
    try {
        data = JSON.parse(resultText);
    } catch (e) {
        data = { result: resultText, sheetName: null, searchType: 'word' }; // Default to 'word' if parsing fails
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
    bubble.style.width = "350px";
    bubble.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(bubble);

    const content = document.createElement("div");
    if (data.sheetName !== "Not found") {
        switch (data.sheetName) {
            case "My words":
                content.innerHTML = `
        <div>
            🥳 You <strong style="color:#02590f">already learned</strong> this word!<br><br>
            <strong>Word:</strong> ${data.result[7]}<br>
            <strong>Pronunciation:</strong> ${data.result[9]}<br>
            <strong>Meaning:</strong> ${data.result[10]}<br><br>
            <strong>Frequency:</strong> ${data.result[2]}<br>
            <strong>HSK 2.0 level:</strong> ${data.result[5] ? data.result[5] : "—"}<br>
            <strong>HSK 3.0 band:</strong> ${data.result[6] ? data.result[6] : "—"}
        </div>`;
                break;
            case "All Words (Frequency)":
                if (parseInt(data.result[2]) <= 5000 || data.result[6] !== null || data.result[7] !== null ) {
                    content.innerHTML = `
        <div>
            🎓 You haven't learned this word but <strong style="color:#8B0000">need to</strong>!<br><br>
            <strong>Word:</strong> ${data.result[2]}<br><br>
            <strong>Frequency:</strong> ${data.result[3]}<br>
            <strong>HSK 2.0 level:</strong> ${data.result[6] ? data.result[6] : "—"}<br>
            <strong>HSK 3.0 band:</strong> ${data.result[7] ? data.result[7] : "—"}
        </div>`;
                    break;
                }
            else {
                    content.innerHTML = `
        <div>
            🧠 You haven't learned this word but <strong style="color:#040273">don't need to</strong>, it's rare!<br><br>
            <strong>Word:</strong> ${data.result[2]}<br><br>
            <strong>Frequency:</strong> ${data.result[3]}<br>
            <strong>HSK 2.0 level:</strong> ${data.result[6] ? data.result[6] : "—"}<br>
            <strong>HSK 3.0 band:</strong> ${data.result[7] ? data.result[7] : "—"}
        </div>`;
                    break;
                }
            case "My characters":
                content.innerHTML = `
        <div>
            🥳 You <strong style="color:#02590f">already learned</strong> this character!<br><br>
            <strong>Character:</strong> ${data.result[9]}<br>
            <strong>Traditional:</strong> ${data.result[10] ? data.result[10] : "—"}<br>
            <strong>Pronunciation:</strong> ${data.result[11]}<br>
            <strong>Meaning:</strong> ${data.result[16]}<br><br>
            <strong>Frequency:</strong> ${data.result[2]}<br>
            <strong>General standard:</strong> ${data.result[3] ? data.result[3] : "—"}<br>
            <strong>HSK 2.0 level:</strong> ${data.result[6] ? data.result[6] : "—"}<br>
            <strong>HSK 3.0 band:</strong> ${data.result[7] ? data.result[7] : "—"}
        </div>`;
                break;
            case "All Characters (Frequency)":
                content.innerHTML = `
        <div>
            🎓 You <strong style="color:#8B0000">haven't yet learned</strong> this character!<br><br>
            <strong>Character:</strong> ${data.result[10]}<br>
            <strong>Pronunciation:</strong> ${data.result[11]}<br>
            <strong>Meaning:</strong> ${data.result[14]}<br><br>
            <strong>Frequency:</strong> ${data.result[2]}<br>
            <strong>General standard:</strong> ${data.result[3] ? data.result[3] : "—"}<br>
            <strong>HSK 2.0 level:</strong> ${data.result[7] ? data.result[7] : "—"}<br>
            <strong>HSK 3.0 band:</strong> ${data.result[8] ? data.result[8] : "—"}
        </div>        
                `;
                break;
        }
    } else {
        if (data.searchType === "character") {
            content.innerHTML = `🤯 Either this is not a Chinese character or it is so rare it is not even in our database.`
        }
        else {
            content.innerHTML = `🤯 Either this is not a Chinese word or it is so rare it is not even in our database.`
        }
    }

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

function processData(csvText, word) {
    const rows = Papa.parse(csvText, { header: false, skipEmptyLines: true, dynamicTyping: true }).data;
    const normalizedWord = word.trim().normalize("NFC");
    return rows.find(row => row.some(cell => String(cell).normalize("NFC") === normalizedWord)) || null;
}

async function lookupWordInCSV(word, sheetName) {
    console.log(`Looking up word '${word}' in sheet: ${sheetName}`);
    const sheetId = "1SxoqHYYJOBF0TBHHkFJfwIR6RuQzfbr5c4wXn8cR54M";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

    if (cachedData[sheetName]) {
        console.log(`Using cache... Timer is ${cacheTimer}`)
        return processData(cachedData[sheetName], word);
    } else {
        console.log("Not using cash...")
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

            console.log("Final row:", matchingRow);

            return matchingRow ? matchingRow : null;
        } catch (error) {
            console.error("Error fetching CSV data:", error);
            return null;
        }
    }
}
