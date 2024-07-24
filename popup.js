document.getElementById('saveApiKey').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  if (apiKey) {
    chrome.storage.local.set({ GEMINI_API_KEY: apiKey }, () => {
      console.log('API key saved');
      alert('API key saved successfully');
    });
  } else {
    alert('Please enter a valid API key');
  }
});

document.getElementById('analyzeBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.runtime.sendMessage({ action: 'analyzeTab', tabId: tabs[0].id });
    }
  });
});
