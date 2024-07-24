// Function to analyze screenshot using Google Gemini API
async function analyzeScreenshot(screenshot) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('GEMINI_API_KEY', async (result) => {
        const GEMINI_API_KEY = result.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
          reject('API key not found');
          return;
        }
  
        const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
  
        // Debugging information
        console.log('API URL:', apiUrl);
        console.log('API Key:', GEMINI_API_KEY);
        console.log('Image Data (first 100 chars):', screenshot.slice(0, 100)); // Log the first 100 characters of the base64 image data
  
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GEMINI_API_KEY}`
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: "Analyze this screenshot for sustainable alternatives."
                    },
                    {
                      image: screenshot, // base64 encoded image data
                      mimeType: "image/png" // Ensure the MIME type matches your image format
                    }
                  ]
                }
              ]
            })
          });
  
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, ${errorText}`);
          }
  
          const data = await response.json();
          console.log(data)
          resolve(data);
        } catch (error) {
          console.error('Fetch error:', error); // Log the error
          reject(error);
        }
      });
    });
  }
  
  // Analyze when extension icon is clicked
  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab || !tab.url) {
      console.error('Tab is undefined or has no URL');
      return;
    }
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
      console.log("Cannot analyze chrome:// pages or the Chrome Web Store");
      return;
    }
    await analyzeCurrentTab(tab);
  });
  
  // Function to capture screenshot
  function captureScreenshot() {
    return new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(dataUrl); // dataUrl is already a base64 encoded image data
        }
      });
    });
  }
  
  // Function to analyze current tab
  async function analyzeCurrentTab(tab) {
    try {
      const screenshot = await captureScreenshot();
      const analysis = await analyzeScreenshot(screenshot);
      chrome.tabs.sendMessage(tab.id, { action: 'showSuggestions', suggestions: analysis.contents });
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  // Handle messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeTab') {
      chrome.tabs.get(request.tabId, async (tab) => {
        await analyzeCurrentTab(tab);
      });
    }
  });
  