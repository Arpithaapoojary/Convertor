/* ==========================================================================
   OmniDoc Studio - Core Application Controller, Navigation & Search Palette
   ========================================================================== */

// Tool Registry for Navigation and Command Palette
const TOOLS_REGISTRY = [
  // PDF Suite
  { id: 'pdf-merge', title: 'Merge PDF', category: 'PDF Tools', icon: 'layers', desc: 'Combine multiple PDF documents into a single file in custom order.' },
  { id: 'pdf-split', title: 'Split PDF', category: 'PDF Tools', icon: 'split', desc: 'Extract custom page ranges or split all pages into separate files.' },
  { id: 'img-to-pdf', title: 'Images to PDF', category: 'PDF Tools', icon: 'file-image', desc: 'Convert JPG, PNG, and WebP images into a paginated PDF.' },
  { id: 'text-to-pdf', title: 'Text to PDF', category: 'PDF Tools', icon: 'file-text', desc: 'Convert formatted notes and text into clean PDF documents.' },
  { id: 'pdf-to-img', title: 'PDF to Images', category: 'PDF Tools', icon: 'image', desc: 'Render and extract high-resolution PNG or JPG pages from PDF.' },
  { id: 'pdf-rotate', title: 'Rotate PDF', category: 'PDF Tools', icon: 'rotate-cw', desc: 'Rotate individual or all pages in a PDF document.' },
  { id: 'pdf-metadata', title: 'PDF Metadata Inspector', category: 'PDF Tools', icon: 'file-search', desc: 'Inspect PDF document metadata, page dimensions, creator, and security.' },

  // Image Studio
  { id: 'img-compress', title: 'Image Compressor', category: 'Image Studio', icon: 'minimize-2', desc: 'Compress JPG, PNG, and WebP images with live quality slider.' },
  { id: 'img-convert', title: 'Image Converter', category: 'Image Studio', icon: 'refresh-cw', desc: 'Convert between PNG, JPG, WebP, and other raster formats.' },
  { id: 'img-b64', title: 'Image to Base64', category: 'Image Studio', icon: 'binary', desc: 'Encode images to Base64 Data URI strings or decode Base64 to image.' },
  { id: 'img-palette', title: 'Palette & Filters', category: 'Image Studio', icon: 'palette', desc: 'Extract dominant color palettes and apply visual image filters.' },
  { id: 'img-inspect', title: 'Image Inspector & Ratio', category: 'Image Studio', icon: 'maximize', desc: 'Inspect dimensions, aspect ratios, megapixels, and calculate scaling.' },
  { id: 'img-svg', title: 'SVG Studio & Optimizer', category: 'Image Studio', icon: 'sparkles', desc: 'Minify SVG vector code, recolor, scale, and export as crisp PNG/WebP.' },

  // Text & Content
  { id: 'text-transform', title: 'Text Transformer', category: 'Text & Content', icon: 'type', desc: 'Case conversion, line cleaning, sorting, and text formatting.' },
  { id: 'text-diff', title: 'Text Compare & Diff', category: 'Text & Content', icon: 'git-compare', desc: 'Find differences between two texts side-by-side.' },
  { id: 'text-password', title: 'Password Generator', category: 'Text & Content', icon: 'lock', desc: 'Generate secure random passwords and passphrases with entropy score.' },
  { id: 'text-regex', title: 'Regex Tester & Matcher', category: 'Text & Content', icon: 'code-2', desc: 'Interactive regular expression playground with live match highlights and capture groups.' },

  // Data & Code
  { id: 'data-csv-json', title: 'CSV ↔ JSON', category: 'Data & Format', icon: 'table', desc: 'Convert CSV to JSON and JSON to CSV with live table preview.' },
  { id: 'data-color', title: 'Color Studio & Converter', category: 'Data & Format', icon: 'palette', desc: 'HEX, RGB, HSL, CMYK converter, harmony generator & color shades.' },
  { id: 'data-json-beautifier', title: 'JSON Studio', category: 'Data & Format', icon: 'braces', desc: 'Format, minify, repair syntax, and validate JSON data structures.' },
  { id: 'data-jwt', title: 'JWT Inspector', category: 'Data & Format', icon: 'key-round', desc: 'Decode, inspect, and validate JSON Web Tokens with timestamp checks.' },
  { id: 'data-markdown', title: 'Markdown Live Editor', category: 'Data & Format', icon: 'file-code', desc: 'Real-time Markdown editor with rendered HTML preview.' },
  { id: 'data-encode', title: 'Base64 & URL Encoder', category: 'Data & Format', icon: 'shield', desc: 'Encode and decode Base64, URL components, and HTML entities.' },
  { id: 'data-hash-uuid', title: 'Hash & UUID Generator', category: 'Data & Format', icon: 'hash', desc: 'Generate MD5, SHA-256 hashes and bulk UUID v4 strings.' },
  { id: 'data-timestamp', title: 'Timestamp & Epoch Studio', category: 'Data & Format', icon: 'clock', desc: 'Unix timestamp converter, world timezone clock matrix, and date duration calculator.' },

  // QR & Barcode Studio
  { id: 'qr-generator', title: 'QR Code Generator', category: 'QR & Barcode', icon: 'qr-code', desc: 'Create custom QR codes for URLs, WiFi, contacts, and text.' },
  { id: 'qr-scanner', title: 'QR Code Scanner', category: 'QR & Barcode', icon: 'scan', desc: 'Scan and decode QR codes directly from uploaded images.' },
  { id: 'barcode-generator', title: 'Barcode 128 Studio', category: 'QR & Barcode', icon: 'barcode', desc: 'Generate Code 128 barcodes with custom dimensions and SVG export.' }
];

