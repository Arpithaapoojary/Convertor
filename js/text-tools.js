/* ==========================================================================
   OmniDoc Studio - Text Studio Engine (Transformer, Cleaner, Stats, Diff)
   ========================================================================== */

/* ==========================================================================
   1. Smart Text Transformer & Cleaner Implementation
   ========================================================================== */

function initTextTransformer() {
  const textarea = document.getElementById('text-transform-input');
  const copyBtn = document.getElementById('btn-copy-transform-text');
  const clearBtn = document.getElementById('btn-clear-transform-text');
  const downloadBtn = document.getElementById('btn-download-transform-text');

  // Stats widgets
  const statWords = document.getElementById('stat-words');
  const statChars = document.getElementById('stat-chars');
  const statCharsNoSpace = document.getElementById('stat-chars-nospace');
  const statLines = document.getElementById('stat-lines');
  const statReadTime = document.getElementById('stat-readtime');

  if (!textarea) return;

  function updateLiveStats() {
    const text = textarea.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const lines = text ? text.split('\n').length : 0;
    const readMin = Math.ceil(words / 200);

    if (statWords) statWords.textContent = words;
    if (statChars) statChars.textContent = chars;
    if (statCharsNoSpace) statCharsNoSpace.textContent = charsNoSpace;
    if (statLines) statLines.textContent = lines;
    if (statReadTime) statReadTime.textContent = `${readMin} min`;
  }

  textarea.addEventListener('input', updateLiveStats);
  updateLiveStats();

  // Transformation Actions
  document.querySelectorAll('[data-text-transform]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-text-transform');
      const text = textarea.value;
      if (!text && mode !== 'sample') return;

      let result = text;
      switch (mode) {
        case 'upper':
          result = text.toUpperCase();
          break;
        case 'lower':
          result = text.toLowerCase();
          break;
        case 'title':
          result = text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
          break;
        case 'sentence':
          result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
          break;
        case 'camel':
          result = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
          break;
        case 'pascal':
          result = text.toLowerCase().replace(/(?:^|[^a-zA-Z0-9]+)(.)/g, (m, chr) => chr.toUpperCase());
          break;
        case 'kebab':
          result = text.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          break;
        case 'snake':
          result = text.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          break;
        case 'constant':
          result = text.trim().toUpperCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          break;
        case 'dot':
          result = text.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
          break;
        case 'slugify':
          result = text.trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
          break;
        case 'reverse':
          result = text.split('').reverse().join('');
          break;
        case 'clean-spaces':
          result = text.replace(/[ \t]+/g, ' ').replace(/^\s+|\s+$/gm, '');
          break;
        case 'remove-empty-lines':
          result = text.split('\n').filter(line => line.trim().length > 0).join('\n');
          break;
        case 'remove-duplicate-lines':
          result = Array.from(new Set(text.split('\n'))).join('\n');
          break;
        case 'sort-az':
          result = text.split('\n').sort((a, b) => a.localeCompare(b)).join('\n');
          break;
        case 'sort-za':
          result = text.split('\n').sort((a, b) => b.localeCompare(a)).join('\n');
          break;
        case 'number-lines':
          result = text.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
          break;
        case 'json-escape':
          result = JSON.stringify(text).slice(1, -1);
          break;
        case 'json-unescape':
          try {
            result = JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
          } catch (e) {
            result = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          }
          break;
        case 'b64-encode':
          try {
            result = btoa(unescape(encodeURIComponent(text)));
          } catch (e) {
            showToast('Base64 encoding error', 'error');
          }
          break;
        case 'b64-decode':
          try {
            result = decodeURIComponent(escape(atob(text.trim())));
          } catch (e) {
            showToast('Invalid Base64 string', 'error');
          }
          break;
        case 'rot13':
          result = text.replace(/[a-zA-Z]/g, c => {
            const code = c.charCodeAt(0);
            const base = code <= 90 ? 65 : 97;
            return String.fromCharCode(((code - base + 13) % 26) + base);
          });
          break;
        case 'strip-html':
          result = text.replace(/<[^>]*>/g, '');
          break;
        case 'extract-emails': {
          const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
          result = Array.from(new Set(emails)).join('\n');
          if (!result) showToast('No email addresses found', 'warning');
          break;
        }
        case 'extract-urls': {
          const urls = text.match(/https?:\/\/[^\s$.?#].[^\s]*/gi) || [];
          result = Array.from(new Set(urls)).join('\n');
          if (!result) showToast('No URLs found', 'warning');
          break;
        }
        case 'binary-encode':
          result = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
          break;
        case 'binary-decode':
          try {
            result = text.trim().split(/\s+/).map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
          } catch (e) {
            showToast('Invalid binary string', 'error');
          }
          break;
        case 'hex-encode':
          result = text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
          break;
        case 'hex-decode':
          try {
            result = text.replace(/\s+/g, '').match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';
          } catch (e) {
            showToast('Invalid hex string', 'error');
          }
          break;
        case 'reverse-words':
          result = text.split('\n').map(line => line.split(/\s+/).reverse().join(' ')).join('\n');
          break;
        case 'word-frequency': {
          const rawWords = text.toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || [];
          if (rawWords.length === 0) {
            showToast('No words found for frequency analysis', 'warning');
            break;
          }
          const freqMap = {};
          rawWords.forEach(w => freqMap[w] = (freqMap[w] || 0) + 1);
          const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
          const total = rawWords.length;
          result = `=== KEYWORD FREQUENCY & DENSITY ANALYSIS ===\nTotal Words Analyzed: ${total}\nUnique Words: ${sorted.length}\n\nRank  Keyword             Count    Density\n------------------------------------------\n` + 
            sorted.slice(0, 30).map(([k, v], i) => {
              const rank = String(i + 1).padEnd(5);
              const kw = k.padEnd(19);
              const cnt = String(v).padEnd(8);
              const pct = ((v / total) * 100).toFixed(2) + '%';
              return `${rank} ${kw} ${cnt} ${pct}`;
            }).join('\n');
          break;
        }
        case 'lorem':
          result = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nCurabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.`;
          break;
        case 'sample':
          result = `OmniDoc Studio — Professional Document & Text Suite.
Transform strings, parse data formats (JSON, CSV, XML), generate QR codes, and merge PDFs with ease!
Contact our team at support@omnidoc.dev or visit https://github.com/Arpithaapoojary/Convertor for documentation.`;
          break;
      }

      textarea.value = result;
      updateLiveStats();
      showToast('Transformation applied!', 'info');
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!textarea.value) return;
      copyToClipboard(textarea.value, 'Text copied to clipboard!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      updateLiveStats();
      showToast('Text cleared', 'info');
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!textarea.value) return;
      downloadTextFile(textarea.value, 'transformed_text.txt');
      showToast('Text file downloaded!', 'success');
    });
  }
}

