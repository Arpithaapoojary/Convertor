#  OmniDoc Studio (Convertor)

> Ultra-Fast, 100% Client-Side Document, Image, Text, and Data Utility Suite.

![OmniDoc Studio](https://img.shields.io/badge/OmniDoc-Studio-6366f1?style=for-the-badge&logo=appveyor)
![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)
![Zero Backend Required](https://img.shields.io/badge/100%25-Client--Side-blue?style=for-the-badge)

OmniDoc Studio is a privacy-first web application featuring 18+ high-performance utilities for processing PDFs, optimizing images, transforming text, converting data structures, and generating QR codes directly in your browser without uploading files to any external server.

---

## 🚀 Complete Suite of 18+ Tools

### 📑 1. PDF Suite
- **Merge PDF**: Combine multiple PDF documents in custom order.
- **Split PDF**: Extract specific page ranges or split all pages into separate files.
- **Images to PDF**: Convert JPG, PNG, and WebP images into a single paginated PDF.
- **Text to PDF**: Transform raw text and formatted notes into clean PDF documents.
- **PDF to Images**: Render high-resolution PNG/JPG page previews and download individual pages or a full ZIP archive.
- **Rotate PDF**: Rotate individual pages or entire documents by 90°, 180°, or 270°.

### 🎨 2. Image Studio
- **Image Compressor**: Compress JPEG, PNG, and WebP images with live quality slider and file size reduction metrics.
- **Format Converter**: Seamlessly convert between PNG, JPEG, WebP, SVG, and other raster formats.
- **Image ↔ Base64**: Encode images to Base64 Data URIs and decode raw Base64 strings to downloadable images.
- **Palette & Filters**: Extract dominant color palettes with one-click HEX/RGB copying and apply real-time canvas filters (Brightness, Contrast, Grayscale, Sepia, Blur, Invert).

### ✍️ 3. Text & Content Studio
- **Smart Text Transformer**: 18+ case transformations (UPPERCASE, lowercase, Title Case, camelCase, PascalCase, kebab-case, snake_case, CONSTANT_CASE, dot.case, Slugify, Reverse), HTML tag stripping, and regex extractors (Emails, URLs).
- **Text Diff Viewer**: Side-by-side comparison using the Longest Common Subsequence (LCS) algorithm to highlight additions and deletions.

### 📊 4. Data & Code Studio
- **CSV ↔ JSON**: Bidirectional conversion with interactive table data preview powered by PapaParse.
- **Live Markdown Editor**: Split-screen Markdown editor with real-time rendered HTML preview and sanitized export.
- **Base64 & URL Codec**: Encode and decode Base64, URL parameters, and HTML entities.
- **Hash & UUID Generator**: Compute MD5, SHA-1, SHA-256, and SHA-512 cryptographic hashes and generate bulk RFC 4122 UUID v4 strings.

### 📱 5. QR Code Studio
- **QR Generator**: Create custom QR codes for Website URLs, WiFi Credentials, vCards, Email, and Phone numbers.
- **Vector SVG & PNG Export**: Download high-resolution PNGs, vector SVG files, or copy QR images directly to clipboard.
- **Color Presets**: One-click color themes (Classic B&W, Ocean Blue, Emerald, Cyber Violet, Crimson).
- **QR Scanner**: Decode and scan QR codes directly from image uploads.

---

## ⚡ Keyboard Shortcuts & Quick Search

- **`Ctrl + K`** / **`Cmd + K`**: Open the OmniDoc Command Palette to instantly search and navigate to any tool.
- **`Esc`**: Close the Command Palette or active modal.

---

## 🔒 100% Privacy & Security

All file processing, conversions, hashing, and rendering happen **exclusively in your local browser runtime**. No documents, images, or confidential text are ever transmitted to any backend server or cloud API.

---

## 🛠️ Tech Stack & Dependencies

- **HTML5 & CSS3** (Vanilla CSS design system with Dark / Light theme tokens, glassmorphism, responsive grid)
- **Vanilla JavaScript (ES6+)**
- **Client-side Libraries:**
  - [PDF-Lib](https://pdf-lib.js.org/) — PDF creation, merging, and page rotation
  - [PDF.js](https://mozilla.github.io/pdf.js/) — In-browser PDF canvas rendering
  - [jsPDF](https://github.com/parallax/jsPDF) — Text-to-PDF conversion
  - [JSZip](https://stuk.github.io/jszip/) — Client-side ZIP bundling
  - [PapaParse](https://www.papaparse.com/) — Fast in-browser CSV parsing
  - [Marked](https://marked.js.org/) & [DOMPurify](https://github.com/cure53/DOMPurify) — Secure Markdown parsing and sanitization
  - [QRCode.js](https://davidshimjs.github.io/qrcodejs/) & [jsQR](https://github.com/cozmo/jsQR) — QR code generation & image scanning
  - [Lucide Icons](https://lucide.dev/) — Modern iconography

---

## 📦 Getting Started

Simply open `index.html` in any modern web browser or serve locally:

```bash
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve .
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 Arpitha.
