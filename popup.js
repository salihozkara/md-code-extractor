// Load JSZip library directly
let codeBlocks = [];

// Default language extensions
let languageExtensions = {
  // General programming languages
  javascript: {
    ext: 'js',
    namePattern: 'class\\s+([A-Za-z_$][\\w$]*)|function\\s+([A-Za-z_$][\\w$]*)'
  },
  typescript: {
    ext: 'ts',
    namePattern: 'class\\s+([A-Za-z_$][\\w$]*)|interface\\s+([A-Za-z_$][\\w$]*)|function\\s+([A-Za-z_$][\\w$]*)'
  },
  python: {
    ext: 'py',
    namePattern: 'class\\s+([A-Za-z_][\\w]*)|def\\s+([A-Za-z_][\\w]*)'
  },
  java: {
    ext: 'java',
    namePattern: 'public\\s+class\\s+([A-Za-z_$][\\w$]*)|class\\s+([A-Za-z_$][\\w$]*)'
  },
  cpp: {
    ext: 'cpp',
    namePattern: 'class\\s+([A-Za-z_][\\w]*)|void\\s+([A-Za-z_][\\w]*)'
  },
  'c++': {
    ext: 'cpp',
    namePattern: 'class\\s+([A-Za-z_][\\w]*)|void\\s+([A-Za-z_][\\w]*)'
  },
  csharp: {
    ext: 'cs',
    namePattern: '(?:public|private|protected|internal)?\\s+class\\s+([A-Za-z_][\\w]*)|(?:public|private|protected|internal)?\\s+interface\\s+([A-Za-z_][\\w]*)'
  },
  'c#': {
    ext: 'cs',
    namePattern: '(?:public|private|protected|internal)?\\s+class\\s+([A-Za-z_][\\w]*)|(?:public|private|protected|internal)?\\s+interface\\s+([A-Za-z_][\\w]*)'
  },
  php: {
    ext: 'php',
    namePattern: 'class\\s+([A-Za-z_][\\w]*)|function\\s+([A-Za-z_][\\w]*)'
  },
  
  // Web technologies
  html: {
    ext: 'html',
    namePattern: '<title>([^<]*)</title>'
  },
  css: {
    ext: 'css',
    namePattern: null
  },
  scss: {
    ext: 'scss',
    namePattern: null
  },
  
  // Other languages for default extensions
  ruby: { ext: 'rb', namePattern: 'class\\s+([A-Za-z_][\\w]*)' },
  go: { ext: 'go', namePattern: 'func\\s+([A-Za-z_][\\w]*)' },
  rust: { ext: 'rs', namePattern: 'fn\\s+([A-Za-z_][\\w]*)' },
  swift: { ext: 'swift', namePattern: 'class\\s+([A-Za-z_][\\w]*)' },
  kotlin: { ext: 'kt', namePattern: 'class\\s+([A-Za-z_][\\w]*)' },
  scala: { ext: 'scala', namePattern: 'class\\s+([A-Za-z_][\\w]*)' },
  
  // Other formats for simple extensions
  json: { ext: 'json', namePattern: null },
  yaml: { ext: 'yml', namePattern: null },
  yml: { ext: 'yml', namePattern: null },
  xml: { ext: 'xml', namePattern: null },
  sql: { ext: 'sql', namePattern: null },
  bash: { ext: 'sh', namePattern: null },
  shell: { ext: 'sh', namePattern: null },
  powershell: { ext: 'ps1', namePattern: null },
  batch: { ext: 'bat', namePattern: null },
  perl: { ext: 'pl', namePattern: null },
  markdown: { ext: 'md', namePattern: null },
  text: { ext: 'txt', namePattern: null },
  txt: { ext: 'txt', namePattern: null },
  plain: { ext: 'txt', namePattern: null }
};

