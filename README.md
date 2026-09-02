# 🛠️ OmniDoc Studio (Convertor)

> Ultra-Fast, 100% Client-Side Document, Image, Text, and Data Utility Suite.

![OmniDoc Studio](https://img.shields.io/badge/OmniDoc-Studio-6366f1?style=for-the-badge&logo=appveyor)
![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)
![Zero Backend Required](https://img.shields.io/badge/100%25-Client--Side-blue?style=for-the-badge)
![Tools Count](https://img.shields.io/badge/Tools-28%2B-violet?style=for-the-badge)

OmniDoc Studio is a privacy-first, zero-telemetry web application featuring **28+ high-performance utilities** for processing PDFs, optimizing images, minifying vector SVGs, testing regular expressions, converting Unix timestamps, transforming text, generating secure passwords, converting data structures, inspecting tokens, creating barcodes, and generating QR codes directly in your browser without uploading files to any external server.

---

## 🚀 Complete Suite of 28+ Utilities

### 📑 1. PDF Suite (7 Tools)
- **Merge PDF**: Combine multiple PDF documents in custom order with HTML5 drag-and-drop reordering.
- **Split PDF**: Extract specific page ranges or split all pages into separate files with interactive thumbnail grids.
- **Images to PDF**: Convert JPG, PNG, and WebP images into a single paginated PDF with custom page orientation, margins, and manual reordering.
- **Text to PDF**: Transform raw text and formatted notes into clean, paginated PDF documents with custom typography.
- **PDF to Images**: Render high-resolution PNG/JPG page previews and download individual pages or a full ZIP archive.
- **Rotate PDF**: Rotate individual pages or entire documents with one-click presets (+90°, -90°, 180°, and Reset).
- **PDF Metadata Inspector**: Extract embedded document metadata (Title, Author, Subject, Keywords, Creator, Producer, Creation/Modification timestamps) and physical page dimensions (Points, Millimeters, standard paper formats like A4, Letter, Legal).

### 🎨 2. Image Studio (6 Tools)
- **Image Compressor**: Compress JPEG, PNG, and WebP images with live quality slider, aspect ratio lock, and quick scaling presets (100%, 75%, 50%, 25%, 512x512, 1080p).
- **Format Converter**: Seamlessly convert between PNG, JPEG, WebP, SVG, and other raster formats with bulk ZIP download.
- **Image ↔ Base64**: Encode images to Base64 Data URIs and decode raw Base64 strings to downloadable images.
- **Palette & Filters**: Extract dominant color palettes with WCAG 2.1 contrast ratio ratings (AAA/AA), one-click HEX/RGB copying, and real-time canvas filters (Brightness, Contrast, Grayscale, Sepia, Blur, Invert).
- **Image Inspector & Aspect Ratio**: Inspect natural resolution, megapixels, file size, MIME type, orientation, and calculate proportional scaled dimensions for standard aspect ratios (16:9, 4:3, 1:1, 9:16, 21:9, 3:2).
- **SVG Studio & Optimizer**: Minify XML tags, strip comments/metadata/doctypes, recolor fills and strokes, scale vector graphics, and export to crisp 1x/2x/4x PNG or WebP.

### ✍️ 3. Text & Content Studio (4 Tools)
- **Smart Text Transformer**: 28+ transformations (UPPERCASE, lowercase, Title Case, camelCase, PascalCase, kebab-case, snake_case, CONSTANT_CASE, dot.case, Slugify, Reverse, JSON Escape/Unescape, Base64 Codec, ROT13 Cipher, Binary, Hex, Reverse Words, Word Frequency Density, Lorem Ipsum generator), HTML tag stripping, and regex extractors (Emails, URLs).
- **Text Diff Viewer**: Side-by-side comparison using the Longest Common Subsequence (LCS) algorithm to highlight additions, deletions, and percentage similarity score.
- **Password & Passphrase Generator**: Cryptographically secure random passwords and multi-word passphrases with Shannon entropy calculation, character set customization, and bulk generation.
- **Regex Studio & Matcher**: Interactive regular expression tester with real-time match highlighting, capture group inspector, replacement engine with `$1`/`$2` tokens, and ready-to-run JS/Python/PHP/Go snippets.

### 📊 4. Data & Code Studio (8 Tools)
- **CSV ↔ JSON**: Bidirectional conversion with smart delimiter auto-detection (commas, semicolons, tabs, pipes) and interactive table data preview powered by PapaParse.
- **Color Studio & Converter**: Convert between HEX, RGB, HSL, and CMYK color codes, adjust alpha opacity, and generate harmonious color palettes (Complementary, Analogous, Triadic, Monochromatic shades).
- **JSON Studio**: Comprehensive JSON formatter (2 spaces, 4 spaces, Tabs), minifier, deep key sorting, schema validator with live byte size and depth calculation, and auto-repair for common JSON syntax mistakes.
- **JWT Inspector & Debugger**: Real-time JSON Web Token decoder for Header, Payload claims, and Signature with colorized string breakdown, live expiration countdown timer, and standard claims dictionary.
- **Live Markdown Editor**: Split-screen Markdown editor with real-time rendered HTML preview and sanitized export.
- **Base64 & URL Codec**: Encode and decode Base64, URL parameters, and HTML entities.
- **Hash & UUID Generator**: Compute MD5, SHA-1, SHA-256, and SHA-512 cryptographic hashes and generate bulk RFC 4122 UUID v4 strings.
- **Timestamp & Epoch Studio**: Real-time Unix timestamp ticker, human date to epoch converter, date duration & business days calculator, and live world timezone matrix.

### 📱 5. QR & Barcode Studio (3 Tools)
- **QR Generator**: Create custom QR codes for Website URLs, WiFi Credentials (with Hidden SSID support), vCards, Email, and Phone numbers.
- **QR Scanner**: Decode and scan QR codes directly from image uploads with instant clipboard copy and link opening.
- **Barcode 128 Studio**: Generate scannable standard Code 128 linear barcodes with configurable bar height, scaling, custom colors, human-readable labels, and vector SVG or PNG export.

---

## ⚡ Keyboard Shortcuts & Quick Navigation

| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + K`** / **`Cmd + K`** | Open Command Palette to search across all 28+ tools |
| **`Ctrl + Shift + T`** | Instantly toggle Dark / Light theme |
| **`Shift + Z`** | Toggle Fullscreen Zen Mode (distraction-free layout) |
| **`Alt + 1`** ... **`Alt + 5`** | Quick jump between PDF, Image, Text, Data, and QR Suites |
| **`?`** | Display keyboard shortcuts hint banner |
| **`Esc`** | Close Command Palette, active modal, or exit Zen Mode |

---

## 🎨 Theme & Appearance Customization

OmniDoc Studio offers personalized styling options:
- **Dark / Light Mode Toggle**: Obsidian glass dark aesthetic and clean light theme.
- **6 Dynamic Accent Color Themes**: Indigo (Default), Cyan Neon, Emerald Green, Cyber Violet, Rose Crimson, Sunset Amber.
- **Fullscreen Zen Mode**: Collapse sidebars and breadcrumbs for an expansive workspace.
- **Web Audio Sound Effects**: Subtle auditory feedback for successful actions with instant mute toggle.

---

## 🔒 100% Privacy & Security

All file processing, conversions, hashing, and rendering happen **exclusively in your local browser runtime**. No documents, images, credentials, or text are ever transmitted to any backend server, analytics collector, or cloud API.

---

## 🛠️ Tech Stack & Dependencies

- **HTML5 & CSS3** (Custom Vanilla CSS design system with CSS custom properties, glassmorphism, responsive flex/grid layouts)
- **Vanilla JavaScript (ES6+)** with Web Audio API sound synthesis, Canvas 2D API, and tracked Object URL lifecycle management
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
