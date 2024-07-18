// Function to capture the current tab's screenshot
function captureScreenshot() {
    return new Promise((resolve) => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            resolve(dataUrl);
        });
    });
}

// Function to send the screenshot to Gemini AI for analysis
async function analyzeScreenshot(screenshot) {
    const apiKey = 'YOUR_GEMINI_API_KEY';
    const apiUrl = 'https://api.gemini.ai/v1/analyze'; // Replace with actual Gemini AI endpoint

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            image: screenshot,
            task: 'analyze_for_sustainable_alternatives'
        })
    });

    return response.json();
}

// Function to display suggestions
function displaySuggestions(suggestions) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showSuggestions', suggestions });
    });
}

// Listen for the extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    try {
        const screenshot = await captureScreenshot();
        const analysis = await analyzeScreenshot(screenshot);
        displaySuggestions(analysis.suggestions);
    } catch (error) {
        console.error('Error:', error);
    }
});