// Load settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('languageExtensions');
    if (result.languageExtensions) {
      languageExtensions = result.languageExtensions;
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

// Save settings
async function saveSettings() {
  try {
    await chrome.storage.sync.set({ languageExtensions });
    document.getElementById('error-message').textContent = 'Settings saved';
    setTimeout(() => {
      document.getElementById('error-message').textContent = '';
    }, 2000);
  } catch (err) {
    console.error('Error saving settings:', err);
    document.getElementById('error-message').textContent = 'Error saving settings';
  }
}

// Show extension list
function displayExtensions() {
  const container = document.getElementById('extensionList');
  container.innerHTML = '';
  
  Object.entries(languageExtensions).forEach(([lang, config]) => {
    const item = document.createElement('div');
    item.className = 'extension-item';
    
    const langInput = document.createElement('input');
    langInput.value = lang;
    langInput.placeholder = 'Language name';
    
    const extInput = document.createElement('input');
    extInput.value = config.ext || '';
    extInput.placeholder = 'Extension';
    
    const patternInput = document.createElement('input');
    patternInput.value = config.namePattern || '';
    patternInput.placeholder = 'Filename pattern (regex)';
    patternInput.className = 'pattern-input';
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️';
    deleteButton.onclick = () => {
      delete languageExtensions[lang];
      displayExtensions();
    };
    
    item.appendChild(langInput);
    item.appendChild(document.createTextNode(' → '));
    item.appendChild(extInput);
    item.appendChild(patternInput);
    item.appendChild(deleteButton);
    
    // Watch for changes
    [langInput, extInput, patternInput].forEach(input => {
      input.addEventListener('change', () => {
        if (langInput.value && extInput.value) {
          delete languageExtensions[lang];
          languageExtensions[langInput.value.toLowerCase()] = {
            ext: extInput.value,
            namePattern: patternInput.value || null
          };
          displayExtensions();
        }
      });
    });
    
    container.appendChild(item);
  });
}

// Add new extension
function addNewExtension() {
  languageExtensions['new_language'] = {
    ext: 'ext',
    namePattern: null
  };
  displayExtensions();
}

// Toggle settings panel
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') {
    displayExtensions();
  }
}

// Extract filename from code using regex pattern
function extractFilenameFromCode(code, language) {
  const config = languageExtensions[language];
  if (!config || !config.namePattern) return null;

  try {
    const regex = new RegExp(config.namePattern, 'm');
    const match = code.match(regex);
    if (match) {
      // Return first non-null capturing group
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          // Clean and format the filename
          let fileName = match[i].trim();
          return fileName;
        }
      }
    }
  } catch (err) {
    console.error('Regex pattern error:', err);
  }
  return null;
}

// Get file extension for language
function getFileExtension(language) {
  const normalizedLang = language.toLowerCase().trim();
  
  // Check language extensions
  const config = languageExtensions[normalizedLang];
  if (config) {
    return config.ext || normalizedLang;
  }
  
  // Fallback analysis for unknown languages
  if (normalizedLang.includes('script') || normalizedLang.includes('js')) return 'js';
  if (normalizedLang.includes('style') || normalizedLang.includes('css')) return 'css';
  if (normalizedLang.includes('html') || normalizedLang.includes('xml')) return 'html';
  if (normalizedLang.includes('python') || normalizedLang.includes('py')) return 'py';
  if (normalizedLang.includes('java')) return 'java';
  if (normalizedLang.includes('shell') || normalizedLang.includes('bash')) return 'sh';
  if (normalizedLang.includes('sql')) return 'sql';
  if (normalizedLang.includes('csharp') || normalizedLang.includes('c#')) return 'cs';
  
  return 'txt';
}

