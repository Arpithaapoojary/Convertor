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

function initAllDataTools() {
  initCsvJsonConverter();
  initMarkdownEditor();
  initEncodersDecoders();
  initHashAndUuid();
}

window.addEventListener('DOMContentLoaded', initAllDataTools);