/* ==========================================================================
   2. Text Diff / Compare Engine Implementation
   ========================================================================== */

function initTextDiff() {
  const origInput = document.getElementById('diff-original');
  const modInput = document.getElementById('diff-modified');
  const compareBtn = document.getElementById('btn-run-diff');
  const outputContainer = document.getElementById('diff-output-view');

  if (!compareBtn) return;

  function computeLCS(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    return dp;
  }

  function getDiff(a, b) {
    const dp = computeLCS(a, b);
    let i = a.length, j = b.length;
    const diff = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        diff.unshift({ type: 'unchanged', text: a[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', text: b[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        diff.unshift({ type: 'removed', text: a[i - 1] });
        i--;
      }
    }
    return diff;
  }

  compareBtn.addEventListener('click', () => {
    const origLines = (origInput.value || '').split('\n');
    const modLines = (modInput.value || '').split('\n');

    if (!origInput.value && !modInput.value) {
      showToast('Please enter text to compare', 'error');
      return;
    }

    const diff = getDiff(origLines, modLines);
    outputContainer.innerHTML = '';

    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    diff.forEach(item => {
      if (item.type === 'added') addedCount++;
      else if (item.type === 'removed') removedCount++;
      else unchangedCount++;

      const lineEl = document.createElement('div');
      lineEl.className = `diff-line diff-${item.type}`;
      const prefix = item.type === 'added' ? '+ ' : (item.type === 'removed' ? '- ' : '  ');
      lineEl.textContent = prefix + item.text;
      outputContainer.appendChild(lineEl);
    });

    const totalLines = diff.length || 1;
    const similarity = Math.round((unchangedCount / totalLines) * 100);
    showToast(`Diff comparison: ${similarity}% match (+${addedCount}, -${removedCount})`, 'success');
  });
}

/* ==========================================================================
   3. Secure Password & Passphrase Generator Implementation
   ========================================================================== */

function initPasswordGenerator() {
  const lengthSlider = document.getElementById('pass-length-slider');
  const lengthVal = document.getElementById('pass-length-val');
  const optUpper = document.getElementById('pass-opt-upper');
  const optLower = document.getElementById('pass-opt-lower');
  const optNumbers = document.getElementById('pass-opt-numbers');
  const optSymbols = document.getElementById('pass-opt-symbols');
  const optNoAmbiguous = document.getElementById('pass-opt-no-ambiguous');
  const modeSelect = document.getElementById('pass-mode-select');
  const passOutput = document.getElementById('pass-output-text');
  const strengthBar = document.getElementById('pass-strength-bar');
  const strengthLabel = document.getElementById('pass-strength-label');
  const entropyVal = document.getElementById('pass-entropy-val');
  const generateBtn = document.getElementById('btn-generate-password');
  const copyBtn = document.getElementById('btn-copy-password');
  const bulkQty = document.getElementById('pass-bulk-qty');
  const bulkOutput = document.getElementById('pass-bulk-output');
  const copyBulkBtn = document.getElementById('btn-copy-bulk-passwords');

  if (!generateBtn) return;

  const WORD_LIST = [
    'amber', 'azure', 'beacon', 'breeze', 'canyon', 'cascade', 'cipher', 'clover',
    'cosmos', 'crater', 'crystal', 'delta', 'drift', 'echo', 'ember', 'falcon',
    'flame', 'forest', 'fossil', 'galaxy', 'glacier', 'granite', 'harbor', 'haven',
    'horizon', 'island', 'jungle', 'lagoon', 'legend', 'lotus', 'lunar', 'meadow',
    'meteor', 'nebula', 'nexus', 'oasis', 'ocean', 'orbit', 'pebble', 'phoenix',
    'planet', 'prism', 'pulse', 'pyramid', 'quantum', 'quartz', 'quiver', 'radius',
    'ripple', 'river', 'rocket', 'safari', 'shadow', 'shield', 'siren', 'solar',
    'spectrum', 'sphere', 'spiral', 'spring', 'starlight', 'summit', 'sunrise', 'sunset',
    'thunder', 'timber', 'topaz', 'torrent', 'tower', 'tulip', 'valley', 'vapor',
    'vector', 'velvet', 'vessel', 'vertex', 'vortex', 'voyage', 'whisper', 'zenith'
  ];

  function getSecureRandomInt(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }

  function generateSinglePassword() {
    const mode = modeSelect ? modeSelect.value : 'random';
    const length = parseInt(lengthSlider ? lengthSlider.value : '16', 10) || 16;

    if (mode === 'passphrase') {
      const wordCount = Math.max(3, Math.min(8, Math.round(length / 4)));
      const words = [];
      for (let i = 0; i < wordCount; i++) {
        words.push(WORD_LIST[getSecureRandomInt(WORD_LIST.length)]);
      }
      return words.join('-');
    }

    let chars = '';
    let required = [];

    const hasUpper = optUpper ? optUpper.checked : true;
    const hasLower = optLower ? optLower.checked : true;
    const hasNumbers = optNumbers ? optNumbers.checked : true;
    const hasSymbols = optSymbols ? optSymbols.checked : true;
    const noAmbiguous = optNoAmbiguous ? optNoAmbiguous.checked : false;

    let upperSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lowerSet = 'abcdefghijklmnopqrstuvwxyz';
    let numSet = '0123456789';
    let symSet = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (noAmbiguous) {
      upperSet = upperSet.replace(/[IO]/g, '');
      lowerSet = lowerSet.replace(/[lo]/g, '');
      numSet = numSet.replace(/[01]/g, '');
      symSet = symSet.replace(/[|:;]/g, '');
    }

    if (hasUpper) { chars += upperSet; required.push(upperSet[getSecureRandomInt(upperSet.length)]); }
    if (hasLower) { chars += lowerSet; required.push(lowerSet[getSecureRandomInt(lowerSet.length)]); }
    if (hasNumbers) { chars += numSet; required.push(numSet[getSecureRandomInt(numSet.length)]); }
    if (hasSymbols) { chars += symSet; required.push(symSet[getSecureRandomInt(symSet.length)]); }

    if (!chars) chars = lowerSet;

    let password = [...required];
    while (password.length < length) {
      password.push(chars[getSecureRandomInt(chars.length)]);
    }

    // Fisher-Yates Shuffle
    for (let i = password.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
  }

  function calculateEntropy(pass) {
    let poolSize = 0;
    if (/[a-z]/.test(pass)) poolSize += 26;
    if (/[A-Z]/.test(pass)) poolSize += 26;
    if (/[0-9]/.test(pass)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(pass)) poolSize += 32;
    if (pass.includes('-') && pass.split('-').every(w => WORD_LIST.includes(w))) {
      poolSize = WORD_LIST.length;
      return Math.round(pass.split('-').length * Math.log2(poolSize));
    }
    if (poolSize === 0) return 0;
    return Math.round(pass.length * Math.log2(poolSize));
  }

  function updatePasswordUI() {
    const pass = generateSinglePassword();
    if (passOutput) passOutput.value = pass;

    const entropy = calculateEntropy(pass);
    if (entropyVal) entropyVal.textContent = `${entropy} bits`;

    let strength = 'Weak';
    let color = '#ef4444';
    let pct = Math.min(100, Math.round((entropy / 100) * 100));

    if (entropy >= 90) {
      strength = 'Military Grade (Ultra)';
      color = '#10b981';
    } else if (entropy >= 70) {
      strength = 'Very Strong';
      color = '#06b6d4';
    } else if (entropy >= 50) {
      strength = 'Strong';
      color = '#3b82f6';
    } else if (entropy >= 35) {
      strength = 'Moderate';
      color = '#f59e0b';
    }

    if (strengthBar) {
      strengthBar.style.width = `${pct}%`;
      strengthBar.style.backgroundColor = color;
    }
    if (strengthLabel) {
      strengthLabel.textContent = strength;
      strengthLabel.style.color = color;
    }

    // Generate bulk
    const qty = parseInt(bulkQty ? bulkQty.value : '5', 10) || 5;
    const bulkList = [];
    for (let i = 0; i < qty; i++) {
      bulkList.push(generateSinglePassword());
    }
    if (bulkOutput) bulkOutput.value = bulkList.join('\n');
  }

  if (lengthSlider && lengthVal) {
    lengthSlider.addEventListener('input', (e) => {
      lengthVal.textContent = `${e.target.value} chars`;
      updatePasswordUI();
    });
  }

  [optUpper, optLower, optNumbers, optSymbols, optNoAmbiguous, modeSelect, bulkQty].forEach(el => {
    if (el) el.addEventListener('change', updatePasswordUI);
  });

  generateBtn.addEventListener('click', () => {
    updatePasswordUI();
    showToast('Generated fresh secure password!', 'success');
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!passOutput.value) return;
      copyToClipboard(passOutput.value, 'Password copied to clipboard!');
    });
  }

  if (copyBulkBtn) {
    copyBulkBtn.addEventListener('click', () => {
      if (!bulkOutput.value) return;
      copyToClipboard(bulkOutput.value, 'All bulk passwords copied!');
    });
  }

  updatePasswordUI();
}

