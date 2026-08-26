# Contributing to OmniDoc Studio (Convertor)

Thank you for your interest in contributing to **OmniDoc Studio**! We welcome contributions, bug fixes, and feature proposals.

## 🌟 Code of Conduct

Please maintain a respectful, welcoming, and inclusive environment for everyone.

## 🛠️ Development Setup

1. **Fork and Clone the Repository:**
   ```bash
   git clone https://github.com/Arpithaapoojary/Convertor.git
   cd Convertor
   ```

2. **Run Locally:**
   OmniDoc Studio is built with modern vanilla HTML5, CSS3, and JavaScript with 100% client-side processing. You don't need any complex build tooling!
   
   Run any static local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Or using Node / npx
   npx serve .
   ```

3. **Project Architecture:**
   - `index.html`: Main layout, sidebar navigation, and tool panels.
   - `css/main.css`: Core design system, color variables, typography, and theme tokens.
   - `css/components.css`: Reusable UI components (glass cards, buttons, dropzones, modals).
   - `css/tools.css`: Specialized tool styles (diff viewer, image preview canvas, tables).
   - `js/app.js`: Application router, navigation state, and Command Palette (`Ctrl+K`).
   - `js/pdf-tools.js`: PDF-Lib and PDF.js merge, split, rotate, and extraction pipelines.
   - `js/image-tools.js`: Canvas-based compression, format conversions, Base64 codec, and palette extractor.
   - `js/text-tools.js`: Text transformations, string metrics, and LCS diff comparator.
   - `js/data-tools.js`: CSV/JSON converter, live Markdown editor, hash algorithms, and UUID generator.
   - `js/qr-tools.js`: QR code generator (URL, WiFi, vCard), SVG vector export, and image scanner.
   - `js/utils.js`: Shared helpers (file readers, clipboard, toast alerts, byte formatters).

## 🚀 Submitting Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(module): add new transformation method"
   ```
3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request on GitHub.
