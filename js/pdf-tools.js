/* ==========================================================================
   OmniDoc Studio - PDF Tools Engine (Merge, Split, Convert, Extract, Rotate)
   ========================================================================== */

// Global State for PDF Tools
const pdfState = {
  mergeFiles: [],
  splitDoc: null,
  splitDocBytes: null,
  splitSelectedPages: new Set(),
  imgToPdfFiles: [],
  pdfToImgDoc: null,
  pdfToImgPages: [],
  rotateDoc: null,
  rotateDocBytes: null,
  rotatePageAngles: [] // array of degrees per page
};

// Initialize PDF.js worker if available
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/* ==========================================================================
   1. PDF Merge Implementation
   ========================================================================== */

function initPdfMerge() {
  const dropzone = document.getElementById('pdf-merge-dropzone');
  const fileInput = document.getElementById('pdf-merge-input');
  const listContainer = document.getElementById('pdf-merge-list');
  const actionBtn = document.getElementById('btn-merge-pdf');
  const clearBtn = document.getElementById('btn-clear-merge-pdf');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const pdfs = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) {
      showToast('Please upload valid PDF files', 'error');
      return;
    }

    for (const file of pdfs) {
      try {
        const buffer = await readFileAsArrayBuffer(file);
        pdfState.mergeFiles.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          buffer,
          name: file.name,
          size: file.size
        });
      } catch (e) {
        console.error('Error reading PDF file:', e);
      }
    }
    renderMergeList();
    showToast(`Added ${pdfs.length} PDF file(s)`, 'success');
  });

  function renderMergeList() {
    listContainer.innerHTML = '';
    if (pdfState.mergeFiles.length === 0) {
      listContainer.innerHTML = `<p class="text-secondary" style="font-size: 0.85rem; text-align: center; padding: 1rem;">No PDF files added yet.</p>`;
      actionBtn.disabled = true;
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    actionBtn.disabled = false;
    if (clearBtn) clearBtn.style.display = 'inline-flex';

    pdfState.mergeFiles.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'pdf-merge-item';
      row.innerHTML = `
        <div class="file-item-info">
          <span class="pdf-order-badge">${index + 1}</span>
          <i data-lucide="file-text" style="color: var(--primary); width: 20px;"></i>
          <div class="file-item-meta">
            <div class="file-item-name" title="${item.name}">${item.name}</div>
            <div class="file-item-size">${formatBytes(item.size)}</div>
          </div>
        </div>
        <div class="file-item-actions">
          <button class="btn btn-secondary btn-icon-only" title="Move Up" ${index === 0 ? 'disabled' : ''} data-action="up" data-index="${index}">
            <i data-lucide="arrow-up" style="width: 14px;"></i>
          </button>
          <button class="btn btn-secondary btn-icon-only" title="Move Down" ${index === pdfState.mergeFiles.length - 1 ? 'disabled' : ''} data-action="down" data-index="${index}">
            <i data-lucide="arrow-down" style="width: 14px;"></i>
          </button>
          <button class="btn btn-danger btn-icon-only" title="Remove" data-action="remove" data-index="${index}">
            <i data-lucide="trash-2" style="width: 14px;"></i>
          </button>
        </div>
      `;
      listContainer.appendChild(row);
    });

    if (window.lucide) lucide.createIcons();

    // Attach actions
    listContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (action === 'up' && idx > 0) {
          const temp = pdfState.mergeFiles[idx];
          pdfState.mergeFiles[idx] = pdfState.mergeFiles[idx - 1];
          pdfState.mergeFiles[idx - 1] = temp;
          renderMergeList();
        } else if (action === 'down' && idx < pdfState.mergeFiles.length - 1) {
          const temp = pdfState.mergeFiles[idx];
          pdfState.mergeFiles[idx] = pdfState.mergeFiles[idx + 1];
          pdfState.mergeFiles[idx + 1] = temp;
          renderMergeList();
        } else if (action === 'remove') {
          pdfState.mergeFiles.splice(idx, 1);
          renderMergeList();
        }
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      pdfState.mergeFiles = [];
      renderMergeList();
      showToast('Cleared merge list', 'info');
    });
  }

  actionBtn.addEventListener('click', async () => {
    if (pdfState.mergeFiles.length < 2) {
      showToast('Please add at least 2 PDF files to merge', 'error');
      return;
    }

    try {
      actionBtn.disabled = true;
      actionBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Merging...`;
      if (window.lucide) lucide.createIcons();

      const { PDFDocument } = PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfState.mergeFiles) {
        const pdf = await PDFDocument.load(item.buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      downloadBlob(blob, 'merged_document.pdf');
      showToast('PDF files merged successfully!', 'success');
    } catch (err) {
      console.error('Merge error:', err);
      showToast('Failed to merge PDFs: ' + err.message, 'error');
    } finally {
      actionBtn.disabled = false;
      actionBtn.innerHTML = `<i data-lucide="layers"></i> Merge & Download PDF`;
      if (window.lucide) lucide.createIcons();
    }
  });
}

/* ==========================================================================
   2. PDF Split & Page Extractor Implementation
   ========================================================================== */

function initPdfSplit() {
  const dropzone = document.getElementById('pdf-split-dropzone');
  const fileInput = document.getElementById('pdf-split-input');
  const previewArea = document.getElementById('pdf-split-workspace');
  const pagesGrid = document.getElementById('pdf-split-grid');
  const rangeInput = document.getElementById('pdf-split-range');
  const selectAllBtn = document.getElementById('btn-split-select-all');
  const deselectBtn = document.getElementById('btn-split-deselect-all');
  const extractBtn = document.getElementById('btn-extract-pages');
  const splitZipBtn = document.getElementById('btn-split-zip');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const file = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!file) {
      showToast('Please upload a valid PDF file', 'error');
      return;
    }

    try {
      showToast('Loading PDF pages...', 'info');
      pdfState.splitDocBytes = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({ data: pdfState.splitDocBytes.slice(0) });
      pdfState.splitDoc = await loadingTask.promise;
      pdfState.splitSelectedPages.clear();

      renderSplitGrid();
      previewArea.style.display = 'block';
      showToast(`Loaded ${pdfState.splitDoc.numPages} pages`, 'success');
    } catch (err) {
      console.error('Split load error:', err);
      showToast('Failed to parse PDF: ' + err.message, 'error');
    }
  });

  async function renderSplitGrid() {
    pagesGrid.innerHTML = '';
    const totalPages = pdfState.splitDoc.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      card.id = `pdf-split-page-${pageNum}`;
      card.innerHTML = `
        <div class="pdf-page-check"><i data-lucide="check" style="width: 12px; height: 12px;"></i></div>
        <canvas class="pdf-page-canvas" id="canvas-page-${pageNum}"></canvas>
        <span class="pdf-page-number">Page ${pageNum}</span>
      `;

      card.addEventListener('click', () => {
        if (pdfState.splitSelectedPages.has(pageNum)) {
          pdfState.splitSelectedPages.delete(pageNum);
          card.classList.remove('selected');
        } else {
          pdfState.splitSelectedPages.add(pageNum);
          card.classList.add('selected');
        }
        updateRangeInputFromSelection();
      });

      pagesGrid.appendChild(card);

      // Render thumbnail asynchronously
      renderPageThumbnail(pageNum);
    }
    if (window.lucide) lucide.createIcons();
  }

  async function renderPageThumbnail(pageNum) {
    try {
      const page = await pdfState.splitDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.getElementById(`canvas-page-${pageNum}`);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (e) {
      console.error(`Thumb render error on page ${pageNum}:`, e);
    }
  }

  function updateSelectionFromRange(rangeStr) {
    pdfState.splitSelectedPages.clear();
    const totalPages = pdfState.splitDoc ? pdfState.splitDoc.numPages : 0;
    const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
            if (p >= 1 && p <= totalPages) pdfState.splitSelectedPages.add(p);
          }
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) pdfState.splitSelectedPages.add(p);
      }
    }

    for (let p = 1; p <= totalPages; p++) {
      const card = document.getElementById(`pdf-split-page-${p}`);
      if (card) {
        if (pdfState.splitSelectedPages.has(p)) card.classList.add('selected');
        else card.classList.remove('selected');
      }
    }
  }

  function updateRangeInputFromSelection() {
    const sorted = Array.from(pdfState.splitSelectedPages).sort((a, b) => a - b);
    rangeInput.value = sorted.join(', ');
  }

  if (rangeInput) {
    rangeInput.addEventListener('input', (e) => updateSelectionFromRange(e.target.value));
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      const totalPages = pdfState.splitDoc.numPages;
      pdfState.splitSelectedPages.clear();
      for (let i = 1; i <= totalPages; i++) pdfState.splitSelectedPages.add(i);
      updateRangeInputFromSelection();
      pagesGrid.querySelectorAll('.pdf-page-card').forEach(c => c.classList.add('selected'));
    });
  }

  if (deselectBtn) {
    deselectBtn.addEventListener('click', () => {
      pdfState.splitSelectedPages.clear();
      rangeInput.value = '';
      pagesGrid.querySelectorAll('.pdf-page-card').forEach(c => c.classList.remove('selected'));
    });
  }

  // Extract selected pages into single PDF
  if (extractBtn) {
    extractBtn.addEventListener('click', async () => {
      if (pdfState.splitSelectedPages.size === 0) {
        showToast('Please select at least 1 page to extract', 'error');
        return;
      }

      try {
        const { PDFDocument } = PDFLib;
        const srcPdf = await PDFDocument.load(pdfState.splitDocBytes);
        const newPdf = await PDFDocument.create();

        const selectedIndices = Array.from(pdfState.splitSelectedPages)
          .sort((a, b) => a - b)
          .map(p => p - 1); // 0-based

        const copiedPages = await newPdf.copyPages(srcPdf, selectedIndices);
        copiedPages.forEach(p => newPdf.addPage(p));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, `extracted_pages_${selectedIndices.map(i => i + 1).join('_')}.pdf`);
        showToast('Extracted pages saved to PDF!', 'success');
      } catch (err) {
        console.error('Extract error:', err);
        showToast('Failed to extract pages: ' + err.message, 'error');
      }
    });
  }

  // Split all pages into individual PDFs zipped
  if (splitZipBtn) {
    splitZipBtn.addEventListener('click', async () => {
      if (!window.JSZip) {
        showToast('ZIP library not loaded', 'error');
        return;
      }

      try {
        splitZipBtn.disabled = true;
        splitZipBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Zipping...`;
        if (window.lucide) lucide.createIcons();

        const { PDFDocument } = PDFLib;
        const srcPdf = await PDFDocument.load(pdfState.splitDocBytes);
        const zip = new JSZip();
        const totalPages = srcPdf.getPageCount();

        for (let i = 0; i < totalPages; i++) {
          const singleDoc = await PDFDocument.create();
          const [page] = await singleDoc.copyPages(srcPdf, [i]);
          singleDoc.addPage(page);
          const bytes = await singleDoc.save();
          zip.file(`page_${i + 1}.pdf`, bytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'split_pdf_pages.zip');
        showToast('All pages split and downloaded as ZIP!', 'success');
      } catch (err) {
        console.error('Zip split error:', err);
        showToast('Failed to split to ZIP: ' + err.message, 'error');
      } finally {
        splitZipBtn.disabled = false;
        splitZipBtn.innerHTML = `<i data-lucide="archive"></i> Split All to ZIP`;
        if (window.lucide) lucide.createIcons();
      }
    });
  }
}

