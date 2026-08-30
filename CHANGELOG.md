# Changelog

All notable changes to the **OmniDoc Studio (Convertor)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-08-30

### Added
- **PDF Metadata Inspector**: Extract author, title, creation/modification dates, software producer, and exact page dimensions with paper format detection (A4, US Letter, US Legal).
- **Image Inspector & Aspect Ratio Studio**: Instant resolution readout, megapixel calculator, simplified aspect ratios, and proportional scaling calculator with presets (16:9, 4:3, 1:1, 9:16, 21:9, 3:2).
- **Barcode 128 Studio**: Scannable Code 128 linear barcode generator with adjustable bar height, scaling, custom colors, human-readable labels, and vector SVG/PNG export.
- **Color Studio & Format Converter**: Bi-directional HEX, RGB, HSL, and CMYK color code converter with alpha opacity control, color harmony palettes, and monochromatic shade generator.
- **Dynamic Accent Color Themes**: 6 accent palettes (Indigo, Cyan Neon, Emerald, Cyber Violet, Rose Crimson, Sunset Amber) with persistent `localStorage` support.
- **Password & Passphrase Generator**: Cryptographically secure random password generator and dictionary-based passphrase generator with Shannon entropy score.
- **Fullscreen Zen Mode**: Distraction-free workspace mode toggle (`Shift + Z` / `Esc`).
- **JSON Studio & Schema Validator**: Indent formatting, minification, deep key sorting, live byte size metrics, and syntax auto-repair.
- **JWT Token Inspector & Debugger**: 3-part color-coded breakdown (Header, Payload, Signature) with live expiration countdown and claims table.

### Enhanced
- Extended **Smart Text Transformer** with Binary, Hex, Word Density analysis, Reverse Words, and Lorem Ipsum generators.
- Improved sidebar navigation counts and tool routing with fuzzy Command Palette search (`Ctrl + K`).
- Memory optimization with centralized Object URL tracking and cleanup.
