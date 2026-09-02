# Changelog

All notable changes to the **OmniDoc Studio (Convertor)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2026-09-02

### Added
- **Batch Multi-Line Timestamp Processor**: Paste multiple Unix epoch timestamps or ISO dates to convert in bulk into formatted CSV with UTC, ISO 8601, and localized datetime strings.
- **Interactive Keyboard Shortcuts Cheatsheet Modal**: Dedicated visual cheat-sheet modal triggered by `?` key or header help button covering navigation, workspace, view controls, and palette triggers.
- **Responsive CSS Unit Converter**: Real-time bidirectional converter between `px`, `rem`, `em`, `vw`, `vh`, `pt`, and `%` with customizable root base font size.
- **Print & PDF Export Stylesheet**: Clean `@media print` rules hiding navigation bars, dropzones, and floating controls for distraction-free document printing and PDF reporting.

## [2.5.0] - 2026-09-02

### Added
- **SVG Studio & Vector Optimizer**: Interactive SVG vector editor and live rendering canvas with one-click XML minification (strip comments, DOCTYPE, editor namespaces, metadata), color recoloring, and multi-format export (optimized SVG, 1x/2x/4x high-res PNG, Base64 Data URI, CSS snippet).
- **Regex Studio & Visual Matcher**: Live regular expression testbench featuring real-time syntax error validation, interactive highlight overlay, capture group inspector table, live `$1`/`$2` replace engine, and multi-language code snippets for JavaScript, Python, PHP, and Go.
- **Timestamp & Unix Epoch Studio**: Live Unix epoch ticker clock with Pause/Resume, bidirectional converter (Epoch ↔ ISO 8601, UTC, Local, RFC 2822, Relative time), date duration & business day calculator, and live world timezone matrix (London, New York, San Francisco, Berlin, Tokyo, Mumbai, Sydney, Dubai).

### Enhanced
- Expanded total suite capacity to **28+ client-side tools**.
- Updated navigation counts, tool registry, command palette indexing (`Ctrl + K`), and responsive view layouts.

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
