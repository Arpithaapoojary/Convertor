/* ==========================================================================
   OmniDoc Studio - Image Studio Engine (Compress, Convert, Base64, Palette)
   ========================================================================== */

const imgState = {
  // Compressor
  compressorFile: null,
  compressorOriginalImg: null,
  compressorCompressedBlob: null,
  // Converter
  convertFiles: [],
  // Palette & Filters
  filterImg: null
};

/* ==========================================================================
   1. Image Compressor Implementation
   ========================================================================== */

function initImageCompressor() {
  const dropzone = document.getElementById('img-compress-dropzone');
  const fileInput = document.getElementById('img-compress-input');
  const workspace = document.getElementById('img-compress-workspace');
  const qualitySlider = document.getElementById('compress-quality-slider');
  const qualityVal = document.getElementById('compress-quality-val');
  const formatSelect = document.getElementById('compress-format-select');
  const resizeWidth = document.getElementById('compress-max-width');
  const resizeHeight = document.getElementById('compress-max-height');
  
  const origPreview = document.getElementById('compress-orig-preview');
  const compPreview = document.getElementById('compress-comp-preview');
  const origSizeEl = document.getElementById('compress-orig-size');
  const compSizeEl = document.getElementById('compress-comp-size');
  const savingsBadge = document.getElementById('compress-savings-badge');
  const downloadBtn = document.getElementById('btn-download-compressed');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const file = files.find(f => f.type.startsWith('image/'));
    if (!file) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    imgState.compressorFile = file;
    origSizeEl.textContent = formatBytes(file.size);

    const dataUrl = await readFileAsDataURL(file);
    const img = new Image();
    img.onload = () => {
      imgState.compressorOriginalImg = img;
      origPreview.src = dataUrl;
      if (resizeWidth) resizeWidth.value = img.naturalWidth;
      if (resizeHeight) resizeHeight.value = img.naturalHeight;
      workspace.style.display = 'block';
      compressImage();
    };
    img.src = dataUrl;
  });

  async function compressImage() {
    if (!imgState.compressorOriginalImg) return;

    const quality = (parseInt(qualitySlider.value, 10) || 80) / 100;
    const format = formatSelect.value || 'image/jpeg';
    let targetWidth = parseInt(resizeWidth.value, 10) || imgState.compressorOriginalImg.naturalWidth;
    let targetHeight = parseInt(resizeHeight.value, 10) || imgState.compressorOriginalImg.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    // Fill white background for JPEG transparency handling
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(imgState.compressorOriginalImg, 0, 0, targetWidth, targetHeight);

    canvas.toBlob((blob) => {
      if (!blob) return;
      imgState.compressorCompressedBlob = blob;
      compPreview.src = URL.createObjectURL(blob);
      compSizeEl.textContent = formatBytes(blob.size);

      const originalSize = imgState.compressorFile.size;
      const savings = ((originalSize - blob.size) / originalSize) * 100;

      if (savings > 0) {
        savingsBadge.textContent = `-${Math.round(savings)}%`;
        savingsBadge.style.display = 'inline-block';
        savingsBadge.className = 'savings-badge';
      } else {
        savingsBadge.textContent = `+${Math.abs(Math.round(savings))}%`;
        savingsBadge.style.display = 'inline-block';
        savingsBadge.className = 'savings-badge';
        savingsBadge.style.color = 'var(--accent-amber)';
        savingsBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      }
    }, format, quality);
  }

  const lockRatioCheckbox = document.getElementById('compress-lock-ratio');

  if (qualitySlider) {
    qualitySlider.addEventListener('input', (e) => {
      qualityVal.textContent = e.target.value + '%';
      compressImage();
    });
  }

  if (formatSelect) formatSelect.addEventListener('change', compressImage);

  if (resizeWidth) {
    resizeWidth.addEventListener('input', () => {
      if (lockRatioCheckbox && lockRatioCheckbox.checked && imgState.compressorOriginalImg) {
        const origW = imgState.compressorOriginalImg.naturalWidth;
        const origH = imgState.compressorOriginalImg.naturalHeight;
        const w = parseInt(resizeWidth.value, 10);
        if (w && origW) {
          resizeHeight.value = Math.round((w / origW) * origH);
        }
      }
      compressImage();
    });
  }

  if (resizeHeight) {
    resizeHeight.addEventListener('input', () => {
      if (lockRatioCheckbox && lockRatioCheckbox.checked && imgState.compressorOriginalImg) {
        const origW = imgState.compressorOriginalImg.naturalWidth;
        const origH = imgState.compressorOriginalImg.naturalHeight;
        const h = parseInt(resizeHeight.value, 10);
        if (h && origH) {
          resizeWidth.value = Math.round((h / origH) * origW);
        }
      }
      compressImage();
    });
  }

  // Handle Quick Presets
  document.querySelectorAll('[data-img-scale]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!imgState.compressorOriginalImg) return;
      const scale = parseFloat(btn.getAttribute('data-img-scale')) || 1.0;
      resizeWidth.value = Math.round(imgState.compressorOriginalImg.naturalWidth * scale);
      resizeHeight.value = Math.round(imgState.compressorOriginalImg.naturalHeight * scale);
      compressImage();
      showToast(`Scaled image to ${Math.round(scale * 100)}%`, 'info');
    });
  });

  document.querySelectorAll('[data-img-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!imgState.compressorOriginalImg) return;
      const preset = btn.getAttribute('data-img-preset');
      if (preset === 'avatar') {
        resizeWidth.value = 512;
        resizeHeight.value = 512;
      } else if (preset === 'hd') {
        resizeWidth.value = 1920;
        resizeHeight.value = 1080;
      }
      compressImage();
      showToast(`Applied ${preset.toUpperCase()} dimension preset`, 'info');
    });
  });

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!imgState.compressorCompressedBlob) return;
      const ext = formatSelect.value === 'image/png' ? 'png' : (formatSelect.value === 'image/webp' ? 'webp' : 'jpg');
      const originalName = imgState.compressorFile.name.replace(/\.[^/.]+$/, '');
      downloadBlob(imgState.compressorCompressedBlob, `${originalName}_compressed.${ext}`);
      showToast('Downloaded compressed image!', 'success');
    });
  }
}

