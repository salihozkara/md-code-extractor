// Show notification when markdown is copied
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MARKDOWN_COPIED') {
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Markdown Code Block Copied',
      message: 'Click the extension icon to process code blocks',
      priority: 2
    });
    
    // Store copied text
    chrome.storage.local.set({ 
      lastCopiedMarkdown: message.text,
      timestamp: Date.now()
    });
  }
}); 