/* ==========================================================================
   3. Images to PDF Implementation
   ========================================================================== */

function initImagesToPdf() {
  const dropzone = document.getElementById('img-pdf-dropzone');
  const fileInput = document.getElementById('img-pdf-input');
  const listContainer = document.getElementById('img-pdf-list');
  const convertBtn = document.getElementById('btn-convert-img-pdf');
  const pageSizeSelect = document.getElementById('img-pdf-page-size');
  const orientationSelect = document.getElementById('img-pdf-orientation');
  const marginSelect = document.getElementById('img-pdf-margin');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      showToast('Please upload image files (JPG, PNG, WebP)', 'error');
      return;
    }

    for (const file of imageFiles) {
      const dataUrl = await readFileAsDataURL(file);
      pdfState.imgToPdfFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        dataUrl,
        name: file.name,
        size: file.size
      });
    }
    renderImgList();
    showToast(`Added ${imageFiles.length} image(s)`, 'success');
  });

  function renderImgList() {
    listContainer.innerHTML = '';
    if (pdfState.imgToPdfFiles.length === 0) {
      listContainer.innerHTML = `<p class="text-secondary" style="font-size: 0.85rem; text-align: center; padding: 1rem;">No images added yet.</p>`;
      convertBtn.disabled = true;
      return;
    }

    convertBtn.disabled = false;

    pdfState.imgToPdfFiles.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'pdf-merge-item';
      row.innerHTML = `
        <div class="file-item-info">
          <img src="${item.dataUrl}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px;" />
          <div class="file-item-meta">
            <div class="file-item-name" title="${item.name}">${item.name}</div>
            <div class="file-item-size">${formatBytes(item.size)}</div>
          </div>
        </div>
        <div class="file-item-actions">
          <button class="btn btn-secondary btn-icon-only" title="Move Up" ${index === 0 ? 'disabled' : ''} data-action="up" data-index="${index}">
            <i data-lucide="arrow-up" style="width: 14px;"></i>
          </button>
          <button class="btn btn-secondary btn-icon-only" title="Move Down" ${index === pdfState.imgToPdfFiles.length - 1 ? 'disabled' : ''} data-action="down" data-index="${index}">
            <i data-lucide="arrow-down" style="width: 14px;"></i>
          </button>
          <button class="btn btn-danger btn-icon-only" title="Remove" data-action="remove" data-index="${index}">
            <i data-lucide="trash-2" style="width: 14px;"></i>
          </button>
        </div>
      `;
      listContainer.appendChild(row);
    });

    if (window.lucide) lucide.createIcons();

    listContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (action === 'up' && idx > 0) {
          const temp = pdfState.imgToPdfFiles[idx];
          pdfState.imgToPdfFiles[idx] = pdfState.imgToPdfFiles[idx - 1];
          pdfState.imgToPdfFiles[idx - 1] = temp;
          renderImgList();
        } else if (action === 'down' && idx < pdfState.imgToPdfFiles.length - 1) {
          const temp = pdfState.imgToPdfFiles[idx];
          pdfState.imgToPdfFiles[idx] = pdfState.imgToPdfFiles[idx + 1];
          pdfState.imgToPdfFiles[idx + 1] = temp;
          renderImgList();
        } else if (action === 'remove') {
          pdfState.imgToPdfFiles.splice(idx, 1);
          renderImgList();
        }
      });
    });
  }

  if (convertBtn) {
    convertBtn.addEventListener('click', async () => {
      if (pdfState.imgToPdfFiles.length === 0) return;
      if (!window.jspdf || !window.jspdf.jsPDF) {
        showToast('jsPDF library not available', 'error');
        return;
      }

      try {
        convertBtn.disabled = true;
        convertBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Generating PDF...`;
        if (window.lucide) lucide.createIcons();

        const { jsPDF } = window.jspdf;
        const pageSize = pageSizeSelect.value || 'a4';
        const orientation = orientationSelect.value || 'p';
        const marginVal = parseInt(marginSelect.value, 10) || 0;

        const doc = new jsPDF({
          orientation: orientation === 'auto' ? 'p' : orientation,
          unit: 'pt',
          format: pageSize === 'fit' ? 'a4' : pageSize
        });

        for (let i = 0; i < pdfState.imgToPdfFiles.length; i++) {
          const item = pdfState.imgToPdfFiles[i];
          const img = new Image();
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = item.dataUrl;
          });

          if (i > 0) doc.addPage(pageSize === 'fit' ? [img.width, img.height] : pageSize, orientation === 'auto' ? (img.width > img.height ? 'l' : 'p') : orientation);

          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const availWidth = pageWidth - (marginVal * 2);
          const availHeight = pageHeight - (marginVal * 2);

          // Calculate aspect ratio fit
          const imgRatio = img.width / img.height;
          let renderWidth = availWidth;
          let renderHeight = renderWidth / imgRatio;

          if (renderHeight > availHeight) {
            renderHeight = availHeight;
            renderWidth = renderHeight * imgRatio;
          }

          const x = marginVal + (availWidth - renderWidth) / 2;
          const y = marginVal + (availHeight - renderHeight) / 2;

          doc.addImage(img, 'JPEG', x, y, renderWidth, renderHeight);
        }

        doc.save('images_converted.pdf');
        showToast('PDF created successfully!', 'success');
      } catch (err) {
        console.error('Image to PDF error:', err);
        showToast('Failed to create PDF: ' + err.message, 'error');
      } finally {
        convertBtn.disabled = false;
        convertBtn.innerHTML = `<i data-lucide="file-plus"></i> Convert to PDF`;
        if (window.lucide) lucide.createIcons();
      }
    });
  }
}

/* ==========================================================================
   4. Text to PDF Implementation
   ========================================================================== */

function initTextToPdf() {
  const textarea = document.getElementById('text-to-pdf-content');
  const titleInput = document.getElementById('text-to-pdf-title');
  const fontSizeSelect = document.getElementById('text-to-pdf-fontsize');
  const fontFamilySelect = document.getElementById('text-to-pdf-font');
  const convertBtn = document.getElementById('btn-text-to-pdf');

  if (!convertBtn) return;

  convertBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) {
      showToast('Please enter some text to generate PDF', 'error');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxLineWidth = pageWidth - margin * 2;

      let currentY = margin + 20;

      // Add Title if provided
      const title = titleInput.value.trim();
      if (title) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(title, margin, currentY);
        currentY += 30;
      }

      const fontSize = parseInt(fontSizeSelect.value, 10) || 12;
      const fontFamily = fontFamilySelect.value || 'helvetica';
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(fontSize);

      const lineHeight = fontSize * 1.4;
      const splitText = doc.splitTextToSize(text, maxLineWidth);

      for (let i = 0; i < splitText.length; i++) {
        if (currentY + lineHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin + 20;
        }
        doc.text(splitText[i], margin, currentY);
        currentY += lineHeight;
      }

      const fileName = (title ? title.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'document') + '.pdf';
      doc.save(fileName);
      showToast('Text converted to PDF successfully!', 'success');
    } catch (err) {
      console.error('Text to PDF error:', err);
      showToast('Failed to convert text to PDF: ' + err.message, 'error');
    }
  });
}

/* ==========================================================================
   5. PDF to Images Implementation
   ========================================================================== */

function initPdfToImages() {
  const dropzone = document.getElementById('pdf-to-img-dropzone');
  const fileInput = document.getElementById('pdf-to-img-input');
  const workspace = document.getElementById('pdf-to-img-workspace');
  const grid = document.getElementById('pdf-to-img-grid');
  const zipBtn = document.getElementById('btn-pdf-img-zip');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const file = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!file) {
      showToast('Please upload a valid PDF file', 'error');
      return;
    }

    try {
      showToast('Rendering PDF pages...', 'info');
      const bytes = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      pdfState.pdfToImgDoc = await loadingTask.promise;
      pdfState.pdfToImgPages = [];

      grid.innerHTML = '';
      workspace.style.display = 'block';

      const total = pdfState.pdfToImgDoc.numPages;

      for (let p = 1; p <= total; p++) {
        const page = await pdfState.pdfToImgDoc.getPage(p);
        const viewport = page.getViewport({ scale: 2.0 }); // High DPI render
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgDataUrl = canvas.toDataURL('image/png');
        pdfState.pdfToImgPages.push({ pageNum: p, dataUrl: imgDataUrl, canvas });

        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.padding = '1rem';
        card.innerHTML = `
          <div style="text-align: center; margin-bottom: 0.5rem; font-weight: 700;">Page ${p}</div>
          <img src="${imgDataUrl}" style="width: 100%; height: 220px; object-fit: contain; background: #fff; border-radius: 4px;" />
          <button class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 0.75rem;" data-page="${p}">
            <i data-lucide="download" style="width: 14px;"></i> Download PNG
          </button>
        `;

        card.querySelector('button').addEventListener('click', () => {
          const a = document.createElement('a');
          a.href = imgDataUrl;
          a.download = `page_${p}.png`;
          a.click();
        });

        grid.appendChild(card);
      }

      if (window.lucide) lucide.createIcons();
      showToast(`Rendered ${total} pages successfully!`, 'success');
    } catch (err) {
      console.error('PDF to Image error:', err);
      showToast('Failed to convert PDF to images: ' + err.message, 'error');
    }
  });

  if (zipBtn) {
    zipBtn.addEventListener('click', async () => {
      if (pdfState.pdfToImgPages.length === 0) return;
      if (!window.JSZip) {
        showToast('JSZip not loaded', 'error');
        return;
      }

      try {
        zipBtn.disabled = true;
        zipBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Zipping...`;
        if (window.lucide) lucide.createIcons();

        const zip = new JSZip();
        for (const item of pdfState.pdfToImgPages) {
          const base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');
          zip.file(`page_${item.pageNum}.png`, base64Data, { base64: true });
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'pdf_pages_images.zip');
        showToast('All page images saved as ZIP!', 'success');
      } catch (err) {
        showToast('Zip error: ' + err.message, 'error');
      } finally {
        zipBtn.disabled = false;
        zipBtn.innerHTML = `<i data-lucide="archive"></i> Download All as ZIP`;
        if (window.lucide) lucide.createIcons();
      }
    });
  }
}

