import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import {  GoogleAIFileManager} from "@google/generative-ai/server";

class GeminiProvider {
  constructor(token, baseUrl, model) {
    this.genAI = new GoogleGenerativeAI(token);
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateAnswer(params) {
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    const model = this.genAI.getGenerativeModel(
      { model: this.model, safetySettings },
      { baseUrl: this.baseUrl }
    );

    try {
      const result = await model.generateContentStream(params.prompt);
      let text = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        text += chunkText;
        console.debug("chunkText:", chunkText);
        params.onEvent({
          type: "answer",
          data: { text, messageId: "", conversationId: "" },
        });
      }

      params.onEvent({ type: "done" });
      return { text };
    } catch (error) {
      console.error("Error generating answer:", error);
      throw error;
    }
  }
}

let provider;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["GEMINI_API_KEY"], (result) => {
    if (result.GEMINI_API_KEY) {
      provider = new GeminiProvider(
        result.GEMINI_API_KEY,
        "https://generativelanguage.googleapis.com",
        "gemini-1.5-flash"
      );
    }
  });
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === "analyzeTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
      if (!dataUrl) {
        console.error("Failed to capture screenshot");
        return;
      }
      try {
        const analysis = await analyzeScreenshot(dataUrl);
        console.log("Analysis result:", analysis);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "showSuggestions",
          suggestions: analysis.contents,
        });
      } catch (error) {
        console.error("Error in analyzeTab:", error);
      }
    });
  }
});

async function analyzeScreenshot(screenshot) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("GEMINI_API_KEY", async (result) => {
      const GEMINI_API_KEY = result.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        console.error("API key not found");
        reject("API key not found");
        return;
      }

      if (!provider) {
        provider = new GeminiProvider(
          GEMINI_API_KEY,
          "https://generativelanguage.googleapis.com",
          "gemini-1.5-flash"
        );
        console.log("GeminiProvider created in analyzeScreenshot");
      }

      const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);

      const params = {
        prompt: [
          {
            role: "user",
            parts: [
              { text: "Analyze this screenshot for sustainable alternatives." },
              {
                inlineData: {
                  data: screenshot.split(",")[1],
                  mimeType: "image/png",
                },
              },
            ],
          },
        ],
        onEvent: (event) => {
          console.log("onEvent received:", event);
          if (event.type === "done") {
            resolve({ contents: event.data.text });
          }
        },
      };

      try {
        // Convert the base64 data URL to a Blob
        const [header, base64Data] = screenshot.split(",");
        const mimeString = header.split(":")[1].split(";")[0];
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: mimeString });
        console.log("Uploading to filemanager");

        // Ensure uploadFile accepts Blob correctly
        const uploadResponse = await fileManager.uploadFile(blob, {
          mimeType: mimeString, // Ensure mimeType matches the Blob type
          displayName: "Screenshot",
        });

        console.log("Upload response:", uploadResponse);

        // Call generateAnswer with the upload URL (if needed)
        await provider.generateAnswer(params);
      } catch (error) {
        console.error("Error in analyzeScreenshot:", error);
        reject(error);
      }
    });
  });
}

chrome.browserAction.onClicked.addListener((tab) => {
  if (
    !tab.url.startsWith("chrome://") &&
    !tab.url.startsWith("https://chrome.google.com/webstore")
  ) {
    chrome.runtime.sendMessage({ action: "analyzeTab", tabId: tab.id });
  }
});
