// Default language extensions
const defaultExtensions = {
  // General programming languages
  javascript: {
    ext: 'js',
    namePattern: 'export\\s+(?:default\\s+)?(?:class|function)\\s+([A-Za-z_$][\\w$]*)|class\\s+([A-Za-z_$][\\w$]*)'
  },
  typescript: {
    ext: 'ts',
    namePattern: 'export\\s+(?:default\\s+)?(?:class|function|interface)\\s+([A-Za-z_$][\\w$]*)|class\\s+([A-Za-z_$][\\w$]*)'
  },
  python: {
    ext: 'py',
    namePattern: 'class\\s+([A-Za-z_][\\w]*)|def\\s+([A-Za-z_][\\w]*)'
  },
  java: {
    ext: 'java',
    namePattern: 'public\\s+class\\s+([A-Za-z_$][\\w$]*)'
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
    namePattern: 'class\\s+([A-Za-z_][\\w]*)|interface\\s+([A-Za-z_][\\w]*)'
  },
  'c#': {
    ext: 'cs',
    namePattern: 'class\\s+([A-Za-z_][\\w]*)|interface\\s+([A-Za-z_][\\w]*)'
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
  
  // Data and configuration
  json: {
    ext: 'json',
    namePattern: null
  },
  yaml: {
    ext: 'yml',
    namePattern: null
  },
  xml: {
    ext: 'xml',
    namePattern: null
  },
  
  // Shell and script languages
  bash: {
    ext: 'sh',
    namePattern: '#!/.*?/([^/\\s]+)$'
  },
  shell: {
    ext: 'sh',
    namePattern: '#!/.*?/([^/\\s]+)$'
  },
  
  // Other
  markdown: {
    ext: 'md',
    namePattern: '#\\s+([^\\n]+)'
  },
  text: {
    ext: 'txt',
    namePattern: null
  }
};

// Language groups
const languageGroups = {
  'General Programming': ['javascript', 'typescript', 'python', 'java', 'cpp', 'c++', 'csharp', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala'],
  'Web Technologies': ['html', 'css', 'scss', 'sass', 'less', 'jsx', 'tsx', 'vue'],
  'Data and Configuration': ['json', 'yaml', 'yml', 'xml', 'sql'],
  'Shell and Script': ['bash', 'shell', 'powershell', 'batch', 'perl'],
  'Other': ['markdown', 'text', 'txt', 'plain']
};

let currentExtensions = {};

// Load settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('languageExtensions');
    currentExtensions = result.languageExtensions || {...defaultExtensions};
    displayExtensions();
  } catch (err) {
    showStatus('Error loading settings', 'error');
  }
}

// Display extensions
function displayExtensions(searchTerm = '') {
  const container = document.getElementById('extensionList');
  container.innerHTML = '';
  
  // Convert search term to lowercase
  const searchLower = searchTerm.toLowerCase().trim();
  let hasResults = false;
  let usedLanguages = new Set(); // To prevent duplicates

  // Create a section for each group
  Object.entries(languageGroups).forEach(([groupName, languages]) => {
    const groupExtensions = {};
    const newLanguages = []; // Yeni eklenen diller için ayrı array
    
    // Filter languages for this group
    Object.entries(currentExtensions).forEach(([lang, config]) => {
      // Skip if this language was already shown in another group
      if (usedLanguages.has(lang)) return;

      // If searching
      if (searchLower) {
        if ((lang.toLowerCase().includes(searchLower) || config.ext.toLowerCase().includes(searchLower)) && 
            languages.includes(lang)) {
          if (lang.startsWith('new_language')) {
            newLanguages.push([lang, config]);
          } else {
            groupExtensions[lang] = config;
          }
          usedLanguages.add(lang);
        }
      } 
      // If not searching, just show languages for this group
      else if (languages.includes(lang)) {
        if (lang.startsWith('new_language')) {
          newLanguages.push([lang, config]);
        } else {
          groupExtensions[lang] = config;
        }
        usedLanguages.add(lang);
      }
    });
    
    // Skip group if searching and no results
    if (searchLower && Object.keys(groupExtensions).length === 0 && newLanguages.length === 0) return;
    
    hasResults = true;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'extension-group';
    
    // Group header and add button container
    const headerContainer = document.createElement('div');
    headerContainer.className = 'group-header-container';
    
    const header = document.createElement('div');
    header.className = 'group-header';
    header.textContent = `${groupName} (${Object.keys(groupExtensions).length + newLanguages.length})`;
    
    const addButton = document.createElement('button');
    addButton.className = 'btn btn-small';
    addButton.textContent = '+ New Language';
    addButton.onclick = () => addNewLanguage(groupName);
    
    headerContainer.appendChild(header);
    headerContainer.appendChild(addButton);
    groupDiv.appendChild(headerContainer);
    
    // Sort and display existing languages alphabetically
    const sortedEntries = Object.entries(groupExtensions).sort((a, b) => a[0].localeCompare(b[0]));
    
    sortedEntries.forEach(([lang, config]) => {
      const item = createExtensionItem(lang, config, groupName);
      groupDiv.appendChild(item);
    });

    // Add new languages at the end without sorting
    newLanguages.forEach(([lang, config]) => {
      const item = createExtensionItem(lang, config, groupName);
      groupDiv.appendChild(item);
    });
    
    container.appendChild(groupDiv);
  });

  // Show no results message if needed
  if (!hasResults) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.textContent = searchTerm ? 
      `No results found for "${searchTerm}"` : 
      'No language extensions found';
    container.appendChild(noResults);
  }
}

