/* ==========================================================================
   OmniDoc Studio - QR Studio Engine (Generator & Image Scanner)
   ========================================================================== */

/* ==========================================================================
   1. QR Code Generator Implementation
   ========================================================================== */

function initQrGenerator() {
  const qrTypeSelect = document.getElementById('qr-type-select');
  const qrTextInput = document.getElementById('qr-text-input');
  
  // Structured input containers
  const wifiContainer = document.getElementById('qr-wifi-fields');
  const wifiSsid = document.getElementById('qr-wifi-ssid');
  const wifiPass = document.getElementById('qr-wifi-pass');
  const wifiType = document.getElementById('qr-wifi-type');

  const wifiHidden = document.getElementById('qr-wifi-hidden');

  const vcardContainer = document.getElementById('qr-vcard-fields');
  const vcardName = document.getElementById('qr-vcard-name');
  const vcardPhone = document.getElementById('qr-vcard-phone');
  const vcardEmail = document.getElementById('qr-vcard-email');
  const vcardOrg = document.getElementById('qr-vcard-org');

  // Styling inputs
  const fgColor = document.getElementById('qr-fg-color');
  const bgColor = document.getElementById('qr-bg-color');
  const sizeSlider = document.getElementById('qr-size-slider');
  const sizeVal = document.getElementById('qr-size-val');

  const canvasHolder = document.getElementById('qr-canvas-holder');
  const downloadPngBtn = document.getElementById('btn-download-qr-png');
  const downloadSvgBtn = document.getElementById('btn-download-qr-svg');

  if (!canvasHolder) return;

  function getQrPayload() {
    const type = qrTypeSelect ? qrTypeSelect.value : 'text';
    if (type === 'wifi') {
      const ssid = wifiSsid ? wifiSsid.value : '';
      const pass = wifiPass ? wifiPass.value : '';
      const enc = wifiType ? wifiType.value : 'WPA';
      const hidden = wifiHidden && wifiHidden.checked ? 'H:true;' : '';
      return `WIFI:T:${enc};S:${ssid};P:${pass};${hidden};`;
    } else if (type === 'vcard') {
      const name = vcardName ? vcardName.value : '';
      const phone = vcardPhone ? vcardPhone.value : '';
      const email = vcardEmail ? vcardEmail.value : '';
      const org = vcardOrg ? vcardOrg.value : '';
      return `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nORG:${org}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
    } else if (type === 'email') {
      const val = qrTextInput ? qrTextInput.value : '';
      return val.startsWith('mailto:') ? val : `mailto:${val}`;
    } else if (type === 'tel') {
      const val = qrTextInput ? qrTextInput.value : '';
      return val.startsWith('tel:') ? val : `tel:${val}`;
    }
    return qrTextInput ? qrTextInput.value : 'https://omnicraft.dev';
  }

  function renderQrCode() {
    const payload = getQrPayload();
    if (!payload.trim()) return;

    canvasHolder.innerHTML = '';
    const size = parseInt(sizeSlider ? sizeSlider.value : '220', 10) || 220;
    const colorDark = fgColor ? fgColor.value : '#000000';
    const colorLight = bgColor ? bgColor.value : '#ffffff';

    if (window.QRCode) {
      new QRCode(canvasHolder, {
        text: payload,
        width: size,
        height: size,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  if (qrTypeSelect) {
    qrTypeSelect.addEventListener('change', () => {
      const type = qrTypeSelect.value;
      if (wifiContainer) wifiContainer.style.display = type === 'wifi' ? 'block' : 'none';
      if (vcardContainer) vcardContainer.style.display = type === 'vcard' ? 'block' : 'none';
      if (qrTextInput) {
        qrTextInput.parentElement.style.display = (type === 'wifi' || type === 'vcard') ? 'none' : 'flex';
        if (type === 'url') qrTextInput.placeholder = 'https://example.com';
        else if (type === 'email') qrTextInput.placeholder = 'name@company.com';
        else if (type === 'tel') qrTextInput.placeholder = '+1 234 567 8900';
        else qrTextInput.placeholder = 'Enter any text here...';
      }
      renderQrCode();
    });
  }

  [qrTextInput, wifiSsid, wifiPass, wifiType, wifiHidden, vcardName, vcardPhone, vcardEmail, vcardOrg].forEach(el => {
    if (el) el.addEventListener('input', renderQrCode);
    if (el && el.type === 'checkbox') el.addEventListener('change', renderQrCode);
  });

  if (fgColor) fgColor.addEventListener('input', renderQrCode);
  if (bgColor) bgColor.addEventListener('input', renderQrCode);
  if (sizeSlider) {
    sizeSlider.addEventListener('input', (e) => {
      if (sizeVal) sizeVal.textContent = `${e.target.value}px`;
      renderQrCode();
    });
  }

  const copyImgBtn = document.getElementById('btn-copy-qr-img');

  // Preset buttons handler
  document.querySelectorAll('.qr-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fg = btn.getAttribute('data-fg');
      const bg = btn.getAttribute('data-bg');
      if (fg && fgColor) fgColor.value = fg;
      if (bg && bgColor) bgColor.value = bg;
      renderQrCode();
      showToast('Applied color preset!', 'info');
    });
  });

  if (downloadPngBtn) {
    downloadPngBtn.addEventListener('click', () => {
      const canvas = canvasHolder.querySelector('canvas');
      const img = canvasHolder.querySelector('img');

      if (canvas) {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'qrcode.png';
        a.click();
        showToast('Downloaded QR Code PNG!', 'success');
      } else if (img && img.src) {
        const a = document.createElement('a');
        a.href = img.src;
        a.download = 'qrcode.png';
        a.click();
        showToast('Downloaded QR Code PNG!', 'success');
      } else {
        showToast('No QR code generated', 'error');
      }
    });
  }

  if (downloadSvgBtn) {
    downloadSvgBtn.addEventListener('click', () => {
      const canvas = canvasHolder.querySelector('canvas');
      if (!canvas) {
        showToast('No QR code generated to export SVG', 'error');
        return;
      }
      const size = canvas.width;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;

      // Extract foreground modules
      let svgRects = '';
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
          // If darker than threshold, draw rect
          if (a > 128 && (r + g + b) / 3 < 128) {
            svgRects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fgColor ? fgColor.value : '#000000'}" />`;
          }
        }
      }

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${bgColor ? bgColor.value : '#ffffff'}"/>
  ${svgRects}
