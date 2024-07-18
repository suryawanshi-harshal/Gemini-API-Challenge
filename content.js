
// Create a container for suggestions
const suggestionContainer = document.createElement('div');
suggestionContainer.style.cssText = `
position: fixed;
top: 10px;
right: 10px;
width: 300px;
background-color: #f0f0f0;
border: 1px solid #ccc;
border-radius: 5px;
padding: 10px;
z-index: 9999;
`;

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showSuggestions') {
        suggestionContainer.innerHTML = '<h3>Sustainable Alternatives:</h3>';
        request.suggestions.forEach(suggestion => {
            const p = document.createElement('p');
            p.textContent = suggestion;
            suggestionContainer.appendChild(p);
        });
        document.body.appendChild(suggestionContainer);
    }
});
