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

  function convertCsvToJson() {
    const raw = csvInput.value.trim();
    if (!raw) {
      showToast('Please enter CSV data', 'error');
      return;
    }

    try {
      if (window.Papa) {
        const parsed = Papa.parse(raw, { header: true, dynamicTyping: true, skipEmptyLines: true });
        jsonInput.value = JSON.stringify(parsed.data, null, 2);
        renderTable(parsed.data);
        showToast('Converted CSV to JSON!', 'success');
      } else {
        // Fallback basic CSV parser
        const lines = raw.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).filter(l => l.trim()).map(line => {
          const vals = line.split(',');
          const obj = {};
          headers.forEach((h, i) => obj[h] = vals[i] ? vals[i].trim() : '');
          return obj;
        });
        jsonInput.value = JSON.stringify(data, null, 2);
        renderTable(data);
        showToast('Converted CSV to JSON!', 'success');
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
        showToast('Converted JSON to CSV!', 'success');
      } else {
        const headers = Object.keys(data[0]);
        const rows = [headers.join(',')];
        data.forEach(item => {
          rows.push(headers.map(h => JSON.stringify(item[h] || '')).join(','));
        });
        csvInput.value = rows.join('\n');
        renderTable(data);
        showToast('Converted JSON to CSV!', 'success');
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

  async function calculateHashes() {
    const str = hashInput ? hashInput.value : '';
    if (!str) {
      [md5Out, sha1Out, sha256Out, sha512Out].forEach(el => el && (el.textContent = '—'));
      return;
    }

    // MD5
    if (md5Out && typeof md5 === 'function') md5Out.textContent = md5(str);

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