/* ==========================================================================
   2. Image Format Converter Implementation
   ========================================================================== */

function initImageConverter() {
  const dropzone = document.getElementById('img-convert-dropzone');
  const fileInput = document.getElementById('img-convert-input');
  const workspace = document.getElementById('img-convert-workspace');
  const listContainer = document.getElementById('img-convert-list');
  const globalFormatSelect = document.getElementById('img-convert-global-format');
  const convertAllBtn = document.getElementById('btn-convert-all-images');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
      showToast('Please upload valid images', 'error');
      return;
    }

    for (const file of validImages) {
      const dataUrl = await readFileAsDataURL(file);
      imgState.convertFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        dataUrl,
        name: file.name,
        size: file.size,
        targetFormat: globalFormatSelect ? globalFormatSelect.value : 'png'
      });
    }

    workspace.style.display = 'block';
    renderConverterList();
    showToast(`Added ${validImages.length} image(s)`, 'success');
  });

  function renderConverterList() {
    listContainer.innerHTML = '';
    if (imgState.convertFiles.length === 0) {
      workspace.style.display = 'none';
      return;
    }

    imgState.convertFiles.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'file-item-row';
      row.innerHTML = `
        <div class="file-item-info">
          <img src="${item.dataUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" />
          <div class="file-item-meta">
            <div class="file-item-name" title="${item.name}">${item.name}</div>
            <div class="file-item-size">${formatBytes(item.size)}</div>
          </div>
        </div>
        <div class="file-item-actions">
          <select class="form-select" style="padding: 0.35rem 1.8rem 0.35rem 0.65rem; font-size: 0.8rem; width: 100px;" data-format-idx="${idx}">
            <option value="png" ${item.targetFormat === 'png' ? 'selected' : ''}>PNG</option>
            <option value="jpeg" ${item.targetFormat === 'jpeg' ? 'selected' : ''}>JPG</option>
            <option value="webp" ${item.targetFormat === 'webp' ? 'selected' : ''}>WebP</option>
          </select>
          <button class="btn btn-secondary btn-sm" data-action="convert-single" data-index="${idx}">
            <i data-lucide="download" style="width: 14px;"></i>
          </button>
          <button class="btn btn-danger btn-icon-only" data-action="remove" data-index="${idx}">
            <i data-lucide="trash-2" style="width: 14px;"></i>
          </button>
        </div>
      `;
      listContainer.appendChild(row);
    });

    if (window.lucide) lucide.createIcons();

    // Format changes
    listContainer.querySelectorAll('[data-format-idx]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const i = parseInt(e.target.getAttribute('data-format-idx'), 10);
        imgState.convertFiles[i].targetFormat = e.target.value;
      });
    });

    // Single convert & remove
    listContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-action');
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (action === 'remove') {
          imgState.convertFiles.splice(idx, 1);
          renderConverterList();
        } else if (action === 'convert-single') {
          await convertAndDownloadSingle(imgState.convertFiles[idx]);
        }
      });
    });
  }

  if (globalFormatSelect) {
    globalFormatSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      imgState.convertFiles.forEach(f => f.targetFormat = val);
      renderConverterList();
    });
  }

  async function convertAndDownloadSingle(item) {
    const img = new Image();
    await new Promise(res => { img.onload = res; img.src = item.dataUrl; });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    if (item.targetFormat === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);

    const mimeType = `image/${item.targetFormat}`;
    canvas.toBlob((blob) => {
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      const ext = item.targetFormat === 'jpeg' ? 'jpg' : item.targetFormat;
      downloadBlob(blob, `${baseName}.${ext}`);
      showToast(`Converted ${item.name}!`, 'success');
    }, mimeType, 0.92);
  }

  if (convertAllBtn) {
    convertAllBtn.addEventListener('click', async () => {
      if (imgState.convertFiles.length === 0) return;

      try {
        convertAllBtn.disabled = true;
        convertAllBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Converting...`;
        if (window.lucide) lucide.createIcons();

        if (imgState.convertFiles.length === 1) {
          await convertAndDownloadSingle(imgState.convertFiles[0]);
        } else {
          const zip = new JSZip();
          for (const item of imgState.convertFiles) {
            const img = new Image();
            await new Promise(res => { img.onload = res; img.src = item.dataUrl; });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (item.targetFormat === 'jpeg') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);

            const mimeType = `image/${item.targetFormat}`;
            const blob = await new Promise(res => canvas.toBlob(res, mimeType, 0.92));
            const baseName = item.name.replace(/\.[^/.]+$/, '');
            const ext = item.targetFormat === 'jpeg' ? 'jpg' : item.targetFormat;
            zip.file(`${baseName}.${ext}`, blob);
          }

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          downloadBlob(zipBlob, 'converted_images.zip');
          showToast('Converted all images to ZIP!', 'success');
        }
      } catch (err) {
        showToast('Conversion error: ' + err.message, 'error');
      } finally {
        convertAllBtn.disabled = false;
        convertAllBtn.innerHTML = `<i data-lucide="sparkles"></i> Convert & Download All`;
        if (window.lucide) lucide.createIcons();
      }
    });
  }
}

/* ==========================================================================
   3. Image to Base64 & Base64 to Image Implementation
   ========================================================================== */

function initImageBase64() {
  // Image to Base64
  const dropzone = document.getElementById('img-b64-dropzone');
  const fileInput = document.getElementById('img-b64-input');
  const outputTextarea = document.getElementById('img-b64-output');
  const copyBtn = document.getElementById('btn-copy-img-b64');
  const copyCssBtn = document.getElementById('btn-copy-css-b64');

  if (dropzone && fileInput) {
    setupDropzone(dropzone, fileInput, async (files) => {
      const file = files.find(f => f.type.startsWith('image/'));
      if (!file) {
        showToast('Please upload an image', 'error');
        return;
      }

      const dataUrl = await readFileAsDataURL(file);
      outputTextarea.value = dataUrl;
      showToast('Generated Base64 data URI!', 'success');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!outputTextarea.value) return;
      copyToClipboard(outputTextarea.value, 'Copied Base64 string!');
    });
  }

  if (copyCssBtn) {
    copyCssBtn.addEventListener('click', () => {
      if (!outputTextarea.value) return;
      const cssSnippet = `background-image: url("${outputTextarea.value}");`;
      copyToClipboard(cssSnippet, 'Copied CSS background-image snippet!');
    });
  }

  // Base64 to Image
  const b64Input = document.getElementById('b64-to-img-input');
  const b64Preview = document.getElementById('b64-to-img-preview');
  const b64DownloadBtn = document.getElementById('btn-download-b64-img');

  if (b64Input) {
    b64Input.addEventListener('input', (e) => {
      let val = e.target.value.trim();
      if (!val) {
        b64Preview.src = '';
        b64Preview.style.display = 'none';
        return;
      }

      if (!val.startsWith('data:image')) {
        val = `data:image/png;base64,${val}`;
      }

      b64Preview.src = val;
      b64Preview.style.display = 'block';
    });
  }

  if (b64DownloadBtn) {
    b64DownloadBtn.addEventListener('click', () => {
      if (!b64Preview.src) {
        showToast('Please provide valid Base64 image data', 'error');
        return;
      }
      const a = document.createElement('a');
      a.href = b64Preview.src;
      a.download = 'decoded_image.png';
      a.click();
      showToast('Image downloaded!', 'success');
    });
  }
}

/* ==========================================================================
   4. Color Palette & Filter Studio Implementation
   ========================================================================== */

function initPaletteAndFilters() {
  const dropzone = document.getElementById('palette-dropzone');
  const fileInput = document.getElementById('palette-input');
  const workspace = document.getElementById('palette-workspace');
  const previewImg = document.getElementById('palette-preview-img');
  const swatchContainer = document.getElementById('palette-swatches-list');

  // Filter sliders
  const blurSlider = document.getElementById('filter-blur');
  const brightnessSlider = document.getElementById('filter-brightness');
  const contrastSlider = document.getElementById('filter-contrast');
  const grayscaleSlider = document.getElementById('filter-grayscale');
  const sepiaSlider = document.getElementById('filter-sepia');
  const invertSlider = document.getElementById('filter-invert');
  const resetFiltersBtn = document.getElementById('btn-reset-filters');
  const downloadFilteredBtn = document.getElementById('btn-download-filtered');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const file = files.find(f => f.type.startsWith('image/'));
    if (!file) {
      showToast('Please upload an image file', 'error');
      return;
    }

    const dataUrl = await readFileAsDataURL(file);
    const img = new Image();
    img.onload = () => {
      imgState.filterImg = img;
      previewImg.src = dataUrl;
      extractPalette(img);
      workspace.style.display = 'block';
      showToast('Image and palette extracted!', 'success');
    };
    img.src = dataUrl;
  });

  function extractPalette(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);

    const imgData = ctx.getImageData(0, 0, 100, 100).data;
    const colorMap = {};

    for (let i = 0; i < imgData.length; i += 16) {
      const r = Math.round(imgData[i] / 20) * 20;
      const g = Math.round(imgData[i + 1] / 20) * 20;
      const b = Math.round(imgData[i + 2] / 20) * 20;
      const hex = rgbToHex(r, g, b);
      colorMap[hex] = (colorMap[hex] || 0) + 1;
    }

    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 7);
    swatchContainer.innerHTML = '';

    sorted.forEach(([hex]) => {
      const item = document.createElement('div');
      item.className = 'palette-swatch-item';
      item.innerHTML = `
        <div class="palette-color-box" style="background-color: ${hex};" title="Click to copy ${hex}"></div>
        <span class="palette-hex">${hex}</span>
      `;
      item.addEventListener('click', () => copyToClipboard(hex, `Copied color ${hex}!`));
      swatchContainer.appendChild(item);
    });
  }

  function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }

  function applyFilters() {
    if (!previewImg) return;
    const blur = blurSlider ? blurSlider.value : 0;
    const bright = brightnessSlider ? brightnessSlider.value : 100;
    const cont = contrastSlider ? contrastSlider.value : 100;
    const gray = grayscaleSlider ? grayscaleSlider.value : 0;
    const sep = sepiaSlider ? sepiaSlider.value : 0;
    const inv = invertSlider ? invertSlider.value : 0;

    previewImg.style.filter = `blur(${blur}px) brightness(${bright}%) contrast(${cont}%) grayscale(${gray}%) sepia(${sep}%) invert(${inv}%)`;
  }

  [blurSlider, brightnessSlider, contrastSlider, grayscaleSlider, sepiaSlider, invertSlider].forEach(slider => {
    if (slider) slider.addEventListener('input', applyFilters);
  });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (blurSlider) blurSlider.value = 0;
      if (brightnessSlider) brightnessSlider.value = 100;
      if (contrastSlider) contrastSlider.value = 100;
      if (grayscaleSlider) grayscaleSlider.value = 0;
      if (sepiaSlider) sepiaSlider.value = 0;
      if (invertSlider) invertSlider.value = 0;
      applyFilters();
      showToast('Filters reset', 'info');
    });
  }

  if (downloadFilteredBtn) {
    downloadFilteredBtn.addEventListener('click', () => {
      if (!imgState.filterImg) return;

      const canvas = document.createElement('canvas');
      canvas.width = imgState.filterImg.naturalWidth;
      canvas.height = imgState.filterImg.naturalHeight;
      const ctx = canvas.getContext('2d');

      const blur = blurSlider ? (blurSlider.value * (canvas.width / 400)) : 0;
      ctx.filter = `blur(${blur}px) brightness(${brightnessSlider.value}%) contrast(${contrastSlider.value}%) grayscale(${grayscaleSlider.value}%) sepia(${sepiaSlider.value}%) invert(${invertSlider.value}%)`;
      ctx.drawImage(imgState.filterImg, 0, 0);

      canvas.toBlob((blob) => {
        downloadBlob(blob, 'filtered_image.png');
        showToast('Downloaded filtered image!', 'success');
      });
    });
  }
}

// Master Image Tools Init
function initAllImageTools() {
  initImageCompressor();
  initImageConverter();
  initImageBase64();
  initPaletteAndFilters();
}

window.addEventListener('DOMContentLoaded', initAllImageTools);