// Markdown code block extraction with smart naming
function extractCodeBlocks(markdown) {
  const regex = /```(\w+)?[\r\n]+([\s\S]*?)```/g;
  const blocks = [];
  let blockCount = {};
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    try {
      let language = (match[1] || '').trim().toLowerCase();
      language = language
        .replace(/^(language-|lang-)/, '')
        .replace(/\s+/g, '');
      
      const code = match[2].trim();
      if (!code) continue;

      // Dil belirtilmemişse veya 'code' ise içerikten tespit et
      if (!language || language === 'code') {
        language = detectLanguageFromContent(code);
      }

      // C# için özel kontrol
      if (code.includes('using System') || code.includes('Console.WriteLine')) {
        language = 'csharp';
      }
      // Java için özel kontrol
      else if (code.includes('public static void main') || 
              (code.includes('public class') && !code.includes('using System'))) {
        language = 'java';
      }
      
      // Get extension
      const extension = getFileExtension(language);
      
      // Try to extract filename from code
      let fileName = null;
      if (language) {
        fileName = extractFilenameFromCode(code, language);
      }
      
      // If no filename found, use default naming
      if (!fileName) {
        blockCount[extension] = (blockCount[extension] || 0) + 1;
        fileName = blockCount[extension] > 1 
          ? `code${blockCount[extension]}`
          : 'code';
      }
      
      // Sanitize filename
      fileName = sanitizeFileName(fileName);
      
      blocks.push({
        language,
        code,
        fileName: `${fileName}.${extension}`,
        originalLanguage: match[1] || ''
      });
    } catch (err) {
      console.error('Error processing code block:', err);
      continue;
    }
  }

  return blocks;
}