</svg>`;

      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.svg';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded Vector QR Code SVG!', 'success');
    });
  }

  if (copyImgBtn) {
    copyImgBtn.addEventListener('click', async () => {
      const canvas = canvasHolder.querySelector('canvas');
      if (!canvas) {
        showToast('No QR code available to copy', 'error');
        return;
      }

      try {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            showToast('Failed to copy QR image', 'error');
            return;
          }
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('QR Code image copied to clipboard!', 'success');
          } else {
            showToast('Clipboard image copy not supported in this browser', 'warning');
          }
        });
      } catch (err) {
        showToast('Could not copy image: ' + err.message, 'error');
      }
    });
  }

  // Initial render
  setTimeout(renderQrCode, 100);
}

/* ==========================================================================
   2. QR Code Scanner Implementation
   ========================================================================== */

function initQrScanner() {
  const dropzone = document.getElementById('qr-scan-dropzone');
  const fileInput = document.getElementById('qr-scan-file-input');
  const resultContainer = document.getElementById('qr-scan-result-card');
  const resultText = document.getElementById('qr-scan-result-text');
  const copyBtn = document.getElementById('btn-copy-scanned-qr');
  const openLinkBtn = document.getElementById('btn-open-scanned-qr');

  if (!dropzone || !fileInput) return;

  setupDropzone(dropzone, fileInput, async (files) => {
    const file = files.find(f => f.type.startsWith('image/'));
    if (!file) {
      showToast('Please upload a valid image file', 'error');
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (window.jsQR) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            resultText.value = code.data;
            resultContainer.style.display = 'block';
            if (openLinkBtn) {
              const isUrl = /^https?:\/\//i.test(code.data);
              openLinkBtn.style.display = isUrl ? 'inline-flex' : 'none';
            }
            showToast('QR Code decoded successfully!', 'success');
          } else {
            showToast('Could not detect a valid QR code in this image', 'error');
          }
        } else {
          showToast('QR Scanner engine not loaded', 'error');
        }
      };
      img.src = dataUrl;
    } catch (err) {
      showToast('Scan error: ' + err.message, 'error');
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!resultText.value) return;
      copyToClipboard(resultText.value, 'Copied QR payload!');
    });
  }

  if (openLinkBtn) {
    openLinkBtn.addEventListener('click', () => {
      if (resultText.value) window.open(resultText.value, '_blank');
    });
  }
}

/* ==========================================================================
   3. Code 128 Barcode Generator Implementation
   ========================================================================== */

function initBarcodeGenerator() {
  const inputEl = document.getElementById('barcode-text-input');
  const heightSlider = document.getElementById('barcode-height-slider');
  const heightVal = document.getElementById('barcode-height-val');
  const barWidthSlider = document.getElementById('barcode-scale-slider');
  const barWidthVal = document.getElementById('barcode-scale-val');
  const showTextCheck = document.getElementById('barcode-show-text');
  const colorDarkInput = document.getElementById('barcode-color-dark');
  const colorLightInput = document.getElementById('barcode-color-light');
  const canvas = document.getElementById('barcode-canvas');
  const copyBtn = document.getElementById('btn-copy-barcode-img');
  const downloadPngBtn = document.getElementById('btn-download-barcode-png');
  const downloadSvgBtn = document.getElementById('btn-download-barcode-svg');

  if (!canvas || !inputEl) return;

  const CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
    "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
    "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
    "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
    "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
  ];

  function encodeCode128B(text) {
    const startCode = 104; // Start B
    let checkSum = startCode;
    const codes = [startCode];

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i) - 32;
      const validCode = Math.max(0, Math.min(95, code));
      codes.push(validCode);
      checkSum += validCode * (i + 1);
    }

    const checkDigit = checkSum % 103;
    codes.push(checkDigit);
    codes.push(106); // Stop pattern

    let bitString = '';
    codes.forEach(c => {
      const pattern = CODE128_PATTERNS[c] || "212222";
      let isBar = true;
      for (let j = 0; j < pattern.length; j++) {
        const width = parseInt(pattern[j], 10);
        bitString += (isBar ? '1' : '0').repeat(width);
        isBar = !isBar;
      }
    });

    return bitString;
  }

  function renderBarcode() {
    const text = (inputEl.value || 'OMNIDOC-2026').trim();
    if (!text) return;

    const bitString = encodeCode128B(text);
    const barWidth = parseInt(barWidthSlider ? barWidthSlider.value : '2', 10) || 2;
    const barHeight = parseInt(heightSlider ? heightSlider.value : '80', 10) || 80;
    const showText = showTextCheck ? showTextCheck.checked : true;
    const darkColor = colorDarkInput ? colorDarkInput.value : '#000000';
    const lightColor = colorLightInput ? colorLightInput.value : '#ffffff';

    const quietZone = 20;
    const textHeight = showText ? 24 : 0;
    const totalWidth = bitString.length * barWidth + quietZone * 2;
    const totalHeight = barHeight + textHeight + quietZone * 2;

    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Bars
    ctx.fillStyle = darkColor;
    let x = quietZone;
    for (let i = 0; i < bitString.length; i++) {
      if (bitString[i] === '1') {
        ctx.fillRect(x, quietZone, barWidth, barHeight);
      }
      x += barWidth;
    }

    // Text Label
    if (showText) {
      ctx.fillStyle = darkColor;
      ctx.font = `600 ${Math.max(12, Math.round(barWidth * 6))}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, totalWidth / 2, quietZone + barHeight + (textHeight / 2) + 4);
    }
  }

  inputEl.addEventListener('input', debounce(renderBarcode, 100));

  if (heightSlider && heightVal) {
    heightSlider.addEventListener('input', (e) => {
      heightVal.textContent = `${e.target.value}px`;
      renderBarcode();
    });
  }

  if (barWidthSlider && barWidthVal) {
    barWidthSlider.addEventListener('input', (e) => {
      barWidthVal.textContent = `${e.target.value}px`;
      renderBarcode();
    });
  }

  [showTextCheck, colorDarkInput, colorLightInput].forEach(el => {
    if (el) el.addEventListener('input', renderBarcode);
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      canvas.toBlob(blob => {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            .then(() => showToast('Barcode copied to clipboard!', 'success'))
            .catch(() => showToast('Clipboard write error', 'error'));
        }
      });
    });
  }

  if (downloadPngBtn) {
    downloadPngBtn.addEventListener('click', () => {
      canvas.toBlob(blob => {
        downloadBlob(blob, `barcode_${inputEl.value || 'code128'}.png`);
        showToast('Downloaded barcode PNG!', 'success');
      });
    });
  }

  if (downloadSvgBtn) {
    downloadSvgBtn.addEventListener('click', () => {
      const text = (inputEl.value || 'OMNIDOC-2026').trim();
      const bitString = encodeCode128B(text);
      const barWidth = parseInt(barWidthSlider ? barWidthSlider.value : '2', 10) || 2;
      const barHeight = parseInt(heightSlider ? heightSlider.value : '80', 10) || 80;
      const showText = showTextCheck ? showTextCheck.checked : true;
      const darkColor = colorDarkInput ? colorDarkInput.value : '#000000';
      const lightColor = colorLightInput ? colorLightInput.value : '#ffffff';
      const quietZone = 20;
      const textHeight = showText ? 24 : 0;
      const totalWidth = bitString.length * barWidth + quietZone * 2;
      const totalHeight = barHeight + textHeight + quietZone * 2;

      let rects = '';
      let x = quietZone;
      for (let i = 0; i < bitString.length; i++) {
        if (bitString[i] === '1') {
          rects += `<rect x="${x}" y="${quietZone}" width="${barWidth}" height="${barHeight}" fill="${darkColor}" />`;
        }
        x += barWidth;
      }

      let textTag = '';
      if (showText) {
        textTag = `<text x="${totalWidth / 2}" y="${quietZone + barHeight + 16}" font-family="monospace" font-size="14" font-weight="bold" fill="${darkColor}" text-anchor="middle">${text}</text>`;
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
        <rect width="100%" height="100%" fill="${lightColor}" />
        ${rects}
        ${textTag}
      </svg>`;

      downloadTextFile(svg, `barcode_${text}.svg`, 'image/svg+xml');
      showToast('Downloaded vector SVG barcode!', 'success');
    });
  }

  renderBarcode();
}

function initAllQrTools() {
  initQrGenerator();
  initQrScanner();
  initBarcodeGenerator();
}

window.addEventListener('DOMContentLoaded', initAllQrTools);

