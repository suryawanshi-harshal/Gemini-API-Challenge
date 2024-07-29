document.getElementById('saveKey').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.local.set({ GEMINI_API_KEY: apiKey }, () => {
    console.log('API key saved');
  });
});

document.getElementById('analyze').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.runtime.sendMessage({ action: 'analyzeTab', tabId: tabs[0].id });
  });
});
