// Check for markdown code block
function hasMarkdownCodeBlock(text) {
  return /```[\s\S]*?```/.test(text);
}

// Capture copy event
document.addEventListener('copy', async (e) => {
  try {
    const selection = window.getSelection();
    if (!selection) return;
    
    const selectedText = selection.toString();
    if (!selectedText) return;
    
    // Check if text contains markdown code block
    if (hasMarkdownCodeBlock(selectedText)) {
      // Notify background script
      try {
        await chrome.runtime.sendMessage({
          type: 'MARKDOWN_COPIED',
          text: selectedText
        });
      } catch (err) {
        console.error('Error sending message to background script:', err);
      }
    }
  } catch (err) {
    console.error('Error capturing copy event:', err);
  }
}); 