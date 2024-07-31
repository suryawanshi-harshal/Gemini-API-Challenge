const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');

class GeminiProvider {
  constructor(token, baseUrl, model) {
    this.genAI = new GoogleGenerativeAI(token);
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateAnswer(params) {
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model, safetySettings }, { baseUrl: this.baseUrl });
      const result = await model.generateContentStream({ prompt: params.prompt });
      let text = '';

      for await (const chunk of result.stream) {
        if (chunk && typeof chunk.text === 'function') {
          text += await chunk.text();
          console.debug('Chunk text:', text);
        } else {
          console.error('Invalid chunk:', chunk);
        }
      }

      params.onEvent({ type: 'answer', data: { text, messageId: '', conversationId: '' } });
      params.onEvent({ type: 'done' });
    } catch (error) {
      console.error('Error generating answer:', error);
      throw error;
    }
  }
}

let provider;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['GEMINI_API_KEY'], (result) => {
    if (result.GEMINI_API_KEY) {
      provider = new GeminiProvider(result.GEMINI_API_KEY, 'https://generativelanguage.googleapis.com', 'gemini-1.5-flash');
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveKey') {
    console.log('Received saveKey request:', request.apiKey);

    chrome.storage.local.set({ 'GEMINI_API_KEY': request.apiKey }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting API key:', chrome.runtime.lastError);
        sendResponse({ status: 'error' });
      } else {
        console.log('API key set successfully');
        sendResponse({ status: 'success' });
      }
    });
    return true; // Keep the message channel open for sendResponse
  }

  if (request.action === 'analyzeTab') {
    console.log('Received analyzeTab request');

    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing tab:', chrome.runtime.lastError);
        sendResponse({ status: 'error', error: chrome.runtime.lastError.message });
        return;
      }

      console.log('Captured tab screenshot:', dataUrl);

      try {
        const analysis = await analyzeScreenshot(dataUrl);
        console.log('Analysis result:', analysis);
        chrome.tabs.sendMessage(sender.tab.id, { action: 'showSuggestions', suggestions: analysis.contents });
        sendResponse({ status: 'success' });
      } catch (error) {
        console.error('Error analyzing screenshot:', error);
        sendResponse({ status: 'error', error: error.message });
      }
    });

    return true; // Keep the message channel open for sendResponse
  }
});

async function analyzeScreenshot(screenshot) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('GEMINI_API_KEY', async (result) => {
      const GEMINI_API_KEY = result.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        reject('API key not found');
        return;
      }

      if (!provider) {
        provider = new GeminiProvider(GEMINI_API_KEY, 'https://generativelanguage.googleapis.com', 'gemini-1.5-flash');
      }

      const params = {
        prompt: `Analyze this screenshot for sustainable alternatives: ${screenshot}`,
        onEvent: (event) => {
          if (event.type === 'answer') {
            resolve({ contents: event.data.text });
          }
        }
      };

      try {
        await provider.generateAnswer(params);
      } catch (error) {
        console.error('Fetch error:', error);
        reject(error);
      }
    });
  });
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.startsWith("chrome://") && !tab.url.startsWith("https://chrome.google.com/webstore")) {
    chrome.runtime.sendMessage({ action: 'analyzeTab', tabId: tab.id });
  }
});
