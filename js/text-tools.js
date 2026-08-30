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

function initAllTextTools() {
  initTextTransformer();
  initTextDiff();
}

window.addEventListener('DOMContentLoaded', initAllTextTools);
