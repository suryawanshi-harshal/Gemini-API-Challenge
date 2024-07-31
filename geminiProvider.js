// geminiProvider.js

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
  