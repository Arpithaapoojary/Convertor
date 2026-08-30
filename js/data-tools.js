/* ==========================================================================
   OmniDoc Studio - Data & Format Converters Engine (CSV/JSON, MD/HTML, Hash/UUID)
   ========================================================================== */

/* ==========================================================================
   1. CSV ↔ JSON Converter Implementation
   ========================================================================== */

function initCsvJsonConverter() {
  const csvInput = document.getElementById('csv-input-area');
  const jsonInput = document.getElementById('json-input-area');
  const csvToJsonBtn = document.getElementById('btn-convert-csv-to-json');
  const jsonToCsvBtn = document.getElementById('btn-convert-json-to-csv');
  const tableContainer = document.getElementById('csv-table-preview-container');
  const copyCsvBtn = document.getElementById('btn-copy-csv');
  const copyJsonBtn = document.getElementById('btn-copy-json');
  const downloadCsvBtn = document.getElementById('btn-download-csv');
  const downloadJsonBtn = document.getElementById('btn-download-json');
  const fileDropzone = document.getElementById('csv-json-dropzone');
  const fileInput = document.getElementById('csv-json-file-input');

  if (!csvToJsonBtn) return;

  if (fileDropzone && fileInput) {
    setupDropzone(fileDropzone, fileInput, async (files) => {
      const file = files[0];
      if (!file) return;
      const text = await readFileAsText(file);
      if (file.name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        jsonInput.value = text;
        convertJsonToCsv();
      } else {
        csvInput.value = text;
        convertCsvToJson();
      }
    });
  }

  function renderTable(data) {
    if (!tableContainer || !Array.isArray(data) || data.length === 0) {
      if (tableContainer) tableContainer.innerHTML = '';
      return;
    }

    const headers = Object.keys(data[0]);
    let html = `<table class="csv-preview-table"><thead><tr>`;
    headers.forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;

    data.slice(0, 50).forEach(row => {
      html += `<tr>`;
      headers.forEach(h => html += `<td>${row[h] !== undefined ? row[h] : ''}</td>`);
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    if (data.length > 50) {
      html += `<div style="padding: 0.5rem; text-align: center; font-size: 0.75rem; color: var(--text-muted);">Showing first 50 rows of ${data.length}</div>`;
    }
    tableContainer.innerHTML = html;
  }

  function detectDelimiter(str) {
    const sample = str.split('\n')[0] || '';
    const counts = {
      ',': (sample.match(/,/g) || []).length,
      ';': (sample.match(/;/g) || []).length,
      '\t': (sample.match(/\t/g) || []).length,
      '|': (sample.match(/\|/g) || []).length
    };
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ',';
  }

  function convertCsvToJson() {
    const raw = csvInput.value.trim();
    if (!raw) {
      showToast('Please enter CSV data', 'error');
      return;
    }

    try {
      const delimiter = detectDelimiter(raw);
      if (window.Papa) {
        const parsed = Papa.parse(raw, { 
          header: true, 
          dynamicTyping: true, 
          skipEmptyLines: true,
          delimiter: delimiter
        });
        jsonInput.value = JSON.stringify(parsed.data, null, 2);
        renderTable(parsed.data);
        const count = parsed.data.length;
        showToast(`Converted ${count} row(s) to JSON (detected '${delimiter === '\t' ? 'TAB' : delimiter}')!`, 'success');
      } else {
        const lines = raw.split('\n');
        const headers = lines[0].split(delimiter).map(h => h.trim());
        const data = lines.slice(1).filter(l => l.trim()).map(line => {
          const vals = line.split(delimiter);
          const obj = {};
          headers.forEach((h, i) => obj[h] = vals[i] ? vals[i].trim() : '');
          return obj;
        });
        jsonInput.value = JSON.stringify(data, null, 2);
        renderTable(data);
        showToast(`Converted ${data.length} rows to JSON!`, 'success');
      }
    } catch (e) {
      showToast('Error converting CSV: ' + e.message, 'error');
    }
  }

  function convertJsonToCsv() {
    const raw = jsonInput.value.trim();
    if (!raw) {
      showToast('Please enter JSON data', 'error');
      return;
    }

    try {
      let data = JSON.parse(raw);
      if (!Array.isArray(data)) data = [data];

      if (window.Papa) {
        const csv = Papa.unparse(data);
        csvInput.value = csv;
        renderTable(data);
        showToast(`Converted ${data.length} records to CSV!`, 'success');
      } else {
        const headers = Object.keys(data[0]);
        const rows = [headers.join(',')];
        data.forEach(item => {
          rows.push(headers.map(h => JSON.stringify(item[h] || '')).join(','));
        });
        csvInput.value = rows.join('\n');
        renderTable(data);
        showToast(`Converted ${data.length} records to CSV!`, 'success');
      }
    } catch (e) {
      showToast('Invalid JSON: ' + e.message, 'error');
    }
  }

  csvToJsonBtn.addEventListener('click', convertCsvToJson);
  jsonToCsvBtn.addEventListener('click', convertJsonToCsv);

  if (copyCsvBtn) copyCsvBtn.addEventListener('click', () => copyToClipboard(csvInput.value, 'Copied CSV!'));
  if (copyJsonBtn) copyJsonBtn.addEventListener('click', () => copyToClipboard(jsonInput.value, 'Copied JSON!'));
  if (downloadCsvBtn) downloadCsvBtn.addEventListener('click', () => downloadTextFile(csvInput.value, 'data.csv', 'text/csv'));
  if (downloadJsonBtn) downloadJsonBtn.addEventListener('click', () => downloadTextFile(jsonInput.value, 'data.json', 'application/json'));
}

/* ==========================================================================
   2. Markdown ↔ HTML Live Editor Implementation
   ========================================================================== */

function initMarkdownEditor() {
  const mdTextarea = document.getElementById('markdown-input');
  const htmlPreview = document.getElementById('markdown-preview-output');
  const htmlRawTextarea = document.getElementById('markdown-html-raw');
  const toggleViewBtn = document.getElementById('btn-toggle-md-preview');
  const copyHtmlBtn = document.getElementById('btn-copy-md-html');
  const downloadHtmlBtn = document.getElementById('btn-download-md-html');

  if (!mdTextarea || !htmlPreview) return;

  let showingRawHtml = false;

  function updateMarkdown() {
    const md = mdTextarea.value;
    let html = '';
    if (window.marked) {
      html = marked.parse(md);
      if (window.DOMPurify) html = DOMPurify.sanitize(html);
    } else {
      html = md.replace(/^# (.*$)/gim, '<h1>$1</h1>').replace(/^## (.*$)/gim, '<h2>$1</h2>');
    }

    htmlPreview.innerHTML = html;
    if (htmlRawTextarea) htmlRawTextarea.value = html;
  }

  mdTextarea.addEventListener('input', updateMarkdown);
  updateMarkdown();

  if (toggleViewBtn) {
    toggleViewBtn.addEventListener('click', () => {
      showingRawHtml = !showingRawHtml;
      if (showingRawHtml) {
        htmlPreview.style.display = 'none';
        htmlRawTextarea.style.display = 'block';
        toggleViewBtn.innerHTML = `<i data-lucide="eye" style="width: 14px;"></i> Preview Mode`;
      } else {
        htmlPreview.style.display = 'block';
        htmlRawTextarea.style.display = 'none';
        toggleViewBtn.innerHTML = `<i data-lucide="code" style="width: 14px;"></i> HTML Code`;
      }
      if (window.lucide) lucide.createIcons();
    });
  }

  if (copyHtmlBtn) {
    copyHtmlBtn.addEventListener('click', () => {
      const html = htmlRawTextarea ? htmlRawTextarea.value : htmlPreview.innerHTML;
      copyToClipboard(html, 'Copied HTML output!');
    });
  }

  if (downloadHtmlBtn) {
    downloadHtmlBtn.addEventListener('click', () => {
      const html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>Exported Document</title>\n</head>\n<body>\n${htmlPreview.innerHTML}\n</body>\n</html>`;
      downloadTextFile(html, 'document.html', 'text/html');
      showToast('Downloaded HTML file!', 'success');
    });
  }
}

/* ==========================================================================
   3. Base64 & URL Encoder / Decoder Implementation
   ========================================================================== */

function initEncodersDecoders() {
  const inputEl = document.getElementById('encode-decode-input');
  const outputEl = document.getElementById('encode-decode-output');
  const copyBtn = document.getElementById('btn-copy-encode-output');

  if (!inputEl) return;

  function handleAction(type) {
    const val = inputEl.value;
    if (!val) return;

    try {
      let res = '';
      if (type === 'b64-encode') res = btoa(unescape(encodeURIComponent(val)));
      else if (type === 'b64-decode') res = decodeURIComponent(escape(atob(val)));
      else if (type === 'url-encode') res = encodeURIComponent(val);
      else if (type === 'url-decode') res = decodeURIComponent(val);
      else if (type === 'html-encode') {
        const p = document.createElement('p');
        p.textContent = val;
        res = p.innerHTML;
      } else if (type === 'html-decode') {
        const doc = new DOMParser().parseFromString(val, 'text/html');
        res = doc.documentElement.textContent;
      }
      outputEl.value = res;
      showToast('Encoded/Decoded successfully!', 'success');
    } catch (e) {
      showToast('Processing error: ' + e.message, 'error');
    }
  }

  document.querySelectorAll('[data-encode-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.getAttribute('data-encode-action')));
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!outputEl.value) return;
      copyToClipboard(outputEl.value, 'Result copied to clipboard!');
    });
  }
}

/* ==========================================================================
   4. Hash & UUID Generator Implementation
   ========================================================================== */

function initHashAndUuid() {
  // Hash Generator
  const hashInput = document.getElementById('hash-text-input');
  const md5Out = document.getElementById('hash-md5-out');
  const sha1Out = document.getElementById('hash-sha1-out');
  const sha256Out = document.getElementById('hash-sha256-out');
  const sha512Out = document.getElementById('hash-sha512-out');

  // Standalone fast MD5 fallback algorithm
  function computeMD5(string) {
    function rotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
      const lX4 = (lX & 0x40000000);
      const lY4 = (lY & 0x40000000);
      const lX8 = (lX & 0x80000000);
      const lY8 = (lY & 0x80000000);
      const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      if (lX4 | lY4) {
        if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
      return (lResult ^ lX8 ^ lY8);
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }

    function FF(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function wordToHex(lValue) {
      let wordToHexValue = '', wordToHexValueTemp = '', lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValueTemp = '0' + lByte.toString(16);
        wordToHexValue += wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
      }
      return wordToHexValue;
    }

    function convertToWordArray(string) {
      let lWordCount;
      const lMessageLength = string.length;
      const lNumberOfWordsTemp1 = lMessageLength + 8;
      const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
      const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
      const lWordArray = Array(lNumberOfWords - 1);
      let lBytePosition = 0;
      let lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    }

    const x = convertToWordArray(string);
    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;

    for (let k = 0; k < x.length; k += 16) {
      const AA = a, BB = b, CC = c, DD = d;
      a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478);
      d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB);
      b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF);
      d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A);
      c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613);
      b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501);
      a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8);
      d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1);
      b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE);
      a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122);
      d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193);
      c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E);
      b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821);

      a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562);
      d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340);
      c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51);
      b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D);
      d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
      c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681);
      b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6);
      d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6);
      c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87);
      b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED);
      a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905);
      d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9);
      b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A);

      a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942);
      d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681);
      c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122);
      b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C);
      a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44);
      d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60);
      b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6);
      d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA);
      c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085);
      b = HH(b, c, d, a, x[k + 6], 23, 0x04881D05);
      a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039);
      d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8);
      b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665);

      a = II(a, b, c, d, x[k + 0], 6, 0xF4292244);
      d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97);
      c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7);
      b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039);
      a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3);
      d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92);
      c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D);
      b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1);
      a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F);
      d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k + 6], 15, 0xA3014314);
      b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1);
      a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82);
      d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235);
      c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB);
      b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391);

      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
  }

  async function calculateHashes() {
    const str = hashInput ? hashInput.value : '';
    if (!str) {
      [md5Out, sha1Out, sha256Out, sha512Out].forEach(el => el && (el.textContent = '—'));
      return;
    }

    // MD5 with native fast fallback
    if (md5Out) {
      md5Out.textContent = (typeof md5 === 'function') ? md5(str) : computeMD5(str);
    }

    // Crypto Subtle Hashes
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    if (window.crypto && window.crypto.subtle) {
      try {
        if (sha1Out) {
          const b1 = await crypto.subtle.digest('SHA-1', data);
          sha1Out.textContent = Array.from(new Uint8Array(b1)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        if (sha256Out) {
          const b256 = await crypto.subtle.digest('SHA-256', data);
          sha256Out.textContent = Array.from(new Uint8Array(b256)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        if (sha512Out) {
          const b512 = await crypto.subtle.digest('SHA-512', data);
          sha512Out.textContent = Array.from(new Uint8Array(b512)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
      } catch (e) {
        console.error('Crypto error:', e);
      }
    }
  }

  if (hashInput) {
    hashInput.addEventListener('input', calculateHashes);
    calculateHashes();
  }

  // Click on hash output to copy
  document.querySelectorAll('.hash-val-display').forEach(el => {
    el.addEventListener('click', () => {
      const txt = el.textContent;
      if (txt && txt !== '—') copyToClipboard(txt, 'Copied hash!');
    });
  });

  // UUID Generator
  const uuidQty = document.getElementById('uuid-qty-select');
  const uuidHyphens = document.getElementById('uuid-hyphen-toggle');
  const uuidUppercase = document.getElementById('uuid-uppercase-toggle');
  const uuidOutput = document.getElementById('uuid-output-area');
  const generateUuidBtn = document.getElementById('btn-generate-uuids');
  const copyUuidBtn = document.getElementById('btn-copy-uuids');

  function generateUUIDv4() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function generateBulkUUIDs() {
    const qty = parseInt(uuidQty ? uuidQty.value : '5', 10) || 5;
    const hyphens = uuidHyphens ? uuidHyphens.checked : true;
    const upper = uuidUppercase ? uuidUppercase.checked : false;

    const list = [];
    for (let i = 0; i < qty; i++) {
      let u = generateUUIDv4();
      if (!hyphens) u = u.replace(/-/g, '');
      if (upper) u = u.toUpperCase();
      list.push(u);
    }

    if (uuidOutput) uuidOutput.value = list.join('\n');
  }

  if (generateUuidBtn) generateUuidBtn.addEventListener('click', generateBulkUUIDs);
  if (copyUuidBtn) copyUuidBtn.addEventListener('click', () => copyToClipboard(uuidOutput.value, 'Copied UUIDs!'));
}

/* ==========================================================================
   5. JSON Studio (Formatter, Minifier, Schema Validator & Syntax Repair)
   ========================================================================== */

function initJsonStudio() {
  const input = document.getElementById('json-studio-input');
  const errorBanner = document.getElementById('json-studio-error-banner');
  const statBytes = document.getElementById('json-stat-bytes');
  const statKeys = document.getElementById('json-stat-keys');
  const statArrays = document.getElementById('json-stat-arrays');
  const statDepth = document.getElementById('json-stat-depth');
  const statBadge = document.getElementById('json-stat-valid-badge');
  const copyBtn = document.getElementById('btn-copy-json-studio');
  const downloadBtn = document.getElementById('btn-download-json-studio');
  const dropzone = document.getElementById('json-studio-dropzone');
  const fileInput = document.getElementById('json-studio-file-input');

  if (!input) return;

  // File Dropzone setup
  if (dropzone && fileInput) {
    setupDropzone(dropzone, fileInput, async (files) => {
      const file = files[0];
      if (!file) return;
      try {
        const text = await readFileAsText(file);
        input.value = text;
        validateAndUpdateStats();
        showToast(`Loaded ${file.name} successfully!`, 'success');
      } catch (e) {
        showToast('Error reading JSON file: ' + e.message, 'error');
      }
    });
  }

  function sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).sort((a, b) => a.localeCompare(b)).reduce((acc, key) => {
        acc[key] = sortObjectKeys(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  }

  function computeJsonStats(obj) {
    let keyCount = 0;
    let arrayCount = 0;
    let maxDepth = 0;

    function traverse(node, currentDepth) {
      if (currentDepth > maxDepth) maxDepth = currentDepth;
      if (Array.isArray(node)) {
        arrayCount += node.length;
        node.forEach(item => traverse(item, currentDepth + 1));
      } else if (node !== null && typeof node === 'object') {
        const keys = Object.keys(node);
        keyCount += keys.length;
        keys.forEach(k => traverse(node[k], currentDepth + 1));
      }
    }

    traverse(obj, 1);
    return { keyCount, arrayCount, maxDepth };
  }

  function validateAndUpdateStats() {
    const raw = input.value.trim();
    if (!raw) {
      if (errorBanner) errorBanner.style.display = 'none';
      if (statBytes) statBytes.textContent = '0 B';
      if (statKeys) statKeys.textContent = '0';
      if (statArrays) statArrays.textContent = '0';
      if (statDepth) statDepth.textContent = '0';
      if (statBadge) {
        statBadge.className = 'badge badge-muted';
        statBadge.textContent = 'Empty';
      }
      return null;
    }

    if (statBytes) statBytes.textContent = formatBytes(new Blob([raw]).size);

    try {
      const parsed = JSON.parse(raw);
      if (errorBanner) errorBanner.style.display = 'none';
      if (statBadge) {
        statBadge.className = 'badge badge-success';
        statBadge.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Valid JSON`;
      }

      const stats = computeJsonStats(parsed);
      if (statKeys) statKeys.textContent = stats.keyCount;
      if (statArrays) statArrays.textContent = stats.arrayCount;
      if (statDepth) statDepth.textContent = stats.maxDepth;

      if (window.lucide) lucide.createIcons();
      return parsed;
    } catch (e) {
      if (statBadge) {
        statBadge.className = 'badge badge-error';
        statBadge.innerHTML = `<i data-lucide="alert-circle" style="width: 12px; height: 12px;"></i> Invalid JSON`;
      }
      if (errorBanner) {
        errorBanner.style.display = 'flex';
        const msgEl = errorBanner.querySelector('.json-error-message');
        if (msgEl) msgEl.textContent = e.message;
      }
      if (statKeys) statKeys.textContent = '—';
      if (statArrays) statArrays.textContent = '—';
      if (statDepth) statDepth.textContent = '—';

      if (window.lucide) lucide.createIcons();
      return null;
    }
  }

  input.addEventListener('input', debounce(validateAndUpdateStats, 150));
  validateAndUpdateStats();

  // Action Buttons
  document.querySelectorAll('[data-json-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-json-action');
      const raw = input.value.trim();

      if (action === 'sample') {
        const sample = {
          application: "OmniDoc Studio",
          version: "2.5.0",
          privacy: "100% Client-Side",
          features: [
            { id: "pdf-merge", name: "PDF Merge & Split", ready: true },
            { id: "img-compress", name: "Image Compressor", ready: true },
            { id: "jwt-inspect", name: "JWT Debugger", ready: true }
          ],
          settings: {
            theme: "dark",
            audioFeedback: true,
            telemetry: false,
            limits: {
              maxFileSizeMB: 150,
              batchCount: 50
            }
          },
          updatedAt: new Date().toISOString()
        };
        input.value = JSON.stringify(sample, null, 2);
        validateAndUpdateStats();
        showToast('Loaded sample JSON object!', 'info');
        return;
      }

      if (action === 'clear') {
        input.value = '';
        validateAndUpdateStats();
        showToast('Cleared JSON editor', 'info');
        return;
      }

      if (!raw) {
        showToast('Please enter JSON text first', 'warning');
        return;
      }

      if (action === 'repair') {
        try {
          let cleaned = raw;
          cleaned = cleaned.replace(/,\s*([\]}])/g, '$1'); // trailing commas
          cleaned = cleaned.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":'); // unquoted keys
          cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"'); // single quote values
          const parsed = JSON.parse(cleaned);
          input.value = JSON.stringify(parsed, null, 2);
          validateAndUpdateStats();
          showToast('Repaired and formatted JSON syntax!', 'success');
        } catch (err) {
          showToast('Could not auto-repair JSON: ' + err.message, 'error');
        }
        return;
      }

      const parsed = validateAndUpdateStats();
      if (!parsed) {
        showToast('Please fix JSON syntax errors first', 'error');
        return;
      }

      switch (action) {
        case 'format-2':
          input.value = JSON.stringify(parsed, null, 2);
          showToast('Formatted JSON with 2-space indentation', 'success');
          break;
        case 'format-4':
          input.value = JSON.stringify(parsed, null, 4);
          showToast('Formatted JSON with 4-space indentation', 'success');
          break;
        case 'format-tab':
          input.value = JSON.stringify(parsed, null, '\t');
          showToast('Formatted JSON with Tab indentation', 'success');
          break;
        case 'minify':
          input.value = JSON.stringify(parsed);
          showToast('Minified JSON to compact single line', 'success');
          break;
        case 'sort-keys':
          input.value = JSON.stringify(sortObjectKeys(parsed), null, 2);
          showToast('Sorted all object keys alphabetically!', 'success');
          break;
      }
      validateAndUpdateStats();
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!input.value.trim()) return showToast('No JSON to copy', 'warning');
      copyToClipboard(input.value, 'JSON copied to clipboard!');
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!input.value.trim()) return showToast('No JSON to download', 'warning');
      downloadTextFile(input.value, 'data.json', 'application/json');
      showToast('Downloaded JSON file!', 'success');
    });
  }
}