/* ==========================================================================
   4. Regex Studio & Visual Matcher Implementation
   ========================================================================== */

function initRegexStudio() {
  const patternInput = document.getElementById('regex-pattern-input');
  const testInput = document.getElementById('regex-test-input');
  const highlightBackdrop = document.getElementById('regex-highlight-backdrop');

  const flagG = document.getElementById('regex-flag-g');
  const flagI = document.getElementById('regex-flag-i');
  const flagM = document.getElementById('regex-flag-m');
  const flagS = document.getElementById('regex-flag-s');
  const flagU = document.getElementById('regex-flag-u');

  const statMatches = document.getElementById('regex-stat-matches');
  const statGroups = document.getElementById('regex-stat-groups');
  const statStatus = document.getElementById('regex-stat-status');
  const matchesList = document.getElementById('regex-matches-list');

  const replaceTemplate = document.getElementById('regex-replace-template');
  const replaceOutput = document.getElementById('regex-replace-output');

  const langSelect = document.getElementById('regex-lang-select');
  const codeOutput = document.getElementById('regex-code-output');

  const btnTabMatches = document.getElementById('btn-regex-tab-matches');
  const btnTabReplace = document.getElementById('btn-regex-tab-replace');
  const btnTabCode = document.getElementById('btn-regex-tab-code');
  const viewMatches = document.getElementById('regex-view-matches');
  const viewReplace = document.getElementById('regex-view-replace');
  const viewCode = document.getElementById('regex-view-code');

  const btnCopyPattern = document.getElementById('btn-copy-regex-pattern');
  const btnCopyMatches = document.getElementById('btn-copy-regex-matches');
  const btnCopyReplaced = document.getElementById('btn-copy-regex-replaced');
  const btnCopyCode = document.getElementById('btn-copy-regex-code');
  const btnSampleText = document.getElementById('btn-regex-sample-text');

  if (!patternInput || !testInput) return;

  const REGEX_PRESETS = {
    email: '([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})',
    url: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    ipv4: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    phone: '(?:\\+?1[-. ]?)?\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})',
    date: '\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b',
    hex: '#(?:[a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b',
    html: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)<\\/\\1>',
    uuid: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}',
    slug: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  };

  let extractedMatches = [];

  function getActiveFlags() {
    let flags = '';
    if (flagG && flagG.checked) flags += 'g';
    if (flagI && flagI.checked) flags += 'i';
    if (flagM && flagM.checked) flags += 'm';
    if (flagS && flagS.checked) flags += 's';
    if (flagU && flagU.checked) flags += 'u';
    return flags;
  }

  function escapeHtmlChars(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function updateRegexEngine() {
    const patternStr = patternInput.value;
    const testText = testInput.value;
    const flags = getActiveFlags();

    extractedMatches = [];

    if (!patternStr) {
      if (statStatus) {
        statStatus.textContent = 'Empty Pattern';
        statStatus.style.color = 'var(--text-muted)';
      }
      if (statMatches) statMatches.textContent = '0';
      if (statGroups) statGroups.textContent = '0';
      if (highlightBackdrop) highlightBackdrop.innerHTML = escapeHtmlChars(testText);
      if (matchesList) matchesList.innerHTML = '<p class="text-secondary" style="font-size: 0.85rem; padding: 1rem; text-align: center;">Enter a regex pattern to see matches.</p>';
      if (replaceOutput) replaceOutput.value = testText;
      updateCodeSnippet(patternStr, flags);
      return;
    }

    let regex;
    try {
      regex = new RegExp(patternStr, flags);
      if (statStatus) {
        statStatus.textContent = 'Valid Pattern';
        statStatus.style.color = 'var(--accent-emerald)';
      }
    } catch (e) {
      if (statStatus) {
        statStatus.textContent = 'Syntax Error';
        statStatus.style.color = 'var(--accent-rose)';
      }
      if (statMatches) statMatches.textContent = '0';
      if (statGroups) statGroups.textContent = '0';
      if (highlightBackdrop) highlightBackdrop.innerHTML = escapeHtmlChars(testText);
      if (matchesList) matchesList.innerHTML = `<p class="badge-error" style="padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.82rem;">${e.message}</p>`;
      return;
    }

    // Extract all matches
    let match;
    let totalGroups = 0;
    let matchItems = [];

    if (flags.includes('g')) {
      let loopGuard = 0;
      while ((match = regex.exec(testText)) !== null && loopGuard < 1000) {
        loopGuard++;
        matchItems.push({
          index: match.index,
          length: match[0].length,
          value: match[0],
          groups: match.slice(1)
        });
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    } else {
      match = regex.exec(testText);
      if (match) {
        matchItems.push({
          index: match.index,
          length: match[0].length,
          value: match[0],
          groups: match.slice(1)
        });
      }
    }

    extractedMatches = matchItems.map(m => m.value);

    if (statMatches) statMatches.textContent = matchItems.length;
    if (statGroups) {
      totalGroups = matchItems.reduce((acc, m) => Math.max(acc, m.groups.length), 0);
      statGroups.textContent = totalGroups;
    }

    // Build Highlight Backdrop HTML
    if (highlightBackdrop) {
      if (matchItems.length === 0) {
        highlightBackdrop.innerHTML = escapeHtmlChars(testText);
      } else {
        let highlightedHtml = '';
        let lastIndex = 0;

        matchItems.forEach((m) => {
          highlightedHtml += escapeHtmlChars(testText.substring(lastIndex, m.index));
          highlightedHtml += `<mark class="regex-match-mark">${escapeHtmlChars(m.value)}</mark>`;
          lastIndex = m.index + m.length;
        });

        highlightedHtml += escapeHtmlChars(testText.substring(lastIndex));
        highlightBackdrop.innerHTML = highlightedHtml;
      }
    }

    // Render Match Breakdown Cards
    if (matchesList) {
      if (matchItems.length === 0) {
        matchesList.innerHTML = '<p class="text-secondary" style="font-size: 0.85rem; padding: 1rem; text-align: center;">No matches found in test string.</p>';
      } else {
        matchesList.innerHTML = matchItems.map((m, idx) => {
          const groupsHtml = m.groups.length > 0
            ? `<div style="margin-top: 0.4rem; padding-top: 0.35rem; border-top: 1px dashed var(--border-subtle); display: flex; flex-direction: column; gap: 0.2rem;">
                ${m.groups.map((g, gIdx) => `
                  <div style="font-size: 0.76rem; color: var(--text-secondary);">
                    <strong style="color: var(--primary);">$${gIdx + 1}:</strong> "${escapeHtmlChars(g || 'undefined')}"
                  </div>
                `).join('')}
              </div>`
            : '';

          return `
            <div class="regex-match-card">
              <div style="flex: 1; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                  <span style="font-weight: 700; color: var(--primary);">Match #${idx + 1}</span>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Index: ${m.index}..${m.index + m.length}</span>
                </div>
                <div style="font-weight: 600; color: var(--text-primary); word-break: break-all;">"${escapeHtmlChars(m.value)}"</div>
                ${groupsHtml}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Replace Preview
    if (replaceOutput && replaceTemplate) {
      try {
        const rep = regex ? testText.replace(regex, replaceTemplate.value) : testText;
        replaceOutput.value = rep;
      } catch {
        replaceOutput.value = testText;
      }
    }

    // Code Snippet Generator
    updateCodeSnippet(patternStr, flags);
  }

  function updateCodeSnippet(pattern, flags) {
    if (!codeOutput) return;
    const lang = langSelect ? langSelect.value : 'js';

    switch (lang) {
      case 'js':
        codeOutput.value = `// JavaScript Regex Matching\nconst pattern = /${pattern}/${flags};\nconst str = "your test string";\n\n// Find all matches\nconst matches = [...str.matchAll(pattern)];\nmatches.forEach(m => console.log(m[0], m.groups));\n\n// Replace\nconst replaced = str.replace(pattern, "replacement");`;
        break;
      case 'python':
        codeOutput.value = `# Python Regex Matching\nimport re\n\npattern = r"${pattern}"\ntext = "your test string"\n\n# Find all matches\nmatches = re.findall(pattern, text${flags.includes('i') ? ', re.IGNORECASE' : ''})\nprint("Matches:", matches)\n\n# Replace\nresult = re.sub(pattern, "replacement", text)`;
        break;
      case 'php':
        codeOutput.value = `<?php\n// PHP PCRE Matching\n$pattern = '/${pattern.replace(/'/g, "\\'")}/${flags}';\n$text = 'your test string';\n\nif (preg_match_all($pattern, $text, $matches)) {\n    print_r($matches[0]);\n}\n\n$replaced = preg_replace($pattern, 'replacement', $text);`;
        break;
      case 'go':
        codeOutput.value = `package main\n\nimport (\n\t"fmt"\n\t"regexp"\n)\n\nfunc main() {\n\tre := regexp.MustCompile(\`${pattern}\`)\n\ttext := "your test string"\n\n\tmatches := re.FindAllString(text, -1)\n\tfmt.Println("Matches:", matches)\n}`;
        break;
    }
  }

  // Scroll synchronization between textarea and backdrop
  testInput.addEventListener('scroll', () => {
    if (highlightBackdrop) {
      highlightBackdrop.scrollTop = testInput.scrollTop;
      highlightBackdrop.scrollLeft = testInput.scrollLeft;
    }
  });

  patternInput.addEventListener('input', updateRegexEngine);
  testInput.addEventListener('input', updateRegexEngine);
  if (replaceTemplate) replaceTemplate.addEventListener('input', updateRegexEngine);

  [flagG, flagI, flagM, flagS, flagU].forEach(f => {
    if (f) f.addEventListener('change', updateRegexEngine);
  });

  if (langSelect) {
    langSelect.addEventListener('change', () => updateCodeSnippet(patternInput.value, getActiveFlags()));
  }

  // Tabs
  if (btnTabMatches && btnTabReplace && btnTabCode) {
    btnTabMatches.addEventListener('click', () => {
      btnTabMatches.classList.add('active');
      btnTabReplace.classList.remove('active');
      btnTabCode.classList.remove('active');
      if (viewMatches) viewMatches.style.display = 'block';
      if (viewReplace) viewReplace.style.display = 'none';
      if (viewCode) viewCode.style.display = 'none';
    });

    btnTabReplace.addEventListener('click', () => {
      btnTabReplace.classList.add('active');
      btnTabMatches.classList.remove('active');
      btnTabCode.classList.remove('active');
      if (viewMatches) viewMatches.style.display = 'none';
      if (viewReplace) viewReplace.style.display = 'block';
      if (viewCode) viewCode.style.display = 'none';
    });

    btnTabCode.addEventListener('click', () => {
      btnTabCode.classList.add('active');
      btnTabMatches.classList.remove('active');
      btnTabReplace.classList.remove('active');
      if (viewMatches) viewMatches.style.display = 'none';
      if (viewReplace) viewReplace.style.display = 'none';
      if (viewCode) viewCode.style.display = 'block';
    });
  }

  // Presets
  document.querySelectorAll('[data-regex-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-regex-preset');
      const presetVal = REGEX_PRESETS[presetKey];
      if (presetVal) {
        patternInput.value = presetVal;
        updateRegexEngine();
        showToast(`Loaded ${btn.textContent} Regex preset!`, 'info');
      }
    });
  });

  // Sample Text
  if (btnSampleText) {
    btnSampleText.addEventListener('click', () => {
      testInput.value = `Welcome to OmniDoc Studio! For support, contact support@omnidoc.dev or sales@enterprise-apps.io. Visit https://omnidoc.dev/portal for updates. Phone: (800) 555-0199. IPv4 server: 192.168.1.1. Date created: 2026-09-02.`;
      updateRegexEngine();
      showToast('Inserted comprehensive test sample!', 'info');
    });
  }

  // Copy Buttons
  if (btnCopyPattern) {
    btnCopyPattern.addEventListener('click', () => {
      const full = `/${patternInput.value}/${getActiveFlags()}`;
      copyToClipboard(full, `Copied regex ${full}!`);
    });
  }

  if (btnCopyMatches) {
    btnCopyMatches.addEventListener('click', () => {
      if (extractedMatches.length === 0) {
        showToast('No matches to copy', 'warning');
        return;
      }
      copyToClipboard(extractedMatches.join('\n'), `Copied ${extractedMatches.length} matches!`);
    });
  }

  if (btnCopyReplaced) {
    btnCopyReplaced.addEventListener('click', () => {
      if (!replaceOutput || !replaceOutput.value) return;
      copyToClipboard(replaceOutput.value, 'Replaced text copied to clipboard!');
    });
  }

  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
      if (!codeOutput || !codeOutput.value) return;
      copyToClipboard(codeOutput.value, 'Code snippet copied to clipboard!');
    });
  }

  // Initial trigger
  updateRegexEngine();
}

function initAllTextTools() {
  initTextTransformer();
  initTextDiff();
  initPasswordGenerator();
  initRegexStudio();
}

window.addEventListener('DOMContentLoaded', initAllTextTools);