const ACCENT_THEMES = {
  indigo: { primary: '#6366f1', hover: '#4f46e5', active: '#4338ca', rgb: '99, 102, 241' },
  cyan: { primary: '#06b6d4', hover: '#0891b2', active: '#0e7490', rgb: '6, 182, 212' },
  emerald: { primary: '#10b981', hover: '#059669', active: '#047857', rgb: '16, 185, 129' },
  violet: { primary: '#8b5cf6', hover: '#7c3aed', active: '#6d28d9', rgb: '139, 92, 246' },
  rose: { primary: '#f43f5e', hover: '#e11d48', active: '#be123c', rgb: '244, 63, 94' },
  amber: { primary: '#f59e0b', hover: '#d97706', active: '#b45309', rgb: '245, 158, 11' }
};

class OmniDocApp {
  constructor() {
    this.activeToolId = 'pdf-merge';
    this.theme = localStorage.getItem('omnidoc_theme') || 'dark';
    this.accent = localStorage.getItem('omnidoc_accent') || 'indigo';
    this.recentTools = JSON.parse(localStorage.getItem('omnidoc_recent_tools') || '[]');
    this.paletteSelectedIndex = 0;
    this.filteredPaletteTools = [...TOOLS_REGISTRY];
  }

  init() {
    this.applyTheme(this.theme);
    this.applyAccent(this.accent);
    this.bindNavigation();
    this.bindHeaderActions();
    this.bindCommandPalette();
    this.handleInitialRoute();

    // Re-render Lucide icons
    if (window.lucide) lucide.createIcons();
  }