// Create extension item
function createExtensionItem(lang, config, groupName) {
  const item = document.createElement('div');
  item.className = 'extension-item';
  
  const langInput = document.createElement('input');
  langInput.value = lang;
  langInput.placeholder = 'Language name';
  
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.textContent = '→';
  
  const extInput = document.createElement('input');
  extInput.value = config.ext;
  extInput.placeholder = 'Extension';
  extInput.className = 'ext-input';
  
  const patternInput = document.createElement('input');
  patternInput.value = config.namePattern || '';
  patternInput.placeholder = 'Filename pattern (regex)';
  patternInput.className = 'pattern-input';
  
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '🗑️';
  deleteButton.title = 'Delete';
  deleteButton.onclick = () => {
    delete currentExtensions[lang];
    const index = languageGroups[groupName].indexOf(lang);
    if (index > -1) {
      languageGroups[groupName].splice(index, 1);
    }
    displayExtensions(document.getElementById('searchBox').value);
  };
  
  // Watch for changes
  [langInput, extInput, patternInput].forEach(input => {
    input.addEventListener('change', () => {
      if (langInput.value && extInput.value) {
        // Remove old language
        delete currentExtensions[lang];
        
        // Add new language
        const newLang = langInput.value.toLowerCase();
        currentExtensions[newLang] = {
          ext: extInput.value,
          namePattern: patternInput.value || null
        };
        
        // Yeni dili gruba ekle (eğer yoksa)
        if (!languageGroups[groupName].includes(newLang)) {
          languageGroups[groupName].push(newLang);
        }
        
        displayExtensions(document.getElementById('searchBox').value);
      }
    });
  });
  
  item.appendChild(langInput);
  item.appendChild(arrow);
  item.appendChild(extInput);
  item.appendChild(patternInput);
  item.appendChild(deleteButton);
  
  return item;
}

// Add new language
function addNewLanguage(groupName) {
  // Create unique name
  let newLangName = 'new_language';
  let counter = 1;
  while (currentExtensions[newLangName]) {
    newLangName = `new_language_${counter}`;
    counter++;
  }
  
  // Add new language to specified group at the end
  currentExtensions[newLangName] = {
    ext: 'ext',
    namePattern: null
  };
  languageGroups[groupName].push(newLangName);
  
  // Clear search box and show all languages
  const searchBox = document.getElementById('searchBox');
  searchBox.value = '';
  displayExtensions('');
  
  // Scroll to newly added language
  setTimeout(() => {
    // Find correct group
    const groups = document.querySelectorAll('.extension-group');
    let targetGroup;
    for (const group of groups) {
      if (group.querySelector('.group-header').textContent.startsWith(groupName)) {
        targetGroup = group;
        break;
      }
    }
    
    if (targetGroup) {
      // Find last added item (it will be the last one)
      const items = targetGroup.querySelectorAll('.extension-item');
      const lastItem = items[items.length - 1];
      
      if (lastItem) {
        // Ensure group is visible first
        targetGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Then focus on new item's language input
        setTimeout(() => {
          lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const inputs = lastItem.querySelectorAll('input');
          if (inputs.length > 0) {
            const langInput = inputs[0];
            langInput.focus();
            langInput.select();
          }
        }, 100);
      }
    }
  }, 100);
}

// Save settings
async function saveSettings() {
  try {
    await chrome.storage.sync.set({ languageExtensions: currentExtensions });
    showStatus('Settings saved successfully', 'success');
  } catch (err) {
    showStatus('Error saving settings', 'error');
  }
}

// Reset to defaults
function resetDefaults() {
  if (confirm('Are you sure you want to reset all settings to default values?')) {
    currentExtensions = {...defaultExtensions};
    displayExtensions();
    showStatus('Settings reset to defaults', 'success');
  }
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('searchBox').addEventListener('input', (e) => displayExtensions(e.target.value));
document.getElementById('saveSettings').addEventListener('click', saveSettings);
document.getElementById('resetDefaults').addEventListener('click', resetDefaults); 