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

    function getLuminance(r, g, b) {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    swatchContainer.innerHTML = '';

    sorted.forEach(([hex]) => {
      const r = parseInt(hex.substr(1, 2), 16);
      const g = parseInt(hex.substr(3, 2), 16);
      const b = parseInt(hex.substr(5, 2), 16);
      const lum = getLuminance(r, g, b);
      const crWhite = (1.05 / (lum + 0.05)).toFixed(1);
      const crBlack = ((lum + 0.05) / 0.05).toFixed(1);
      const bestText = lum > 0.4 ? '#000000' : '#ffffff';
      const bestCr = lum > 0.4 ? crBlack : crWhite;
      const wcagBadge = parseFloat(bestCr) >= 7 ? 'AAA' : (parseFloat(bestCr) >= 4.5 ? 'AA' : 'Fail');

      const item = document.createElement('div');
      item.className = 'palette-swatch-item';
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div class="palette-color-box" style="background-color: ${hex}; display: flex; align-items: center; justify-content: center;" title="Click to copy ${hex}">
          <span style="font-size: 0.68rem; font-weight: 700; color: ${bestText}; background: rgba(0,0,0,0.25); padding: 2px 4px; border-radius: 3px;">${wcagBadge}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <span class="palette-hex" style="font-weight: 700;">${hex}</span>
          <span style="font-size: 0.65rem; color: var(--text-muted);">${bestCr}:1</span>
        </div>
      `;
      item.addEventListener('click', () => copyToClipboard(hex, `Copied color ${hex} (Contrast ${bestCr}:1 ${wcagBadge})!`));
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

/* ==========================================================================
   5. Image Inspector & Aspect Ratio Calculator
   ========================================================================== */

function initImageInspector() {
  const dropzone = document.getElementById('img-inspect-dropzone');
  const fileInput = document.getElementById('img-inspect-input');
  const resultCard = document.getElementById('img-inspect-result-card');
  const previewImg = document.getElementById('img-inspect-preview');
  const statDim = document.getElementById('inspect-stat-dim');
  const statRatio = document.getElementById('inspect-stat-ratio');
  const statMp = document.getElementById('inspect-stat-mp');
  const statSize = document.getElementById('inspect-stat-size');
  const statOrient = document.getElementById('inspect-stat-orient');
  const statType = document.getElementById('inspect-stat-type');
  const calcWidth = document.getElementById('inspect-calc-width');
  const calcHeight = document.getElementById('inspect-calc-height');

  let currentRatio = 16 / 9;

  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }

  function getSimplifiedRatio(w, h) {
    const divisor = gcd(w, h);
    const rw = w / divisor;
    const rh = h / divisor;
    const decimal = w / h;
    if (Math.abs(decimal - 16/9) < 0.02) return '16:9 (Widescreen)';
    if (Math.abs(decimal - 4/3) < 0.02) return '4:3 (Standard)';
    if (Math.abs(decimal - 1) < 0.02) return '1:1 (Square)';
    if (Math.abs(decimal - 9/16) < 0.02) return '9:16 (Story / Reel)';
    if (Math.abs(decimal - 21/9) < 0.02) return '21:9 (Ultrawide)';
    if (Math.abs(decimal - 3/2) < 0.02) return '3:2 (Classic 35mm)';
    return `${rw}:${rh} (${decimal.toFixed(2)}:1)`;
  }

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please upload a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        currentRatio = w / h;

        if (previewImg) previewImg.src = e.target.result;
        if (statDim) statDim.textContent = `${w} × ${h} px`;
        if (statRatio) statRatio.textContent = getSimplifiedRatio(w, h);
        if (statMp) statMp.textContent = `${((w * h) / 1000000).toFixed(2)} MP`;
        if (statSize) statSize.textContent = formatBytes(file.size);
        if (statType) statType.textContent = file.type || 'image/png';
        if (statOrient) statOrient.textContent = w > h ? 'Landscape' : (w < h ? 'Portrait' : 'Square');

        if (calcWidth) calcWidth.value = w;
        if (calcHeight) calcHeight.value = h;

        if (resultCard) resultCard.style.display = 'block';
        showToast(`Analyzed ${file.name} (${w}×${h}px)`, 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  if (calcWidth && calcHeight) {
    calcWidth.addEventListener('input', () => {
      const w = parseFloat(calcWidth.value) || 0;
      calcHeight.value = Math.round(w / currentRatio);
    });

    calcHeight.addEventListener('input', () => {
      const h = parseFloat(calcHeight.value) || 0;
      calcWidth.value = Math.round(h * currentRatio);
    });
  }

  document.querySelectorAll('[data-ratio-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [rw, rh] = btn.getAttribute('data-ratio-preset').split(':').map(Number);
      currentRatio = rw / rh;
      const w = parseFloat(calcWidth.value) || 1920;
      calcHeight.value = Math.round(w / currentRatio);
      showToast(`Set ratio preset to ${rw}:${rh}`, 'info');
    });
  });
}

/* ==========================================================================
   6. SVG Studio & Vector Optimizer Implementation
   ========================================================================== */

function initSvgStudio() {
  const codeInput = document.getElementById('svg-code-input');
  const previewViewport = document.getElementById('svg-preview-viewport');
  const dropzone = document.getElementById('svg-upload-dropzone');
  const fileInput = document.getElementById('svg-file-input');

  const statOrigSize = document.getElementById('svg-stat-orig-size');
  const statOptSize = document.getElementById('svg-stat-opt-size');
  const statSavings = document.getElementById('svg-stat-savings');
  const statElements = document.getElementById('svg-stat-elements');

  const btnOptimize = document.getElementById('btn-run-svg-optimize');
  const btnCopySvg = document.getElementById('btn-copy-svg-code');
  const btnDownloadSvg = document.getElementById('btn-download-svg-file');
  const btnDownloadPng = document.getElementById('btn-download-svg-png');
  const btnCopyDataUri = document.getElementById('btn-copy-svg-datauri');
  const btnCopyCss = document.getElementById('btn-copy-svg-css');
  const btnApplyFill = document.getElementById('btn-apply-svg-fill');
  const recolorInput = document.getElementById('svg-color-recolor');
  const scaleSelect = document.getElementById('svg-png-scale');

  const optComments = document.getElementById('svg-opt-comments');
  const optDoctype = document.getElementById('svg-opt-doctype');
  const optMetadata = document.getElementById('svg-opt-metadata');
  const optWhitespace = document.getElementById('svg-opt-whitespace');

  if (!codeInput || !previewViewport) return;

  const SAMPLE_SVGS = {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Gradient Background -->
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="24" fill="url(#g1)"/>
  <path d="M50 20 L58 38 L78 41 L63 56 L67 76 L50 66 L33 76 L37 56 L22 41 L42 38 Z" fill="#ffffff"/>
</svg>`,
    badge: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="50" fill="#10b981" stroke="#047857" stroke-width="4"/>
  <path d="M40 60 L54 74 L82 46" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
    wave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
  <path d="M0 40 Q 50 10, 100 40 T 200 40 L 200 80 L 0 80 Z" fill="#06b6d4"/>
  <path d="M0 50 Q 50 25, 100 50 T 200 50 L 200 80 L 0 80 Z" fill="#3b82f6" opacity="0.6"/>
</svg>`
  };

  let originalBytes = 0;

  function renderSvgPreview(svgString) {
    if (!svgString.trim()) {
      previewViewport.innerHTML = '<p class="text-secondary" style="font-size: 0.85rem;">SVG preview will render here...</p>';
      if (statElements) statElements.textContent = '0';
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        previewViewport.innerHTML = `<p class="badge-error" style="padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-size: 0.82rem;">Invalid SVG XML syntax: ${parserError.textContent.slice(0, 80)}...</p>`;
        return;
      }

      const svgEl = doc.querySelector('svg');
      if (!svgEl) {
        previewViewport.innerHTML = '<p class="text-secondary" style="font-size: 0.85rem;">No &lt;svg&gt; root node detected.</p>';
        return;
      }

      previewViewport.innerHTML = '';
      const importedNode = document.importNode(svgEl, true);
      previewViewport.appendChild(importedNode);

      const nodeCount = importedNode.querySelectorAll('*').length + 1;
      if (statElements) statElements.textContent = nodeCount;
    } catch (err) {
      previewViewport.innerHTML = `<p class="badge-error">${err.message}</p>`;
    }
  }

  function updateSizeStats(rawText) {
    const bytes = new Blob([rawText]).size;
    if (!originalBytes || originalBytes === 0) originalBytes = bytes;
    if (statOrigSize) statOrigSize.textContent = formatBytes(originalBytes);
    if (statOptSize) statOptSize.textContent = formatBytes(bytes);

    if (statSavings && originalBytes > 0) {
      const diff = originalBytes - bytes;
      const pct = Math.max(0, Math.round((diff / originalBytes) * 100));
      statSavings.textContent = `${pct}%`;
      statSavings.style.color = pct > 0 ? 'var(--accent-emerald)' : 'var(--text-secondary)';
    }
  }

  function optimizeSvg(svgStr) {
    let clean = svgStr;

    // 1. Comments
    if (!optComments || optComments.checked) {
      clean = clean.replace(/<!--[\s\S]*?-->/g, '');
    }

    // 2. XML Declaration & DOCTYPE
    if (!optDoctype || optDoctype.checked) {
      clean = clean.replace(/<\?xml[\s\S]*?\?>/gi, '');
      clean = clean.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
    }

    // 3. Metadata & Editor Namespaces
    if (!optMetadata || optMetadata.checked) {
      clean = clean.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
      clean = clean.replace(/<desc[\s\S]*?<\/desc>/gi, '');
      clean = clean.replace(/<title[\s\S]*?<\/title>/gi, '');
      clean = clean.replace(/\s*(xmlns:(inkscape|sodipodi|illustrator|vectornator|sketch|figma)|inkscape:[a-z0-9_-]+|sodipodi:[a-z0-9_-]+|figma:[a-z0-9_-]+)="[^"]*"/gi, '');
    }

    // 4. Whitespace minification
    if (!optWhitespace || optWhitespace.checked) {
      clean = clean.replace(/>\s+</g, '><');
      clean = clean.replace(/\s{2,}/g, ' ');
      clean = clean.trim();
    }

    return clean;
  }

  codeInput.addEventListener('input', () => {
    const raw = codeInput.value;
    originalBytes = new Blob([raw]).size;
    renderSvgPreview(raw);
    updateSizeStats(raw);
  });

  if (btnOptimize) {
    btnOptimize.addEventListener('click', () => {
      const current = codeInput.value;
      if (!current.trim()) {
        showToast('Please insert or upload SVG markup first', 'warning');
        return;
      }
      const beforeBytes = new Blob([current]).size;
      originalBytes = beforeBytes;
      const optimized = optimizeSvg(current);
      codeInput.value = optimized;
      renderSvgPreview(optimized);
      updateSizeStats(optimized);
      const afterBytes = new Blob([optimized]).size;
      const saved = beforeBytes - afterBytes;
      showToast(`Optimized SVG! Reduced by ${formatBytes(saved)} (${Math.round((saved/beforeBytes)*100)}%)`, 'success');
      playSuccessSound();
    });
  }

  // Sample buttons
  const btnSample1 = document.getElementById('btn-svg-sample-1');
  const btnSample2 = document.getElementById('btn-svg-sample-2');
  const btnSample3 = document.getElementById('btn-svg-sample-3');

  if (btnSample1) {
    btnSample1.addEventListener('click', () => {
      codeInput.value = SAMPLE_SVGS.icon;
      originalBytes = new Blob([SAMPLE_SVGS.icon]).size;
      renderSvgPreview(SAMPLE_SVGS.icon);
      updateSizeStats(SAMPLE_SVGS.icon);
      showToast('Loaded sample Vector Icon', 'info');
    });
  }
  if (btnSample2) {
    btnSample2.addEventListener('click', () => {
      codeInput.value = SAMPLE_SVGS.badge;
      originalBytes = new Blob([SAMPLE_SVGS.badge]).size;
      renderSvgPreview(SAMPLE_SVGS.badge);
      updateSizeStats(SAMPLE_SVGS.badge);
      showToast('Loaded sample Verified Badge', 'info');
    });
  }
  if (btnSample3) {
    btnSample3.addEventListener('click', () => {
      codeInput.value = SAMPLE_SVGS.wave;
      originalBytes = new Blob([SAMPLE_SVGS.wave]).size;
      renderSvgPreview(SAMPLE_SVGS.wave);
      updateSizeStats(SAMPLE_SVGS.wave);
      showToast('Loaded sample Geometric Wave', 'info');
    });
  }

  // Dropzone
  if (dropzone && fileInput) {
    setupDropzone(dropzone, fileInput, (files) => {
      const file = files[0];
      if (!file) return;
      if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
        showToast('Please upload a valid .svg vector file', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        codeInput.value = e.target.result;
        originalBytes = file.size;
        renderSvgPreview(e.target.result);
        updateSizeStats(e.target.result);
        showToast(`Loaded ${file.name} (${formatBytes(file.size)})`, 'success');
      };
      reader.readAsText(file);
    });
  }

  // Recolor Fill
  if (btnApplyFill && recolorInput) {
    btnApplyFill.addEventListener('click', () => {
      const color = recolorInput.value;
      const current = codeInput.value;
      if (!current.trim()) return;
      const updated = current.replace(/fill="[^"]*"/gi, `fill="${color}"`);
      codeInput.value = updated;
      renderSvgPreview(updated);
      updateSizeStats(updated);
      showToast(`Applied fill color ${color}`, 'success');
    });
  }

  // Copy SVG Code
  if (btnCopySvg) {
    btnCopySvg.addEventListener('click', () => {
      if (!codeInput.value.trim()) return;
      copyToClipboard(codeInput.value, 'SVG code copied to clipboard!');
    });
  }

  // Copy Data URI
  if (btnCopyDataUri) {
    btnCopyDataUri.addEventListener('click', () => {
      if (!codeInput.value.trim()) return;
      const b64 = btoa(unescape(encodeURIComponent(codeInput.value)));
      const dataUri = `data:image/svg+xml;base64,${b64}`;
      copyToClipboard(dataUri, 'SVG Base64 Data URI copied!');
    });
  }

  // Copy CSS Background
  if (btnCopyCss) {
    btnCopyCss.addEventListener('click', () => {
      if (!codeInput.value.trim()) return;
      const b64 = btoa(unescape(encodeURIComponent(codeInput.value)));
      const css = `background-image: url('data:image/svg+xml;base64,${b64}');\nbackground-repeat: no-repeat;\nbackground-size: contain;`;
      copyToClipboard(css, 'CSS background-image snippet copied!');
    });
  }

  // Download SVG
  if (btnDownloadSvg) {
    btnDownloadSvg.addEventListener('click', () => {
      if (!codeInput.value.trim()) return;
      const blob = new Blob([codeInput.value], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(blob, 'omnidoc-vector.svg');
      showToast('Downloaded optimized SVG file', 'success');
      playSuccessSound();
    });
  }

  // Export as Raster PNG
  if (btnDownloadPng) {
    btnDownloadPng.addEventListener('click', () => {
      const svgMarkup = codeInput.value;
      if (!svgMarkup.trim()) return;

      const scale = parseInt(scaleSelect ? scaleSelect.value : '2', 10) || 2;
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const w = (img.naturalWidth || 300) * scale;
        const h = (img.naturalHeight || 300) * scale;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);

        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            saveAs(pngBlob, `omnidoc-vector-${scale}x.png`);
            showToast(`Exported ${scale}x High-Resolution PNG (${w}×${h}px)!`, 'success');
            playSuccessSound();
          }
        }, 'image/png');
      };
      img.src = url;
    });
  }

  // Load initial sample
  codeInput.value = SAMPLE_SVGS.icon;
  originalBytes = new Blob([SAMPLE_SVGS.icon]).size;
  renderSvgPreview(SAMPLE_SVGS.icon);
  updateSizeStats(SAMPLE_SVGS.icon);
}

// Master Image Tools Init
function initAllImageTools() {
  initImageCompressor();
  initImageConverter();
  initImageBase64();
  initPaletteAndFilters();
  initImageInspector();
  initSvgStudio();
}

window.addEventListener('DOMContentLoaded', initAllImageTools);


