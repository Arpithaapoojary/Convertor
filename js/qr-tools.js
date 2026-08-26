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
      return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
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

  [qrTextInput, wifiSsid, wifiPass, wifiType, vcardName, vcardPhone, vcardEmail, vcardOrg].forEach(el => {
    if (el) el.addEventListener('input', renderQrCode);
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

function initAllQrTools() {
  initQrGenerator();
  initQrScanner();
}

window.addEventListener('DOMContentLoaded', initAllQrTools);
