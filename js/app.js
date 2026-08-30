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

  // Image Studio
  { id: 'img-compress', title: 'Image Compressor', category: 'Image Studio', icon: 'minimize-2', desc: 'Compress JPG, PNG, and WebP images with live quality slider.' },
  { id: 'img-convert', title: 'Image Converter', category: 'Image Studio', icon: 'refresh-cw', desc: 'Convert between PNG, JPG, WebP, and other raster formats.' },
  { id: 'img-b64', title: 'Image to Base64', category: 'Image Studio', icon: 'binary', desc: 'Encode images to Base64 Data URI strings or decode Base64 to image.' },
  { id: 'img-palette', title: 'Palette & Filters', category: 'Image Studio', icon: 'palette', desc: 'Extract dominant color palettes and apply visual image filters.' },

  // Text & Content
  { id: 'text-transform', title: 'Text Transformer', category: 'Text & Content', icon: 'type', desc: 'Case conversion, line cleaning, sorting, and text formatting.' },
  { id: 'text-diff', title: 'Text Compare & Diff', category: 'Text & Content', icon: 'git-compare', desc: 'Find differences between two texts side-by-side.' },

  // Data & Code
  { id: 'data-csv-json', title: 'CSV ↔ JSON', category: 'Data & Format', icon: 'table', desc: 'Convert CSV to JSON and JSON to CSV with live table preview.' },
  { id: 'data-json-beautifier', title: 'JSON Studio', category: 'Data & Format', icon: 'braces', desc: 'Format, minify, repair syntax, and validate JSON data structures.' },
  { id: 'data-jwt', title: 'JWT Inspector', category: 'Data & Format', icon: 'key-round', desc: 'Decode, inspect, and validate JSON Web Tokens with timestamp checks.' },
  { id: 'data-markdown', title: 'Markdown Live Editor', category: 'Data & Format', icon: 'file-code', desc: 'Real-time Markdown editor with rendered HTML preview.' },
  { id: 'data-encode', title: 'Base64 & URL Encoder', category: 'Data & Format', icon: 'shield', desc: 'Encode and decode Base64, URL components, and HTML entities.' },
  { id: 'data-hash-uuid', title: 'Hash & UUID Generator', category: 'Data & Format', icon: 'hash', desc: 'Generate MD5, SHA-256 hashes and bulk UUID v4 strings.' },

  // QR Studio
  { id: 'qr-generator', title: 'QR Code Generator', category: 'QR & Barcode', icon: 'qr-code', desc: 'Create custom QR codes for URLs, WiFi, contacts, and text.' },
  { id: 'qr-scanner', title: 'QR Code Scanner', category: 'QR & Barcode', icon: 'scan', desc: 'Scan and decode QR codes directly from uploaded images.' }
];

class OmniDocApp {
  constructor() {
    this.activeToolId = 'pdf-merge';
    this.theme = localStorage.getItem('omnidoc_theme') || 'dark';
    this.recentTools = JSON.parse(localStorage.getItem('omnidoc_recent_tools') || '[]');
    this.paletteSelectedIndex = 0;
    this.filteredPaletteTools = [...TOOLS_REGISTRY];
  }

  init() {
    this.applyTheme(this.theme);
    this.bindNavigation();
    this.bindHeaderActions();
    this.bindCommandPalette();
    this.handleInitialRoute();

    // Re-render Lucide icons
    if (window.lucide) lucide.createIcons();
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

  bindHeaderActions() {
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
  }

  // Command Palette (Ctrl + K) & Global Shortcuts
  bindCommandPalette() {
    const overlay = document.getElementById('command-palette-overlay');
    const input = document.getElementById('palette-input-box');
    const list = document.getElementById('palette-results-container');

    // Global shortcut listeners
    window.addEventListener('keydown', (e) => {
      // Ctrl+K / Cmd+K -> Command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.togglePalette();
      } 
      // Ctrl+Shift+T -> Toggle Theme
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        this.toggleTheme();
        showToast(`Switched to ${this.theme} theme`, 'info');
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
      // ? -> Show shortcut help
      else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        showToast('Shortcuts: Ctrl+K (Search), Ctrl+Shift+T (Theme), Alt+1-5 (Suites)', 'info', 4000);
      }
      else if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
        this.closePalette();
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