/* ==========================================================================
   6. PDF Page Rotator Implementation
   ========================================================================== */

function initPdfRotator() {
  const dropzone = document.getElementById('pdf-rotate-dropzone');
  const fileInput = document.getElementById('pdf-rotate-input');
  const workspace = document.getElementById('pdf-rotate-workspace');
  const grid = document.getElementById('pdf-rotate-grid');
  const rotateAllCwBtn = document.getElementById('btn-rotate-all-cw');
  const saveBtn = document.getElementById('btn-save-rotated-pdf');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const file = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!file) {
      showToast('Please upload a valid PDF', 'error');
      return;
    }

    try {
      showToast('Loading PDF for rotation...', 'info');
      pdfState.rotateDocBytes = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({ data: pdfState.rotateDocBytes.slice(0) });
      pdfState.rotateDoc = await loadingTask.promise;

      const total = pdfState.rotateDoc.numPages;
      pdfState.rotatePageAngles = new Array(total).fill(0);

      renderRotateGrid();
      workspace.style.display = 'block';
      showToast(`Loaded ${total} pages for rotation`, 'success');
    } catch (err) {
      showToast('Error loading PDF: ' + err.message, 'error');
    }
  });

  async function renderRotateGrid() {
    grid.innerHTML = '';
    const total = pdfState.rotateDoc.numPages;

    for (let p = 1; p <= total; p++) {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.padding = '0.85rem';
      card.style.textAlign = 'center';
      card.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 0.5rem; font-size: 0.88rem;">Page ${p}</div>
        <div style="height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #ffffff; border-radius: 4px;">
          <canvas id="rotate-canvas-${p}" style="max-height: 100%; max-width: 100%; transition: transform 0.25s;"></canvas>
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.75rem;">
          <button class="btn btn-secondary btn-sm" data-action="ccw" data-page="${p}" title="Rotate Counter-Clockwise">
            <i data-lucide="rotate-ccw" style="width: 14px;"></i>
          </button>
          <button class="btn btn-secondary btn-sm" data-action="cw" data-page="${p}" title="Rotate Clockwise">
            <i data-lucide="rotate-cw" style="width: 14px;"></i>
          </button>
        </div>
      `;

      grid.appendChild(card);
      renderRotateThumbnail(p);
    }

    if (window.lucide) lucide.createIcons();

    grid.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const p = parseInt(btn.getAttribute('data-page'), 10);
        const idx = p - 1;
        if (action === 'cw') {
          pdfState.rotatePageAngles[idx] = (pdfState.rotatePageAngles[idx] + 90) % 360;
        } else {
          pdfState.rotatePageAngles[idx] = (pdfState.rotatePageAngles[idx] - 90 + 360) % 360;
        }
        const canvas = document.getElementById(`rotate-canvas-${p}`);
        if (canvas) canvas.style.transform = `rotate(${pdfState.rotatePageAngles[idx]}deg)`;
      });
    });
  }

  async function renderRotateThumbnail(p) {
    const page = await pdfState.rotateDoc.getPage(p);
    const viewport = page.getViewport({ scale: 0.35 });
    const canvas = document.getElementById(`rotate-canvas-${p}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  if (rotateAllCwBtn) {
    rotateAllCwBtn.addEventListener('click', () => {
      const total = pdfState.rotatePageAngles.length;
      for (let i = 0; i < total; i++) {
        pdfState.rotatePageAngles[i] = (pdfState.rotatePageAngles[i] + 90) % 360;
        const canvas = document.getElementById(`rotate-canvas-${i + 1}`);
        if (canvas) canvas.style.transform = `rotate(${pdfState.rotatePageAngles[i]}deg)`;
      }
      showToast('Rotated all pages by 90°', 'info');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      try {
        const { PDFDocument, degrees } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfState.rotateDocBytes);
        const pages = pdfDoc.getPages();

        pages.forEach((page, idx) => {
          const currentRotation = page.getRotation().angle;
          const additionalRotation = pdfState.rotatePageAngles[idx] || 0;
          page.setRotation(degrees((currentRotation + additionalRotation) % 360));
        });

        const savedBytes = await pdfDoc.save();
        const blob = new Blob([savedBytes], { type: 'application/pdf' });
        downloadBlob(blob, 'rotated_document.pdf');
        showToast('Saved rotated PDF successfully!', 'success');
      } catch (err) {
        showToast('Failed to save rotated PDF: ' + err.message, 'error');
      }
    });
  }
}

// Master PDF init helper
function initAllPdfTools() {
  initPdfMerge();
  initPdfSplit();
  initImagesToPdf();
  initTextToPdf();
  initPdfToImages();
  initPdfRotator();
}

window.addEventListener('DOMContentLoaded', initAllPdfTools);