// Detect language from content
function detectLanguageFromContent(text) {
  const indicators = {
    csharp: {
      keywords: ['using System', 'namespace', 'public class', 'private class', 'protected class', 
                'internal class', 'Console.WriteLine', 'string[]', 'int[]', 'var ', 'async Task',
                'IEnumerable', 'ICollection', 'IList', '.NET', 'Microsoft.'],
      mustInclude: ['using System']  // Required indicator for C#
    },
    java: {
      keywords: ['public class', 'private class', 'protected class', 'System.out.println',
                'public static void main', 'String[]', 'extends', 'implements', 'import java.',
                'ArrayList<', 'HashMap<', '@Override'],
      mustInclude: ['public class', 'java']  // Required indicator for Java
    },
    python: {
      keywords: ['def ', 'class ', 'import ', 'from ', '__init__', 'self.', 'print(', 'if __name__'],
      mustInclude: ['def ', 'import ']
    },
    javascript: {
      keywords: ['const ', 'let ', 'function', '=>', 'export ', 'import ', 'require(', 'module.exports'],
      mustInclude: ['const ', 'let ']
    }
  };

  // First check for required indicators
  for (const [lang, config] of Object.entries(indicators)) {
    if (config.mustInclude && config.mustInclude.some(keyword => text.includes(keyword))) {
      // Also check other keywords for additional validation
      const keywordMatches = config.keywords.filter(keyword => text.includes(keyword));
      if (keywordMatches.length >= 2) {  // At least 2 matches required
        return lang;
      }
    }
  }

  // If no required indicator found, find the language with most matches
  let maxScore = 0;
  let detectedLang = 'text';

  for (const [lang, config] of Object.entries(indicators)) {
    const keywordMatches = config.keywords.filter(keyword => text.includes(keyword));
    const score = keywordMatches.length / config.keywords.length;
    
    if (score > maxScore && score >= 0.3) {  // At least 30% match required
      maxScore = score;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

// Display code blocks
function displayCodeBlocks() {
  const container = document.getElementById('codeBlocks');
  const saveAllButton = document.getElementById('saveAll');
  
  if (codeBlocks.length === 0) {
    container.innerHTML = `
      <div class="no-blocks">
        <div class="icon">📝</div>
        <div class="message">No code blocks found yet</div>
        <div class="hint">Enter or paste markdown code blocks</div>
      </div>`;
    saveAllButton.style.display = 'none';
    return;
  }

  container.innerHTML = '';

  // Show summary info
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'blocks-summary';
  const extensionCounts = codeBlocks.reduce((acc, block) => {
    const ext = block.fileName.split('.').pop();
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {});
  
  const summaryText = Object.entries(extensionCounts)
    .map(([ext, count]) => `${count} .${ext} files`)
    .join(', ');
  summaryDiv.innerHTML = `
    <span class="icon">📊</span>
    Found ${codeBlocks.length} code blocks (${summaryText})
  `;
  container.appendChild(summaryDiv);

  // Create element for each code block
  codeBlocks.forEach((block, index) => {
    const blockElement = document.createElement('div');
    blockElement.className = 'code-block';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'code-block-header';
    
    const fileNameDiv = document.createElement('div');
    fileNameDiv.className = 'file-name';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = block.fileName;
    input.title = 'Click to edit filename';
    input.addEventListener('change', (e) => {
      block.fileName = sanitizeFileName(e.target.value);
      input.value = block.fileName;
    });
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'code-actions';
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'code-action-btn';
    copyButton.innerHTML = '📋 Copy';
    copyButton.title = 'Copy code to clipboard';
    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(block.code);
        copyButton.innerHTML = '✅ Copied';
        setTimeout(() => {
          copyButton.innerHTML = '📋 Copy';
        }, 2000);
      } catch (err) {
        console.error('Copy error:', err);
      }
    };
    
    fileNameDiv.appendChild(input);
    actionsDiv.appendChild(copyButton);
    headerDiv.appendChild(fileNameDiv);
    headerDiv.appendChild(actionsDiv);
    blockElement.appendChild(headerDiv);
    
    const pre = document.createElement('pre');
    pre.className = 'code-content';
    pre.textContent = block.code;
    blockElement.appendChild(pre);
    
    container.appendChild(blockElement);
  });
  
  saveAllButton.style.display = 'block';
}

// Create code block element
function createCodeBlockElement(block, index) {
  const blockElement = document.createElement('div');
  blockElement.className = 'code-block';
  
  const fileNameDiv = document.createElement('div');
  fileNameDiv.className = 'file-name';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = block.fileName;
  input.addEventListener('change', (e) => {
    block.fileName = sanitizeFileName(e.target.value);
    input.value = block.fileName;
  });
  
  const lines = block.code.split('\n');
  const totalLines = lines.length;
  
  fileNameDiv.appendChild(input);
  blockElement.appendChild(fileNameDiv);
  
  // Line count info
  const lineCount = document.createElement('div');
  lineCount.className = 'line-count';
  lineCount.textContent = `${totalLines} lines`;
  blockElement.appendChild(lineCount);
  
  const pre = document.createElement('pre');
  if (totalLines > 10) {
    const firstLines = lines.slice(0, 5).join('\n');
    const lastLines = lines.slice(-5).join('\n');
    pre.textContent = `${firstLines}\n\n... (${totalLines - 10} more lines) ...\n\n${lastLines}`;
    
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show All Code';
    toggleButton.className = 'toggle-code';
    toggleButton.onclick = () => {
      if (toggleButton.textContent === 'Show All Code') {
        pre.textContent = block.code;
        toggleButton.textContent = 'Hide Code';
      } else {
        pre.textContent = `${firstLines}\n\n... (${totalLines - 10} more lines) ...\n\n${lastLines}`;
        toggleButton.textContent = 'Show All Code';
      }
    };
    blockElement.appendChild(toggleButton);
  } else {
    pre.textContent = block.code;
  }
  
  blockElement.appendChild(pre);
  return blockElement;
}

// Check clipboard content
async function checkClipboard() {
  try {
    // Check storage first
    const storage = await chrome.storage.local.get(['lastCopiedMarkdown', 'timestamp']);
    const timeSinceLastCopy = Date.now() - (storage.timestamp || 0);
    
    // Use markdown copied in last 5 seconds
    if (storage.lastCopiedMarkdown && timeSinceLastCopy < 5000) {
      document.getElementById('manual-input').value = storage.lastCopiedMarkdown;
      processInput(storage.lastCopiedMarkdown);
      
      // Clear storage
      chrome.storage.local.remove(['lastCopiedMarkdown', 'timestamp']);
      return;
    }

    // Try clipboard access
    const permissionStatus = await navigator.permissions.query({ name: 'clipboard-read' });
    
    if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
      const text = await navigator.clipboard.readText();
      if (text) {
        document.getElementById('manual-input').value = text;
        // Automatically check for code blocks
        const hasCodeBlock = /```[\s\S]*?```/.test(text);
        if (hasCodeBlock) {
          processInput(text);
          showSuccess('Code blocks processed automatically');
        }
      }
    }
  } catch (err) {
    console.error('Clipboard read error:', err);
  }
}

// Show success message
function showSuccess(message) {
  const successElement = document.createElement('div');
  successElement.className = 'success-message';
  successElement.innerHTML = `<span class="icon">✅</span> ${message}`;
  document.body.appendChild(successElement);
  
  setTimeout(() => {
    successElement.classList.add('fade-out');
    setTimeout(() => successElement.remove(), 500);
  }, 2000);
}

// Show error message
function showError(message) {
  const errorElement = document.getElementById('error-message');
  errorElement.innerHTML = `<span class="icon">⚠️</span> ${message}`;
  errorElement.classList.add('show');
  
  setTimeout(() => {
    errorElement.classList.remove('show');
    setTimeout(() => {
      errorElement.textContent = '';
    }, 300);
  }, 3000);
}

// Process input
function processInput(text) {
  if (!text.trim()) {
    showError('Please enter some text');
    return;
  }
  
  // Show loading
  const container = document.getElementById('codeBlocks');
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <div class="loading-text">Processing code blocks...</div>
    </div>`;
  
  // Process with short delay (to show loading animation)
  setTimeout(() => {
    codeBlocks = extractCodeBlocks(text);
    displayCodeBlocks();
    
    if (codeBlocks.length === 0) {
      showError('No valid code blocks found');
    }
  }, 300);
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  
  // Automatically check clipboard
  checkClipboard().catch(err => {
    console.error('Startup error:', err);
  });
  
  // Paste from clipboard button
  document.getElementById('pasteButton').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        document.getElementById('manual-input').value = text;
        processInput(text);
      } else {
        showError('No text found in clipboard');
      }
    } catch (err) {
      showError('Could not read clipboard');
      console.error('Clipboard read error:', err);
    }
  });
  
  // Listen for paste in textarea
  document.getElementById('manual-input').addEventListener('paste', (e) => {
    setTimeout(() => {
      const text = e.target.value;
      if (text && /```[\s\S]*?```/.test(text)) {
        processInput(text);
        showSuccess('Code blocks processed automatically');
      }
    }, 0);
  });
});

document.getElementById('saveAll').addEventListener('click', () => {
  if (codeBlocks.length === 0) {
    showError('No code blocks to download');
    return;
  }
  createAndDownloadZip();
});

document.getElementById('process-manual').addEventListener('click', () => {
  const text = document.getElementById('manual-input').value;
  processInput(text);
});

document.getElementById('manual-input').addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    document.getElementById('process-manual').click();
  }
});

// Open settings page
document.getElementById('openSettings').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

document.getElementById('settingsButton').addEventListener('click', toggleSettings);
document.getElementById('settingsClose').addEventListener('click', toggleSettings);
document.getElementById('addExtension').addEventListener('click', addNewExtension);
document.getElementById('saveExtensions').addEventListener('click', async () => {
  await saveSettings();
  toggleSettings();
});

// Create and download ZIP file
async function createAndDownloadZip() {
  try {
    const zip = new JSZip();
    
    codeBlocks.forEach(block => {
      zip.file(block.fileName, block.code);
    });
    
    const content = await zip.generateAsync({type: 'blob'});
    const url = URL.createObjectURL(content);
    
    try {
      await chrome.downloads.download({
        url: url,
        filename: 'code_blocks.zip',
        saveAs: true
      });
    } finally {
      // Clean up URL
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('ZIP creation error:', err);
    document.getElementById('error-message').textContent = 'Error creating ZIP file.';
  }
}

// Clean and validate filename
function sanitizeFileName(fileName) {
  // Remove invalid characters
  return fileName.replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .trim();
} 