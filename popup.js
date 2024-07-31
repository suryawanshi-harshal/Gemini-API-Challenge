document.getElementById('saveKey').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  console.log('Attempting to save API key:', apiKey);

  chrome.runtime.sendMessage({ action: 'saveKey', apiKey: apiKey }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      alert('Error saving API key.');
    } else if (response && response.status === 'success') {
      console.log('API key saved successfully:', response);
      alert('API key saved');
    } else {
      console.error('Failed to save API key:', response);
      alert('Failed to save API key');
    }
  });
});


document.getElementById('analyze').addEventListener('click', () => {
  console.log('Attempting to analyze current tab');

  chrome.runtime.sendMessage({ action: 'analyzeTab' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      alert('Error initiating analysis.');
    } else if (response && response.status === 'success') {
      console.log('Analysis initiated:', response);
    } else {
      console.error('Failed to initiate analysis', response);
      alert('Failed to initiate analysis');
    }
  });
});

