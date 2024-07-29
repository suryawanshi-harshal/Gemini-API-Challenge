import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

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

    const model = this.genAI.getGenerativeModel({ model: this.model, safetySettings }, { baseUrl: this.baseUrl });
    const result = await model.generateContentStream(params.prompt);
    let text = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      text += chunkText;
      console.debug('chunkText:', chunkText);
      params.onEvent({ type: 'answer', data: { text, messageId: '', conversationId: '' } });
    }

    params.onEvent({ type: 'done' });
    return {};
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

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'analyzeTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      try {
        const analysis = await analyzeScreenshot(dataUrl);
        chrome.tabs.sendMessage(sender.tab.id, { action: 'showSuggestions', suggestions: analysis.contents });
      } catch (error) {
        console.error('Error:', error);
      }
    });
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
        prompt: [
          {
            role: "user",
            parts: [
              { text: "Analyze this screenshot for sustainable alternatives." },
              { inlineData: { data: screenshot.split(",")[1], mimeType: "image/png" } }
            ]
          }
        ],
        onEvent: (event) => {
          if (event.type === 'done') {
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

chrome.browserAction.onClicked.addListener((tab) => {  if (!tab.url.startsWith("chrome://") && !tab.url.startsWith("https://chrome.google.com/webstore")) {
  
    chrome.runtime.sendMessage({ action: 'analyzeTab', tabId: tab.id });
  }
});
   