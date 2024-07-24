chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showSuggestions') {
      displaySuggestions(request.suggestions);
    }
  });
  
  function displaySuggestions(suggestions) {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.style.position = 'fixed';
    suggestionsDiv.style.top = '0';
    suggestionsDiv.style.right = '0';
    suggestionsDiv.style.backgroundColor = 'white';
    suggestionsDiv.style.border = '1px solid black';
    suggestionsDiv.style.padding = '10px';
    suggestionsDiv.style.zIndex = '10000';
  
    const title = document.createElement('h4');
    title.innerText = 'Sustainable Alternatives';
    suggestionsDiv.appendChild(title);
  
    suggestions.forEach(suggestion => {
      const suggestionElement = document.createElement('p');
      suggestionElement.innerText = suggestion;
      suggestionsDiv.appendChild(suggestionElement);
    });
  
    document.body.appendChild(suggestionsDiv);
  }
  