/* ==========================================================================
   6. JWT Inspector & Debugger (Header, Payload, Signature & Expiration)
   ========================================================================== */

function initJwtDebugger() {
  const tokenInput = document.getElementById('jwt-input-token');
  const sampleSelect = document.getElementById('jwt-sample-select');
  const coloredToken = document.getElementById('jwt-token-colored-display');
  const statusBadge = document.getElementById('jwt-status-badge');
  const algBadge = document.getElementById('jwt-alg-badge');
  const timeDesc = document.getElementById('jwt-expiration-desc');
  const headerOutput = document.getElementById('jwt-header-output');
  const payloadOutput = document.getElementById('jwt-payload-output');
  const claimsContainer = document.getElementById('jwt-claims-list');
  const copyHeaderBtn = document.getElementById('btn-copy-jwt-header');
  const copyPayloadBtn = document.getElementById('btn-copy-jwt-payload');
  const copyDecodedBtn = document.getElementById('btn-copy-jwt-decoded');
  const clearBtn = document.getElementById('btn-clear-jwt');

  if (!tokenInput) return;

  function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      return atob(base64);
    }
  }

  const SAMPLES = {
    standard: () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, '');
      const nowSec = Math.floor(Date.now() / 1000);
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
        sub: "user_982413",
        name: "Arpitha Poojary",
        email: "arpitha@omnidoc.dev",
        role: "admin",
        permissions: ["read:all", "write:all", "export:pdf", "manage:tools"],
        iat: nowSec - 3600,
        exp: nowSec + 86400 * 7,
        iss: "https://auth.omnidoc.studio",
        aud: "omnidoc-app"
      })))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const sig = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      return `${header}.${payload}.${sig}`;
    },
    expired: () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, '');
      const nowSec = Math.floor(Date.now() / 1000);
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
        sub: "user_demo_expired",
        email: "demo@expired.org",
        iat: nowSec - 86400 * 30,
        exp: nowSec - 86400 * 2,
        iss: "https://auth.omnidoc.studio"
      })))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const sig = "k9H3_8gQ1Z9X7j2kLmNoPqRsTuVwXyZ0123456789ab";
      return `${header}.${payload}.${sig}`;
    },
    rsa: () => {
      const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "key-2026-prod-01" })).replace(/=/g, '');
      const nowSec = Math.floor(Date.now() / 1000);
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
        iss: "https://secure-identity.cloud",
        sub: "auth0|9384729104",
        aud: ["https://api.omnidoc.studio/v2", "https://api.omnidoc.studio/graphql"],
        iat: nowSec,
        nbf: nowSec,
        exp: nowSec + 3600 * 12,
        scope: "openid profile email offline_access"
      })))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const sig = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      return `${header}.${payload}.${sig}`;
    }
  };

  const CLAIMS_HELP = {
    iss: 'Issuer of the JWT token',
    sub: 'Subject identifier (user ID or principal)',
    aud: 'Recipient / audience for which the token is intended',
    exp: 'Expiration timestamp (Unix Epoch seconds)',
    nbf: 'Not Before timestamp (Token is not valid before this time)',
    iat: 'Issued At timestamp (Unix Epoch seconds)',
    jti: 'Unique JWT ID for one-time token tracking',
    role: 'User authorization role',
    email: 'User verified email address',
    name: 'Full display name of the subject'
  };

  function parseAndRenderJwt() {
    const raw = tokenInput.value.trim();
    if (!raw) {
      if (coloredToken) coloredToken.innerHTML = '<span style="color: var(--text-muted);">Paste or select a sample JWT above to inspect...</span>';
      if (headerOutput) headerOutput.value = '';
      if (payloadOutput) payloadOutput.value = '';
      if (claimsContainer) claimsContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No active claims parsed</div>';
      if (statusBadge) {
        statusBadge.className = 'badge badge-muted';
        statusBadge.textContent = 'Awaiting Token';
      }
      if (algBadge) algBadge.textContent = 'Algorithm: —';
      if (timeDesc) timeDesc.textContent = 'Expiration status will calculate automatically.';
      return;
    }

    const parts = raw.split('.');
    if (parts.length < 2) {
      if (statusBadge) {
        statusBadge.className = 'badge badge-error';
        statusBadge.innerHTML = `<i data-lucide="alert-circle" style="width: 12px; height: 12px;"></i> Malformed JWT`;
      }
      if (timeDesc) timeDesc.textContent = 'Token does not contain the required 3 base64url segments (Header.Payload.Signature).';
      if (coloredToken) coloredToken.innerHTML = `<span style="color: var(--accent-rose);">${raw}</span>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    // Render colored breakdown
    if (coloredToken) {
      coloredToken.innerHTML = `
        <span class="jwt-part-header" title="Header">${parts[0]}</span><span style="color: var(--text-muted); font-weight: bold;">.</span><span class="jwt-part-payload" title="Payload">${parts[1]}</span>${parts[2] !== undefined ? `<span style="color: var(--text-muted); font-weight: bold;">.</span><span class="jwt-part-sig" title="Signature">${parts[2]}</span>` : ''}
      `;
    }

    let headerObj = null;
    let payloadObj = null;

    try {
      headerObj = JSON.parse(base64UrlDecode(parts[0]));
      if (headerOutput) headerOutput.value = JSON.stringify(headerObj, null, 2);
      if (algBadge) algBadge.textContent = `Algorithm: ${headerObj.alg || 'None'}`;
    } catch (e) {
      if (headerOutput) headerOutput.value = '/* Error decoding Header */\n' + e.message;
    }

    try {
      payloadObj = JSON.parse(base64UrlDecode(parts[1]));
      if (payloadOutput) payloadOutput.value = JSON.stringify(payloadObj, null, 2);
    } catch (e) {
      if (payloadOutput) payloadOutput.value = '/* Error decoding Payload */\n' + e.message;
    }

    // Analyze expiration and claims
    if (payloadObj) {
      const nowSec = Math.floor(Date.now() / 1000);
      let statusText = 'Valid & Active';
      let statusClass = 'badge-success';
      let timeMessage = '';

      if (payloadObj.exp) {
        const expSec = payloadObj.exp;
        const expDate = new Date(expSec * 1000);
        const diffSec = expSec - nowSec;

        if (diffSec <= 0) {
          statusText = 'Token Expired';
          statusClass = 'badge-error';
          const absDiff = Math.abs(diffSec);
          const days = Math.floor(absDiff / 86400);
          const hrs = Math.floor((absDiff % 86400) / 3600);
          const mins = Math.floor((absDiff % 3600) / 60);
          timeMessage = `Expired ${days > 0 ? `${days}d ` : ''}${hrs > 0 ? `${hrs}h ` : ''}${mins}m ago (${expDate.toLocaleString()})`;
        } else {
          statusText = 'Active / Valid';
          statusClass = 'badge-success';
          const days = Math.floor(diffSec / 86400);
          const hrs = Math.floor((diffSec % 86400) / 3600);
          const mins = Math.floor((diffSec % 3600) / 60);
          timeMessage = `Expires in ${days > 0 ? `${days}d ` : ''}${hrs > 0 ? `${hrs}h ` : ''}${mins}m (${expDate.toLocaleString()})`;
        }
      } else {
        timeMessage = 'No expiration claim (`exp`) found in payload.';
      }

      if (payloadObj.nbf && payloadObj.nbf > nowSec) {
        statusText = 'Not Yet Active (nbf)';
        statusClass = 'badge-warning';
        timeMessage += ` • Valid starting at: ${new Date(payloadObj.nbf * 1000).toLocaleString()}`;
      }

      if (statusBadge) {
        statusBadge.className = `badge ${statusClass}`;
        statusBadge.innerHTML = `<i data-lucide="${statusClass === 'badge-success' ? 'check-circle' : 'alert-triangle'}" style="width: 12px; height: 12px;"></i> ${statusText}`;
      }

      if (timeDesc) timeDesc.textContent = timeMessage;

      // Render standard claims list
      if (claimsContainer) {
        let claimsHtml = '<div class="jwt-claims-grid">';
        Object.entries(payloadObj).forEach(([k, v]) => {
          let displayVal = typeof v === 'object' ? JSON.stringify(v) : String(v);
          let extraDate = '';
          if (['exp', 'iat', 'nbf'].includes(k) && typeof v === 'number') {
            extraDate = `<span class="jwt-claim-time-tag">${new Date(v * 1000).toLocaleString()}</span>`;
          }

          claimsHtml += `
            <div class="jwt-claim-row">
              <div class="jwt-claim-key">
                <span class="claim-badge">${k}</span>
                ${CLAIMS_HELP[k] ? `<span class="claim-hint">${CLAIMS_HELP[k]}</span>` : ''}
              </div>
              <div class="jwt-claim-val">
                <code>${displayVal}</code>
                ${extraDate}
              </div>
            </div>
          `;
        });
        claimsHtml += '</div>';
        claimsContainer.innerHTML = claimsHtml;
      }
    }

    if (window.lucide) lucide.createIcons();
  }

  tokenInput.addEventListener('input', debounce(parseAndRenderJwt, 120));

  if (sampleSelect) {
    sampleSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      if (type && SAMPLES[type]) {
        tokenInput.value = SAMPLES[type]();
        parseAndRenderJwt();
        showToast(`Loaded ${type} JWT sample`, 'info');
      }
    });
  }

  if (copyHeaderBtn) {
    copyHeaderBtn.addEventListener('click', () => {
      if (!headerOutput.value) return showToast('No header to copy', 'warning');
      copyToClipboard(headerOutput.value, 'Copied Decoded Header!');
    });
  }

  if (copyPayloadBtn) {
    copyPayloadBtn.addEventListener('click', () => {
      if (!payloadOutput.value) return showToast('No payload to copy', 'warning');
      copyToClipboard(payloadOutput.value, 'Copied Decoded Payload!');
    });
  }

  if (copyDecodedBtn) {
    copyDecodedBtn.addEventListener('click', () => {
      if (!tokenInput.value.trim()) return showToast('No token to copy', 'warning');
      try {
        const parts = tokenInput.value.trim().split('.');
        const full = {
          header: JSON.parse(base64UrlDecode(parts[0])),
          payload: JSON.parse(base64UrlDecode(parts[1])),
          signature: parts[2] || ''
        };
        copyToClipboard(JSON.stringify(full, null, 2), 'Copied Full Decoded Token JSON!');
      } catch (e) {
        showToast('Error formatting token: ' + e.message, 'error');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      tokenInput.value = '';
      if (sampleSelect) sampleSelect.value = '';
      parseAndRenderJwt();
      showToast('Cleared JWT inspector', 'info');
    });
  }

  // Load initial sample
  tokenInput.value = SAMPLES.standard();
  parseAndRenderJwt();
}

/* ==========================================================================
   7. Color Studio & Format Converter (HEX, RGB, HSL, CMYK & Harmonies)
   ========================================================================== */

function initColorStudio() {
  const pickerInput = document.getElementById('color-picker-wheel');
  const hexInput = document.getElementById('color-hex-input');
  const rgbInput = document.getElementById('color-rgb-input');
  const hslInput = document.getElementById('color-hsl-input');
  const cmykInput = document.getElementById('color-cmyk-input');
  const previewBox = document.getElementById('color-preview-box');
  const alphaSlider = document.getElementById('color-alpha-slider');
  const alphaVal = document.getElementById('color-alpha-val');
  const harmoniesContainer = document.getElementById('color-harmonies-container');
  const shadesContainer = document.getElementById('color-shades-container');

  if (!pickerInput) return;

  function hexToRgb(hex) {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const num = parseInt(clean, 16);
    if (isNaN(num) || clean.length < 6) return null;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToCmyk(r, g, b) {
    const rRel = r / 255, gRel = g / 255, bRel = b / 255;
    const k = 1 - Math.max(rRel, gRel, bRel);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const c = (1 - rRel - k) / (1 - k);
    const m = (1 - gRel - k) / (1 - k);
    const y = (1 - bRel - k) / (1 - k);
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  function updateAllFromRgb(r, g, b, alpha = 1) {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);

    if (pickerInput) pickerInput.value = hex;
    if (hexInput) hexInput.value = alpha < 1 ? `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}` : hex;
    if (rgbInput) rgbInput.value = alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
    if (hslInput) hslInput.value = alpha < 1 ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    if (cmykInput) cmykInput.value = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

    if (previewBox) {
      previewBox.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Render Harmonies
    if (harmoniesContainer) {
      const harmonies = [
        { label: 'Primary', h: hsl.h },
        { label: 'Complement', h: (hsl.h + 180) % 360 },
        { label: 'Analogous L', h: (hsl.h + 330) % 360 },
        { label: 'Analogous R', h: (hsl.h + 30) % 360 },
        { label: 'Triadic 1', h: (hsl.h + 120) % 360 },
        { label: 'Triadic 2', h: (hsl.h + 240) % 360 }
      ];

      harmoniesContainer.innerHTML = harmonies.map(item => {
        const rgbH = hslToRgb(item.h, hsl.s, hsl.l);
        const hexH = rgbToHex(rgbH.r, rgbH.g, rgbH.b);
        return `
          <div class="color-swatch-card" style="cursor: pointer;" onclick="document.getElementById('color-hex-input').value='${hexH}'; document.getElementById('color-hex-input').dispatchEvent(new Event('input'));">
            <div class="color-swatch-fill" style="background-color: ${hexH};"></div>
            <div class="color-swatch-meta">
              <span class="color-swatch-label">${item.label}</span>
              <span class="color-swatch-hex">${hexH}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Shades
    if (shadesContainer) {
      const shades = [15, 30, 45, 60, 75, 90];
      shadesContainer.innerHTML = shades.map(l => {
        const rgbS = hslToRgb(hsl.h, hsl.s, l);
        const hexS = rgbToHex(rgbS.r, rgbS.g, rgbS.b);
        return `
          <div class="color-swatch-card" style="cursor: pointer;" onclick="document.getElementById('color-hex-input').value='${hexS}'; document.getElementById('color-hex-input').dispatchEvent(new Event('input'));">
            <div class="color-swatch-fill" style="background-color: ${hexS};"></div>
            <div class="color-swatch-meta">
              <span class="color-swatch-label">${l}% Light</span>
              <span class="color-swatch-hex">${hexS}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  pickerInput.addEventListener('input', (e) => {
    const rgb = hexToRgb(e.target.value);
    const alpha = alphaSlider ? parseFloat(alphaSlider.value) : 1;
    if (rgb) updateAllFromRgb(rgb.r, rgb.g, rgb.b, alpha);
  });

  if (hexInput) {
    hexInput.addEventListener('input', (e) => {
      const rgb = hexToRgb(e.target.value);
      const alpha = alphaSlider ? parseFloat(alphaSlider.value) : 1;
      if (rgb) updateAllFromRgb(rgb.r, rgb.g, rgb.b, alpha);
    });
  }

  if (alphaSlider && alphaVal) {
    alphaSlider.addEventListener('input', (e) => {
      alphaVal.textContent = `${Math.round(e.target.value * 100)}%`;
      const rgb = hexToRgb(pickerInput.value);
      if (rgb) updateAllFromRgb(rgb.r, rgb.g, rgb.b, parseFloat(e.target.value));
    });
  }

  // Copy buttons
  document.querySelectorAll('[data-copy-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-color');
      const inputEl = document.getElementById(targetId);
      if (inputEl && inputEl.value) {
        copyToClipboard(inputEl.value, `Copied ${inputEl.value}!`);
      }
    });
  });

  // Random color button
  const randomBtn = document.getElementById('btn-random-color');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const alpha = alphaSlider ? parseFloat(alphaSlider.value) : 1;
      updateAllFromRgb(r, g, b, alpha);
      showToast('Generated random vibrant color!', 'success');
    });
  }

  // Initial render with primary brand color #6366f1
  updateAllFromRgb(99, 102, 241, 1);
}

function initAllDataTools() {
  initCsvJsonConverter();
  initJsonStudio();
  initJwtDebugger();
  initColorStudio();
  initMarkdownEditor();
  initEncodersDecoders();
  initHashAndUuid();
}

window.addEventListener('DOMContentLoaded', initAllDataTools);