  // Accent Color Theme
  applyAccent(accentName) {
    const config = ACCENT_THEMES[accentName] || ACCENT_THEMES.indigo;
    this.accent = accentName;
    const root = document.documentElement;
    root.style.setProperty('--primary', config.primary);
    root.style.setProperty('--primary-hover', config.hover);
    root.style.setProperty('--primary-active', config.active);
    root.style.setProperty('--primary-light', `rgba(${config.rgb}, 0.12)`);
    root.style.setProperty('--primary-glow', `rgba(${config.rgb}, 0.35)`);
    root.style.setProperty('--border-focus', config.primary);
    root.style.setProperty('--border-glow', `rgba(${config.rgb}, 0.45)`);
    localStorage.setItem('omnidoc_accent', accentName);

    document.querySelectorAll('.accent-dot-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-accent') === accentName);
    });
  }

  // Theme Handling
  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omnidoc_theme', theme);

    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' 
        ? `<i data-lucide="sun" style="width: 18px; height: 18px;"></i>` 
        : `<i data-lucide="moon" style="width: 18px; height: 18px;"></i>`;
      if (window.lucide) lucide.createIcons();
    }
  }

  toggleTheme() {
    this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  recordRecentTool(toolId) {
    this.recentTools = [toolId, ...this.recentTools.filter(id => id !== toolId)].slice(0, 5);
    localStorage.setItem('omnidoc_recent_tools', JSON.stringify(this.recentTools));
    localStorage.setItem('omnidoc_last_tool', toolId);
  }

  // Route & Tab Navigation
  navigateTo(toolId) {
    const tool = TOOLS_REGISTRY.find(t => t.id === toolId);
    if (!tool) return;

    this.activeToolId = toolId;
    window.location.hash = toolId;
    this.recordRecentTool(toolId);

    // Update active nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-tool-target') === toolId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update panels
    document.querySelectorAll('.tool-panel').forEach(panel => {
      if (panel.id === `panel-${toolId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Update breadcrumb
    const breadcrumbRoot = document.getElementById('header-breadcrumb-root');
    const breadcrumbCurrent = document.getElementById('header-breadcrumb-current');
    if (breadcrumbRoot && breadcrumbCurrent) {
      breadcrumbRoot.textContent = tool.category;
      breadcrumbCurrent.textContent = tool.title;
    }

    // Close mobile drawer if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) lucide.createIcons();
  }

  handleInitialRoute() {
    const hash = window.location.hash.replace('#', '');
    const savedLast = localStorage.getItem('omnidoc_last_tool');
    if (hash && TOOLS_REGISTRY.some(t => t.id === hash)) {
      this.navigateTo(hash);
    } else if (savedLast && TOOLS_REGISTRY.some(t => t.id === savedLast)) {
      this.navigateTo(savedLast);
    } else {
      this.navigateTo('pdf-merge');
    }
  }

  bindNavigation() {
    // Sidebar nav items click
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-tool-target');
        if (target) this.navigateTo(target);
      });
    });

    // Hash change event
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== this.activeToolId) {
        this.navigateTo(hash);
      }
    });

    // Mobile menu toggle
    const mobileBtn = document.getElementById('btn-mobile-menu');
    const sidebar = document.getElementById('app-sidebar');
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }
  }

  toggleZenMode() {
    const isZen = document.body.classList.toggle('zen-mode');
    const zenBtn = document.getElementById('btn-toggle-zen');
    if (zenBtn) {
      zenBtn.innerHTML = isZen 
        ? `<i data-lucide="minimize-2" style="width: 18px; height: 18px;"></i>` 
        : `<i data-lucide="maximize-2" style="width: 18px; height: 18px;"></i>`;
      if (window.lucide) lucide.createIcons();
    }
    showToast(isZen ? 'Entered Zen Mode (Distraction-Free)' : 'Exited Zen Mode', 'info');
  }

  bindHeaderActions() {
    const accentBtn = document.getElementById('btn-toggle-accent');
    const accentMenu = document.getElementById('accent-dropdown-menu');
    if (accentBtn && accentMenu) {
      accentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        accentMenu.classList.toggle('show');
      });

      document.querySelectorAll('.accent-dot-btn').forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const chosen = dot.getAttribute('data-accent');
          if (chosen) {
            this.applyAccent(chosen);
            showToast(`Applied ${chosen.toUpperCase()} accent theme!`, 'info');
          }
          accentMenu.classList.remove('show');
        });
      });

      document.addEventListener('click', (e) => {
        if (!accentBtn.contains(e.target) && !accentMenu.contains(e.target)) {
          accentMenu.classList.remove('show');
        }
      });
    }

    const zenBtn = document.getElementById('btn-toggle-zen');
    if (zenBtn) {
      zenBtn.addEventListener('click', () => this.toggleZenMode());
    }

    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      const isMuted = localStorage.getItem('omnidoc_sound_muted') === 'true';
      soundBtn.innerHTML = isMuted 
        ? `<i data-lucide="volume-x" style="width: 18px; height: 18px;"></i>` 
        : `<i data-lucide="volume-2" style="width: 18px; height: 18px;"></i>`;
      soundBtn.addEventListener('click', () => {
        const currentlyMuted = localStorage.getItem('omnidoc_sound_muted') === 'true';
        const nextMuted = !currentlyMuted;
        localStorage.setItem('omnidoc_sound_muted', nextMuted ? 'true' : 'false');
        soundBtn.innerHTML = nextMuted 
          ? `<i data-lucide="volume-x" style="width: 18px; height: 18px;"></i>` 
          : `<i data-lucide="volume-2" style="width: 18px; height: 18px;"></i>`;
        if (window.lucide) lucide.createIcons();
        showToast(nextMuted ? 'Audio feedback muted' : 'Audio feedback enabled', 'info');
      });
    }

    const searchTrigger = document.getElementById('btn-header-search');
    if (searchTrigger) {
      searchTrigger.addEventListener('click', () => this.openPalette());
    }

    const shortcutsBtn = document.getElementById('btn-toggle-shortcuts');
    const shortcutsOverlay = document.getElementById('shortcuts-modal-overlay');
    const closeShortcutsBtn = document.getElementById('btn-close-shortcuts');

    if (shortcutsBtn) {
      shortcutsBtn.addEventListener('click', () => this.toggleShortcutsModal());
    }
    if (closeShortcutsBtn) {
      closeShortcutsBtn.addEventListener('click', () => this.closeShortcutsModal());
    }
    if (shortcutsOverlay) {
      shortcutsOverlay.addEventListener('click', (e) => {
        if (e.target === shortcutsOverlay) this.closeShortcutsModal();
      });
    }
  }

  toggleShortcutsModal() {
    const overlay = document.getElementById('shortcuts-modal-overlay');
    if (!overlay) return;
    if (overlay.style.display === 'flex') {
      this.closeShortcutsModal();
    } else {
      this.openShortcutsModal();
    }
  }

  openShortcutsModal() {
    const overlay = document.getElementById('shortcuts-modal-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      if (window.lucide) lucide.createIcons();
    }
  }

  closeShortcutsModal() {
    const overlay = document.getElementById('shortcuts-modal-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // Command Palette (Ctrl + K) & Global Shortcuts
  bindCommandPalette() {
    const overlay = document.getElementById('command-palette-overlay');
    const input = document.getElementById('palette-input-box');
    const list = document.getElementById('palette-results-container');
    const shortcutsOverlay = document.getElementById('shortcuts-modal-overlay');

    // Global shortcut listeners
    window.addEventListener('keydown', (e) => {
      // Ctrl+K / Cmd+K -> Command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.closeShortcutsModal();
        this.togglePalette();
      } 
      // Ctrl+Shift+T -> Toggle Theme
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        this.toggleTheme();
        showToast(`Switched to ${this.theme} theme`, 'info');
      }
      // Shift+Z -> Toggle Zen Mode
      else if (e.shiftKey && e.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        this.toggleZenMode();
      }
      // Alt + 1..5 category jump
      else if (e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const categoryMap = {
          '1': 'pdf-merge',
          '2': 'img-compress',
          '3': 'text-transform',
          '4': 'data-csv-json',
          '5': 'qr-generator'
        };
        if (categoryMap[e.key]) this.navigateTo(categoryMap[e.key]);
      }
      // ? -> Show shortcut help modal
      else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        this.toggleShortcutsModal();
      }
      else if (e.key === 'Escape') {
        if (shortcutsOverlay && shortcutsOverlay.style.display === 'flex') {
          this.closeShortcutsModal();
        } else if (overlay && overlay.classList.contains('open')) {
          this.closePalette();
        } else if (document.body.classList.contains('zen-mode')) {
          this.toggleZenMode();
        }
      }
    });

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closePalette();
      });
    }

    if (input) {
      input.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        this.filteredPaletteTools = TOOLS_REGISTRY.filter(t => 
          t.title.toLowerCase().includes(q) || 
          t.category.toLowerCase().includes(q) || 
          t.desc.toLowerCase().includes(q)
        );
        this.paletteSelectedIndex = 0;
        this.renderPaletteResults();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.paletteSelectedIndex = (this.paletteSelectedIndex + 1) % this.filteredPaletteTools.length;
          this.renderPaletteResults();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.paletteSelectedIndex = (this.paletteSelectedIndex - 1 + this.filteredPaletteTools.length) % this.filteredPaletteTools.length;
          this.renderPaletteResults();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.filteredPaletteTools[this.paletteSelectedIndex]) {
            this.navigateTo(this.filteredPaletteTools[this.paletteSelectedIndex].id);
            this.closePalette();
          }
        }
      });
    }
  }

  openPalette() {
    const overlay = document.getElementById('command-palette-overlay');
    const input = document.getElementById('palette-input-box');
    if (!overlay || !input) return;

    overlay.classList.add('open');
    input.value = '';
    this.filteredPaletteTools = [...TOOLS_REGISTRY];
    this.paletteSelectedIndex = 0;
    this.renderPaletteResults();
    setTimeout(() => input.focus(), 50);
  }

  closePalette() {
    const overlay = document.getElementById('command-palette-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  togglePalette() {
    const overlay = document.getElementById('command-palette-overlay');
    if (overlay && overlay.classList.contains('open')) {
      this.closePalette();
    } else {
      this.openPalette();
    }
  }

  renderPaletteResults() {
    const list = document.getElementById('palette-results-container');
    if (!list) return;

    list.innerHTML = '';
    if (this.filteredPaletteTools.length === 0) {
      list.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No matching tools found</div>`;
      return;
    }

    this.filteredPaletteTools.forEach((tool, idx) => {
      const item = document.createElement('div');
      item.className = `palette-item ${idx === this.paletteSelectedIndex ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="palette-item-icon">
          <i data-lucide="${tool.icon}" style="width: 18px; height: 18px;"></i>
        </div>
        <div class="palette-item-text">
          <div class="palette-item-title">${tool.title}</div>
          <div class="palette-item-cat">${tool.category} — ${tool.desc}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        this.navigateTo(tool.id);
        this.closePalette();
      });

      list.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
  }
}

// Instantiate and start app
window.app = new OmniDocApp();
window.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
