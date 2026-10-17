import { WORD_BANK, TR_WORD_BANK } from "./data/words.js";
import { SeededRandom } from "./utils/seeded-random.js";
import { CrosswordGenerator } from "./core/generator.js";
import { CengelGenerator } from "./core/cengel-generator.js";
import { PdfExporter } from "./utils/pdf-exporter.js";
import { TRANSLATIONS } from "./utils/i18n.js";

export class CrosswordApp {
  constructor() {
    this.puzzleType = 'cengel'; // 'cengel' | 'classic'
    this.cengelLayout = 'single'; // 'single' | 'dual'
    this.currentDifficulty = 'medium';
    this.currentPuzzle = null;
    this.currentCengelPuzzles = [];
    this.isSolutionVisible = false;
    this.isHintsActive = false;
    this.focusedCell = null; // { mode: 'cengel'|'classic', pIdx: 0, r: 0, c: 0, dir: 'across'|'down' }
    this.targetCounts = { easy: 14, medium: 21, hard: 30 };
    this.categories = [
      'top1000', 'animals', 'science', 'geography', 'food', 'technology',
      'body', 'general', 'sports', 'household', 'weather', 'vehicles',
      'culture', 'emotions', 'cinema', 'history', 'space', 'business', 'idioms'
    ];
    this.categoryMeta = {
      top1000: { icon: '⭐', en: 'Top 1000', tr: 'En Sık 1000' },
      animals: { icon: '🐾', en: 'Animals', tr: 'Hayvanlar' },
      science: { icon: '🔬', en: 'Science', tr: 'Bilim' },
      geography: { icon: '🌍', en: 'Geography', tr: 'Coğrafya' },
      food: { icon: '🍕', en: 'Food', tr: 'Yiyecekler' },
      technology: { icon: '💻', en: 'Tech', tr: 'Teknoloji' },
      body: { icon: '🧑‍⚕️', en: 'Body/Jobs', tr: 'Vücut/Meslek' },
      general: { icon: '✨', en: 'General', tr: 'Genel' },
      sports: { icon: '⚽', en: 'Sports', tr: 'Spor' },
      household: { icon: '🏠', en: 'Home', tr: 'Ev/Eşya' },
      weather: { icon: '🌤️', en: 'Weather', tr: 'Hava' },
      vehicles: { icon: '🚀', en: 'Vehicles', tr: 'Taşıtlar' },
      culture: { icon: '🏛️', en: 'Culture', tr: 'Kültür' },
      emotions: { icon: '❤️', en: 'Emotions', tr: 'Duygular' },
      cinema: { icon: '🎬', en: 'Cinema/Art', tr: 'Sinema/Sanat' },
      history: { icon: '🏺', en: 'History', tr: 'Tarih' },
      space: { icon: '🌌', en: 'Space', tr: 'Uzay' },
      business: { icon: '💼', en: 'Business', tr: 'İş/Ekonomi' },
      idioms: { icon: '💬', en: 'Idioms', tr: 'Deyimler' }
    };
    this.selectedCategories = new Set(this.categories);
    
    this.uiLang = 'tr';
    try {
      this.uiLang = localStorage.getItem('uiLang') || (navigator.language.startsWith('tr') ? 'tr' : 'en');
    } catch(e){}

    // Default answer language is English ('en') so English practice remains primary
    this.answerLang = 'en';
    try {
      this.answerLang = localStorage.getItem('answerLang') || 'en';
    } catch(e){}

    this.clueLang = 'mixed';
    try { this.clueLang = localStorage.getItem('clueLang') || 'mixed'; } catch(e){}

    this.initDOMElements();
    this.bindEvents();
    this.applyTheme();
    this.applyUiLanguage();
    
    // YEN-3: URL Hash parsing
    this.checkHash();
  }

  initDOMElements() {
    // Mode & Layout Controls
    this.typeButtons = document.querySelectorAll('.type-btn');
    this.cengelLayoutButtons = document.querySelectorAll('.cengel-layout-btn');
    this.cengelLayoutSection = document.getElementById('cengel-layout-section');

    this.diffButtons = document.querySelectorAll('.diff-btn');
    this.ansLangButtons = document.querySelectorAll('.ans-lang-btn');
    this.langButtons = document.querySelectorAll('.lang-btn');
    this.btnUiLang = document.getElementById('btn-ui-lang');
    this.btnGenerate = document.getElementById('btn-generate');
    this.btnToggleSolution = document.getElementById('btn-toggle-solution');
    this.btnHint = document.getElementById('btn-hint');
    this.btnCheck = document.getElementById('btn-check');
    this.btnPrint = document.getElementById('btn-print');
    
    this.puzzleSheet = document.getElementById('puzzle-sheet');
    this.solutionSheet = document.getElementById('solution-sheet');

    // Views
    this.cengelView = document.getElementById('cengel-view');
    this.classicView = document.getElementById('classic-view');
    this.solutionCengelView = document.getElementById('solution-cengel-view');
    this.solutionClassicView = document.getElementById('solution-classic-view');

    // Classic Crossword Elements
    this.crosswordGrid = document.getElementById('crossword-grid');
    this.solutionGrid = document.getElementById('solution-grid');
    this.acrossCluesList = document.getElementById('across-clues');
    this.downCluesList = document.getElementById('down-clues');
    this.solutionWordsSummary = document.getElementById('solution-words-summary');
    
    this.puzzleIdDisplay = document.getElementById('puzzle-id');
    this.solutionPuzzleIdDisplay = document.getElementById('solution-puzzle-id');
    this.puzzleDiffDisplay = document.getElementById('puzzle-diff-label');
    this.solutionDiffDisplay = document.getElementById('solution-diff-label');
    this.puzzleDateDisplay = document.getElementById('puzzle-date');
    this.pageCountDisplays = document.querySelectorAll('.page-count-display');
    
    this.btnBatchPrint = document.getElementById('btn-batch-print');
    this.batchDropdown = document.getElementById('batch-dropdown');
    this.btnShare = document.getElementById('btn-share');
    this.btnPdf = document.getElementById('btn-pdf');
    this.btnTheme = document.getElementById('btn-theme');
    this.catContainer = document.getElementById('cat-container');
    this.catCountBadge = document.getElementById('cat-count-badge');
    this.typeLayoutGrid = document.getElementById('type-layout-grid');
    
    // Stats
    this.statsWords = document.getElementById('stats-words');
    this.statsGrid = document.getElementById('stats-grid');
    this.statsDensity = document.getElementById('stats-density');
    this.statsIntersections = document.getElementById('stats-intersections');

    // Quick Category Selection Controls
    const quickControls = document.createElement('div');
    quickControls.className = 'cat-quick-actions';
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    quickControls.innerHTML = `
      <button type="button" class="cat-quick-btn" id="btn-cat-all" title="Select all categories">${t.catAll}</button>
      <button type="button" class="cat-quick-btn" id="btn-cat-top1000" title="Select only Top 1000 most frequent words">${t.catTop1000}</button>
      <button type="button" class="cat-quick-btn" id="btn-cat-clear" title="Keep minimum 1 category">${t.catClear}</button>
    `;
    this.catContainer.appendChild(quickControls);

    quickControls.querySelector('#btn-cat-all').addEventListener('click', () => {
      this.selectedCategories = new Set(this.categories);
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.add('selected'));
      this.updateCategoryCountBadge();
      this.resetSolutionKey();
      this.generateNewPuzzle();
    });

    quickControls.querySelector('#btn-cat-top1000').addEventListener('click', () => {
      this.selectedCategories = new Set(['top1000']);
      document.querySelectorAll('.cat-chip').forEach(c => {
        c.classList.toggle('selected', c.dataset.cat === 'top1000');
      });
      this.updateCategoryCountBadge();
      const tr = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
      this.showToast(tr.toastTop1000Selected);
      this.resetSolutionKey();
      this.generateNewPuzzle();
    });

    quickControls.querySelector('#btn-cat-clear').addEventListener('click', () => {
      this.selectedCategories = new Set(['top1000']);
      document.querySelectorAll('.cat-chip').forEach(c => {
        if (this.selectedCategories.has(c.dataset.cat)) {
          c.classList.add('selected');
        } else {
          c.classList.remove('selected');
        }
      });
      this.updateCategoryCountBadge();
      const tr = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
      this.showToast(tr.toastMinCategories);
      this.resetSolutionKey();
      this.generateNewPuzzle();
    });

    // Create Category Chips with icons
    this.categories.forEach(cat => {
      const info = this.categoryMeta[cat] || { icon: '🏷️', tr: cat, en: cat };
      const label = info[this.uiLang] || cat;
      const chip = document.createElement('div');
      chip.className = 'cat-chip selected';
      chip.innerHTML = `<span class="chip-icon">${info.icon}</span> <span>${label}</span>`;
      chip.dataset.cat = cat;
      chip.addEventListener('click', () => this.toggleCategory(chip, cat));
      this.catContainer.appendChild(chip);
    });
    this.updateCategoryCountBadge();
  }

  updateCategoryCountBadge() {
    if (this.catCountBadge) {
      this.catCountBadge.textContent = `${this.selectedCategories.size} / ${this.categories.length}`;
    }
  }

  bindEvents() {
    // Puzzle Type Selector (Çengel vs Classic)
    this.typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.puzzleType = btn.dataset.type;
        if (this.cengelLayoutSection) {
          this.cengelLayoutSection.style.display = this.puzzleType === 'cengel' ? 'flex' : 'none';
        }
        if (this.typeLayoutGrid) {
          this.typeLayoutGrid.classList.toggle('single-col', this.puzzleType !== 'cengel');
        }
        this.resetSolutionKey();
        this.generateNewPuzzle();
      });
    });

    // Çengel Layout Selector (Dual vs Single)
    this.cengelLayoutButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.cengelLayoutButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cengelLayout = btn.dataset.layout;
        this.resetSolutionKey();
        this.generateNewPuzzle();
      });
    });

    this.diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentDifficulty = btn.dataset.diff;
        // EKS-3 Reset answer key on diff change
        this.resetSolutionKey();
        this.generateNewPuzzle();
      });
    });

    // Answer Language Selector (EN default | TR optional)
    this.ansLangButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.ansLangButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.answerLang = btn.dataset.ansLang;
        try { localStorage.setItem('answerLang', this.answerLang); } catch(e){}
        // If user switches to Turkish answers, default clues to Turkish if currently EN
        if (this.answerLang === 'tr' && this.clueLang === 'en') {
          this.clueLang = 'tr';
          try { localStorage.setItem('clueLang', 'tr'); } catch(e){}
          this.langButtons.forEach(b => b.classList.toggle('active', b.dataset.lang === 'tr'));
        }
        this.resetSolutionKey();
        this.generateNewPuzzle();
      });
    });

    this.langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.langButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.clueLang = btn.dataset.lang;
        try { localStorage.setItem('clueLang', this.clueLang); } catch(e){}
        this.updatePuzzleLanguage();
      });
    });

    this.btnGenerate.addEventListener('click', () => {
      this.resetSolutionKey();
      this.generateNewPuzzle();
    });

    this.btnToggleSolution.addEventListener('click', () => {
      this.toggleSolution();
    });

    if (this.btnUiLang) {
      this.btnUiLang.addEventListener('click', () => {
        this.uiLang = this.uiLang === 'tr' ? 'en' : 'tr';
        try { localStorage.setItem('uiLang', this.uiLang); } catch(e){}
        this.applyUiLanguage();
        this.showToast(this.uiLang === 'tr' ? '🌐 Arayüz dili: Türkçe' : '🌐 UI Language: English');
      });
    }

    if (this.btnHint) {
      this.btnHint.addEventListener('click', () => {
        this.toggleHints();
      });
    }

    if (this.btnCheck) {
      this.btnCheck.addEventListener('click', () => {
        this.checkAnswers();
      });
    }

    // Interactive Keyboard Play Listener (YEN-1)
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    this.btnPrint.addEventListener('click', () => {
      window.print();
    });

    // Batch Print
    this.btnBatchPrint.addEventListener('click', (e) => {
      e.stopPropagation();
      this.batchDropdown.parentElement.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      this.batchDropdown.parentElement.classList.remove('show');
    });
    this.batchDropdown.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const count = parseInt(btn.dataset.count);
        this.batchPrint(count);
      });
    });

    // Theme Toggle
    this.btnTheme.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        this.btnTheme.textContent = '🌙';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        this.btnTheme.textContent = '☀️';
      }
    });

    // Share
    this.btnShare.addEventListener('click', () => {
      if (!this.currentSeed) return;
      const cats = Array.from(this.selectedCategories).join(',');
      const url = new URL(window.location.href);
      url.hash = `#seed=${this.currentSeed}&type=${this.puzzleType}&layout=${this.cengelLayout}&diff=${this.currentDifficulty}&ans=${this.answerLang}&lang=${this.clueLang}&cats=${cats}`;
      const shareUrl = url.href;

      const copyFallback = (text) => {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          textArea.style.top = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            this.showToast(this.uiLang === 'tr' ? '🔗 Bulmaca linki kopyalandı!' : '🔗 Puzzle link copied!');
          } else {
            prompt('Copy this puzzle link:', text);
          }
        } catch (err) {
          prompt('Copy this puzzle link:', text);
        }
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            this.showToast(this.uiLang === 'tr' ? '🔗 Bulmaca linki kopyalandı!' : '🔗 Puzzle link copied!');
          })
          .catch(() => {
            copyFallback(shareUrl);
          });
      } else {
        copyFallback(shareUrl);
      }
    });

    // PDF (if present)
    if (this.btnPdf) {
      this.btnPdf.addEventListener('click', () => {
        this.exportPdf();
      });
    }
  }

  applyTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.btnTheme.textContent = '☀️';
    }
    // Sync answer & clue language buttons
    if (this.ansLangButtons) {
      this.ansLangButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.ansLang === this.answerLang);
      });
    }
    this.langButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.lang === this.clueLang);
    });
  }

  applyUiLanguage() {
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    if (this.btnUiLang) this.btnUiLang.textContent = this.uiLang === 'tr' ? '🌐 TR' : '🌐 EN';

    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    const setHTML = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };

    setText('brand-name', t.brandName);
    setText('brand-sub', t.brandSub);
    setText('heading-export', t.headingExport);
    setText('btn-print', t.btnPrint);
    setText('btn-pdf', t.btnPdf);
    setText('btn-batch-print', t.btnBatchPrint);
    setText('heading-type', t.headingType);
    setText('type-btn-cengel', t.typeCengel);
    setText('type-btn-classic', t.typeClassic);
    setText('heading-layout', t.headingLayout);
    setText('layout-btn-single', t.layoutSingle);
    setText('layout-btn-dual', t.layoutDual);
    setText('heading-diff', t.headingDiff);
    setText('diff-btn-easy', t.diffEasy);
    setText('diff-btn-medium', t.diffMedium);
    setText('diff-btn-hard', t.diffHard);
    setText('heading-answer-lang', t.headingAnswerLang);
    setText('ans-lang-btn-en', t.ansLangEn);
    setText('ans-lang-btn-tr', t.ansLangTr);
    setText('heading-clue-lang', t.headingClueLang);
    setText('heading-categories', t.headingCategories);
    setText('btn-cat-all', t.catAll);
    setText('btn-cat-top1000', t.catTop1000);
    setText('btn-cat-clear', t.catClear);
    setHTML('screen-tip', t.screenTip);

    setText('label-student-name', t.labelName);
    setText('label-student-score', t.labelScore);
    setText('meta-puzzle-id-label', t.labelPuzzleId);
    setText('meta-puzzle-diff-label', t.labelDiff);
    setText('meta-puzzle-date-label', t.labelDate);

    setText('btn-generate', t.btnNewPuzzle);
    if (this.btnHint) {
      this.btnHint.innerHTML = this.isHintsActive ? t.btnHintHide : t.btnHint;
    }
    if (this.btnCheck) this.btnCheck.innerHTML = t.btnCheck;
    if (this.btnToggleSolution) {
      this.btnToggleSolution.innerHTML = this.isSolutionVisible ? t.btnHideSolution : t.btnShowSolution;
    }

    setText('solution-sheet-title', this.uiLang === 'tr' ? 'Cevap Anahtarı' : 'Answer Key');
    setText('solution-sheet-subtitle', this.uiLang === 'tr' ? 'Öğretmenler & Otomatik Kontrol İçin Çözümler' : 'Solutions for Teachers & Self-Checking');

    // Update categories chips
    document.querySelectorAll('.cat-chip').forEach(chip => {
      const cat = chip.dataset.cat;
      const info = this.categoryMeta[cat];
      if (info) {
        const textSpan = chip.querySelector('span:not(.chip-icon)');
        if (textSpan) textSpan.textContent = info[this.uiLang] || info.en || cat;
      }
    });

    // Update sheet titles
    const titleEl = document.getElementById('sheet-title');
    const subtitleEl = document.getElementById('sheet-subtitle');
    if (titleEl && !titleEl.dataset.custom) {
      titleEl.textContent = this.puzzleType === 'cengel' ? t.sheetTitleCengel : t.sheetTitleClassic;
    }
    if (subtitleEl && !subtitleEl.dataset.custom) {
      subtitleEl.textContent = this.puzzleType === 'cengel' ? t.sheetSubtitleCengel : t.sheetSubtitleClassic;
    }

    // Update secret keyword label on active cengel views
    document.querySelectorAll('.secret-bar-label').forEach(el => {
      el.textContent = t.secretKeywordLabel;
    });

    // Re-render stats if puzzles exist
    if (this.puzzleType === 'cengel' && this.currentCengelPuzzles.length > 0) {
      const totalWords = this.currentCengelPuzzles.reduce((sum, p) => sum + p.words.length, 0);
      const totalIntersections = this.currentCengelPuzzles.reduce((sum, p) => sum + p.intersections, 0);
      const avgDensity = Math.round(
        this.currentCengelPuzzles.reduce((sum, p) => sum + (p.density || 0), 0) / this.currentCengelPuzzles.length
      );
      const p0 = this.currentCengelPuzzles[0];
      const isDual = this.currentCengelPuzzles.length > 1;

      this.statsWords.textContent = `${t.statsWords} ${totalWords} ${t.statsPlaced}`;
      this.statsGrid.textContent = isDual ? `${t.statsGrid} 2x (${p0.rows}x${p0.cols})` : `${t.statsGrid} ${p0.rows}x${p0.cols}`;
      this.statsDensity.textContent = `${t.statsDensity} ${avgDensity}% (${t.activeArea})`;
      this.statsIntersections.textContent = `${t.statsIntersections} ${totalIntersections}`;
    }
  }

  updatePuzzleLanguage() {
    // BUG-4 Fix: Update clues in-place without regenerating or resetting user progress
    if (this.puzzleType === 'cengel') {
      if (!this.currentCengelPuzzles || this.currentCengelPuzzles.length === 0) return;
      const rng = new SeededRandom((this.currentSeed || 12345) + 77);
      const randFn = () => rng.next();

      this.currentCengelPuzzles.forEach(puzzle => {
        for (let r = 0; r < puzzle.rows; r++) {
          for (let c = 0; c < puzzle.cols; c++) {
            const cell = puzzle.grid[r][c];
            if (cell.type === 'clue') {
              const isDual = !!(cell.acrossWord && cell.downWord);
              if (cell.acrossWord && cell.acrossWord.clues) {
                cell.acrossWord.clue = CengelGenerator.pickBestClue(cell.acrossWord.clues, this.clueLang, randFn, isDual);
              }
              if (cell.downWord && cell.downWord.clues) {
                cell.downWord.clue = CengelGenerator.pickBestClue(cell.downWord.clues, this.clueLang, randFn, isDual);
              }
            }
          }
        }
        if (puzzle.secretWord && puzzle.secretWord.clues) {
          puzzle.secretWord.clue = CengelGenerator.pickBestClue(puzzle.secretWord.clues, this.clueLang, randFn, false);
        }
      });

      this.renderCengelView();
      const langName = this.clueLang === 'tr' ? 'Türkçe' : (this.clueLang === 'en' ? 'English' : (this.uiLang === 'tr' ? 'Karışık' : 'Mixed'));
      this.showToast(this.uiLang === 'tr' ? `İpucu dili değiştirildi: ${langName}` : `Clue language changed: ${langName}`);
      return;
    }

    if (!this.currentPuzzle) return;
    this.currentPuzzle.allWords.forEach(w => {
      let availableClues = [];
      if (this.clueLang === 'tr' && w.clues && w.clues.tr && w.clues.tr.length > 0) {
        availableClues = w.clues.tr;
      } else if (this.clueLang === 'en' && w.clues && w.clues.en && w.clues.en.length > 0) {
        availableClues = w.clues.en;
      } else {
        let combined = [...(w.clues && w.clues.tr ? w.clues.tr : []), ...(w.clues && w.clues.en ? w.clues.en : [])];
        availableClues = combined.length ? combined : ["No clue"];
      }
      w.clue = availableClues[Math.floor(Math.random() * availableClues.length)];
    });
    this.renderClues(this.acrossCluesList, this.currentPuzzle.acrossClues);
    this.renderClues(this.downCluesList, this.currentPuzzle.downClues);
    this.showToast(`Dil değiştirildi: ${this.clueLang === 'tr' ? 'Türkçe' : (this.clueLang === 'en' ? 'English' : 'Karışık')}`);
  }

  toggleCategory(chip, cat) {
    if (this.selectedCategories.has(cat)) {
      if (this.selectedCategories.size <= 1) {
        const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
        this.showToast(t.toastMinCategories);
        return;
      }
      this.selectedCategories.delete(cat);
      chip.classList.remove('selected');
    } else {
      this.selectedCategories.add(cat);
      chip.classList.add('selected');
    }
    this.updateCategoryCountBadge();
    this.resetSolutionKey();
    this.generateNewPuzzle();
  }

  resetSolutionKey() {
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    this.isSolutionVisible = false;
    this.solutionSheet.classList.remove('visible');
    this.btnToggleSolution.classList.remove('active');
    this.btnToggleSolution.innerHTML = t.btnShowSolution;
    this.pageCountDisplays.forEach(el => el.textContent = '1');
  }

  checkHash() {
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const seed = params.get('seed');
      const pType = params.get('type');
      const pLayout = params.get('layout');
      const diff = params.get('diff');
      const ans = params.get('ans');
      const lang = params.get('lang');
      const cats = params.get('cats');
      
      if (pType && ['cengel', 'classic'].includes(pType)) {
        this.puzzleType = pType;
        this.typeButtons.forEach(b => b.classList.toggle('active', b.dataset.type === pType));
        if (this.cengelLayoutSection) {
          this.cengelLayoutSection.style.display = this.puzzleType === 'cengel' ? 'flex' : 'none';
        }
        if (this.typeLayoutGrid) {
          this.typeLayoutGrid.classList.toggle('single-col', this.puzzleType !== 'cengel');
        }
      }

      if (pLayout && ['dual', 'single'].includes(pLayout)) {
        this.cengelLayout = pLayout;
        this.cengelLayoutButtons.forEach(b => b.classList.toggle('active', b.dataset.layout === pLayout));
      }

      if (diff && this.targetCounts[diff]) {
        this.currentDifficulty = diff;
        this.diffButtons.forEach(b => {
          b.classList.toggle('active', b.dataset.diff === diff);
        });
      }
      if (ans && ['en', 'tr'].includes(ans)) {
        this.answerLang = ans;
        try { localStorage.setItem('answerLang', this.answerLang); } catch(e){}
        if (this.ansLangButtons) {
          this.ansLangButtons.forEach(b => b.classList.toggle('active', b.dataset.ansLang === ans));
        }
      }
      if (lang && ['tr', 'en', 'mixed'].includes(lang)) {
        this.clueLang = lang;
        try { localStorage.setItem('clueLang', this.clueLang); } catch(e){}
        this.langButtons.forEach(b => {
          b.classList.toggle('active', b.dataset.lang === lang);
        });
      }
      if (cats) {
        const catList = cats.split(',');
        this.selectedCategories = new Set();
        document.querySelectorAll('.cat-chip').forEach(chip => {
          if (catList.includes(chip.dataset.cat)) {
            this.selectedCategories.add(chip.dataset.cat);
            chip.classList.add('selected');
          } else {
            chip.classList.remove('selected');
          }
        });
        this.updateCategoryCountBadge();
      }
      if (seed) {
        this.generateNewPuzzle(parseInt(seed));
        return;
      }
    }
    this.generateNewPuzzle();
  }

  getFilteredWords() {
    const sourceBank = this.answerLang === 'tr' ? TR_WORD_BANK : WORD_BANK;
    const includeTop1000 = this.selectedCategories.has('top1000');

    // 1. Category filter (if 'top1000' is selected, include all words tagged with top1000: true)
    const catPool = sourceBank.filter(w =>
      this.selectedCategories.has(w.cat) || (includeTop1000 && w.top1000)
    );

    // 2. CEFR / Vocabulary Difficulty filter with automatic pool size safeguard
    if (this.currentDifficulty === 'easy') {
      const easyPool = catPool.filter(w => !w.level || w.level === 'easy');
      if (easyPool.length >= 60) return easyPool;
      const easyMedPool = catPool.filter(w => !w.level || w.level === 'easy' || w.level === 'medium');
      return easyMedPool.length >= 45 ? easyMedPool : catPool;
    }

    if (this.currentDifficulty === 'medium') {
      const medPool = catPool.filter(w => !w.level || w.level === 'easy' || w.level === 'medium');
      return medPool.length >= 60 ? medPool : catPool;
    }

    // 'hard': include all levels (easy/medium/hard) so C1/hard words are mixed with 3-4 letter connectors
    return catPool;
  }

  generateNewPuzzle(forceSeed = null) {
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    this.btnGenerate.innerHTML = t.btnGenerating;
    this.btnGenerate.disabled = true;

    this.isHintsActive = false;
    this.focusedCell = null;
    if (this.btnHint) {
      this.btnHint.classList.remove('active');
      this.btnHint.innerHTML = t.btnHint;
    }

    setTimeout(() => {
      const bank = this.getFilteredWords();
      this.currentSeed = forceSeed !== null ? forceSeed : Math.floor(Math.random() * 2147483647);
      const dateLocale = this.uiLang === 'tr' ? 'tr-TR' : 'en-US';
      const today = new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' });
      this.puzzleDateDisplay.textContent = today;

      const titleEl = document.querySelector('.sheet-title');
      const subtitleEl = document.querySelector('.sheet-subtitle');

      document.body.dataset.puzzleType = this.puzzleType;
      if (this.puzzleType === 'cengel') {
        this.cengelView.style.display = 'flex';
        this.classicView.style.display = 'none';
        this.solutionCengelView.style.display = 'flex';
        if (this.solutionClassicView) this.solutionClassicView.style.display = 'none';

        // Dimension configurations (Full page single or stacked dual)
        let rows = 18, cols = 14;
        if (this.cengelLayout === 'single') {
          if (this.currentDifficulty === 'easy') { rows = 15; cols = 12; }
          else if (this.currentDifficulty === 'medium') { rows = 18; cols = 14; }
          else { rows = 20; cols = 15; }
        } else {
          // Dual mode (2 puzzles stacked)
          if (this.currentDifficulty === 'easy') { rows = 11; cols = 11; }
          else if (this.currentDifficulty === 'medium') { rows = 13; cols = 11; }
          else { rows = 14; cols = 12; }
        }

        if (titleEl && !titleEl.dataset.custom) {
          titleEl.textContent = t.sheetTitleCengel;
        }
        if (subtitleEl && !subtitleEl.dataset.custom) {
          subtitleEl.textContent = t.sheetSubtitleCengel;
        }

        const diffLabel = this.currentDifficulty === 'easy' ? t.diffEasy : (this.currentDifficulty === 'hard' ? t.diffHard : t.diffMedium);
        const baseNum = (this.currentSeed % 80) + 10;

        this.currentCengelPuzzles = [];

        if (this.cengelLayout === 'dual') {
          const rng1 = new SeededRandom(this.currentSeed);
          const gen1 = new CengelGenerator(bank, { rows, cols, rng: rng1, clueLang: this.clueLang });
          const p1 = gen1.generate();
          p1.puzzleNumber = `#${baseNum}`;
          p1.difficultyLabel = diffLabel;

          const seed2 = (this.currentSeed + 101) % 2147483647;
          const rng2 = new SeededRandom(seed2);
          const gen2 = new CengelGenerator(bank, { rows, cols, rng: rng2, clueLang: this.clueLang });
          const p2 = gen2.generate();
          p2.puzzleNumber = `#${baseNum + 1}`;
          p2.difficultyLabel = diffLabel;

          this.currentCengelPuzzles = [p1, p2];
        } else {
          const rng = new SeededRandom(this.currentSeed);
          const gen = new CengelGenerator(bank, { rows, cols, rng, clueLang: this.clueLang });
          const p = gen.generate();
          p.puzzleNumber = `#${baseNum}`;
          p.difficultyLabel = diffLabel;

          this.currentCengelPuzzles = [p];
        }

        const puzzleId = `#CGL-${this.currentSeed.toString().substring(0, 4)}`;
        const typeBadge = this.uiLang === 'tr' ? 'Gazete Çengel' : 'Arrowword';
        this.puzzleIdDisplay.textContent = puzzleId;
        this.solutionPuzzleIdDisplay.textContent = puzzleId;
        this.puzzleDiffDisplay.textContent = `${diffLabel} (${typeBadge})`;
        this.solutionDiffDisplay.textContent = `${diffLabel} (${typeBadge})`;

        this.renderCengelView();
      } else {
        // Classic Crossword View
        this.cengelView.style.display = 'none';
        this.classicView.style.display = 'block';
        this.solutionCengelView.style.display = 'none';
        if (this.solutionClassicView) this.solutionClassicView.style.display = 'block';

        if (titleEl && !titleEl.dataset.custom) {
          titleEl.textContent = t.sheetTitleClassic;
        }
        if (subtitleEl && !subtitleEl.dataset.custom) {
          subtitleEl.textContent = t.sheetSubtitleClassic;
        }

        const targetCount = this.targetCounts[this.currentDifficulty];
        const rng = new SeededRandom(this.currentSeed);
        const generator = new CrosswordGenerator(bank, targetCount, rng, this.clueLang);
        this.currentPuzzle = generator.generate();

        const puzzleId = '#CW-' + this.currentSeed.toString().substring(0, 4);
        const scoreLabel = this.calculateDifficultyScore(this.currentPuzzle);

        this.puzzleIdDisplay.textContent = puzzleId;
        this.solutionPuzzleIdDisplay.textContent = puzzleId;
        this.puzzleDiffDisplay.textContent = scoreLabel;
        this.solutionDiffDisplay.textContent = scoreLabel;

        this.renderPuzzles();
      }

      this.btnGenerate.innerHTML = t.btnNewPuzzle;
      this.btnGenerate.disabled = false;
    }, 50);
  }

  renderCengelView() {
    this.cengelView.innerHTML = '';
    this.solutionCengelView.innerHTML = '';

    const isDual = this.currentCengelPuzzles.length > 1;
    this.cengelView.classList.toggle('layout-single', !isDual);
    this.cengelView.classList.toggle('layout-dual', isDual);
    this.solutionCengelView.classList.toggle('layout-single', !isDual);
    this.solutionCengelView.classList.toggle('layout-dual', isDual);

    let cellSize = '52px';
    if (isDual) {
      cellSize = '38px';
    } else {
      const p = this.currentCengelPuzzles[0];
      if (p.cols <= 12) cellSize = '54px';
      else if (p.cols <= 14) cellSize = '48px';
      else cellSize = '44px';
    }
    document.documentElement.style.setProperty('--cengel-cell-size', cellSize);

    this.currentCengelPuzzles.forEach((puzzle, idx) => {
      if (idx > 0) {
        const divider1 = document.createElement('div');
        divider1.className = 'cengel-dual-divider';
        this.cengelView.appendChild(divider1);

        const divider2 = document.createElement('div');
        divider2.className = 'cengel-dual-divider';
        this.solutionCengelView.appendChild(divider2);
      }

      // Puzzle view (unsolved)
      const block1 = this.createCengelDOMBlock(puzzle, false, idx);
      this.cengelView.appendChild(block1);

      // Solution view (solved)
      const block2 = this.createCengelDOMBlock(puzzle, true, idx);
      this.solutionCengelView.appendChild(block2);
    });

    // Update Stats bar (BUG-5 Fix: real computed active density)
    const totalWords = this.currentCengelPuzzles.reduce((sum, p) => sum + p.words.length, 0);
    const totalIntersections = this.currentCengelPuzzles.reduce((sum, p) => sum + p.intersections, 0);
    const avgDensity = Math.round(
      this.currentCengelPuzzles.reduce((sum, p) => sum + (p.density || 0), 0) / this.currentCengelPuzzles.length
    );
    const p0 = this.currentCengelPuzzles[0];

    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    this.statsWords.textContent = `${t.statsWords} ${totalWords} ${t.statsPlaced}`;
    this.statsGrid.textContent = isDual ? `${t.statsGrid} 2x (${p0.rows}x${p0.cols})` : `${t.statsGrid} ${p0.rows}x${p0.cols}`;
    this.statsDensity.textContent = `${t.statsDensity} ${avgDensity}% (${t.activeArea})`;
    this.statsIntersections.textContent = `${t.statsIntersections} ${totalIntersections}`;
  }

  createCengelDOMBlock(puzzle, isSolution, pIdx = 0) {
    const block = document.createElement('div');
    block.className = 'cengel-puzzle-block';
    block.style.setProperty('--cengel-rows', puzzle.rows);
    block.style.setProperty('--cengel-cols', puzzle.cols);

    // Board Grid (No banner above grid)
    const board = document.createElement('div');
    board.className = 'cengel-board';
    board.style.setProperty('--cengel-rows', puzzle.rows);
    board.style.setProperty('--cengel-cols', puzzle.cols);
    board.style.gridTemplateRows = `repeat(${puzzle.rows}, var(--cengel-cell-size))`;
    board.style.gridTemplateColumns = `repeat(${puzzle.cols}, var(--cengel-cell-size))`;

    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const cell = puzzle.grid[r][c];
        const cellDiv = document.createElement('div');

        if (cell.type === 'blocked') {
          cellDiv.className = 'cengel-cell blocked';
        } else if (cell.type === 'letter') {
          cellDiv.className = 'cengel-cell letter-cell';
          cellDiv.dataset.pidx = pIdx;
          cellDiv.dataset.r = r;
          cellDiv.dataset.c = c;

          // YEN-2: Secret Keyword Number Badge
          if (cell.secretIndex && this.cengelLayout === 'single') {
            const badge = document.createElement('span');
            badge.className = 'secret-index-badge';
            badge.textContent = cell.secretIndex;
            cellDiv.appendChild(badge);
          }

          if (isSolution) {
            const span = document.createElement('span');
            span.className = 'letter-char';
            span.textContent = cell.char;
            span.style.display = 'block';
            cellDiv.appendChild(span);
          } else {
            if (cell.isHint) {
              cellDiv.classList.add('hint-cell');
              const span = document.createElement('span');
              span.className = 'letter-char';
              span.textContent = cell.char;
              span.style.display = 'block';
              cellDiv.appendChild(span);
            } else if (cell.userChar) {
              cellDiv.classList.add('user-filled');
              const uSpan = document.createElement('span');
              uSpan.className = 'user-char';
              uSpan.textContent = cell.userChar;
              cellDiv.appendChild(uSpan);
            }

            if (
              this.focusedCell &&
              this.focusedCell.mode === 'cengel' &&
              this.focusedCell.pIdx === pIdx &&
              this.focusedCell.r === r &&
              this.focusedCell.c === c
            ) {
              cellDiv.classList.add('focused-cell');
            }

            cellDiv.addEventListener('click', (e) => {
              e.stopPropagation();
              this.focusCengelCell(pIdx, r, c);
            });
          }
        } else {
          // Clue Cell (EKS-1 & EKS-2)
          cellDiv.className = 'cengel-cell clue-cell';
          if (cell.acrossWord && cell.downWord) {
            cellDiv.classList.add('dual-clue');
            const acLong = cell.acrossWord.clue.length > 14 ? ' long-clue' : '';
            const dnLong = cell.downWord.clue.length > 14 ? ' long-clue' : '';
            cellDiv.innerHTML = `
              <div class="clue-sub">
                <span class="clue-text${acLong}">${cell.acrossWord.clue}</span>
                <span class="clue-arrow arrow-right">→</span>
              </div>
              <div class="clue-sub">
                <span class="clue-text${dnLong}">${cell.downWord.clue}</span>
                <span class="clue-arrow arrow-down">↓</span>
              </div>
            `;
          } else if (cell.acrossWord) {
            const acLong = cell.acrossWord.clue.length > 18 ? ' long-clue' : '';
            cellDiv.innerHTML = `
              <div class="clue-sub">
                <span class="clue-text${acLong}">${cell.acrossWord.clue}</span>
                <span class="clue-arrow arrow-right">→</span>
              </div>
            `;
          } else if (cell.downWord) {
            const dnLong = cell.downWord.clue.length > 18 ? ' long-clue' : '';
            cellDiv.innerHTML = `
              <div class="clue-sub">
                <span class="clue-text${dnLong}">${cell.downWord.clue}</span>
                <span class="clue-arrow arrow-down">↓</span>
              </div>
            `;
          } else {
            cellDiv.className = 'cengel-cell blocked';
          }
        }

        board.appendChild(cellDiv);
      }
    }

    block.appendChild(board);

    // YEN-2: Secret Keyword Bar below single-layout Çengel puzzle
    if (puzzle.secretWord && this.cengelLayout === 'single') {
      const secretBar = document.createElement('div');
      secretBar.className = 'cengel-secret-bar';

      const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
      const infoDiv = document.createElement('div');
      infoDiv.className = 'secret-bar-info';
      infoDiv.innerHTML = `
        <span class="secret-bar-label">${t.secretKeywordLabel}</span>
        <span class="secret-bar-clue">${puzzle.secretWord.clue}</span>
      `;

      const boxesDiv = document.createElement('div');
      boxesDiv.className = 'secret-bar-boxes';

      puzzle.secretWord.positions.forEach(pos => {
        const box = document.createElement('div');
        box.className = 'secret-box';
        if (!isSolution) {
          box.dataset.secretIdx = pos.index;
        }

        const numSpan = document.createElement('span');
        numSpan.className = 'secret-box-num';
        numSpan.textContent = pos.index;
        box.appendChild(numSpan);

        const charSpan = document.createElement('span');
        charSpan.className = 'secret-box-char';
        const gridCell = puzzle.grid[pos.r][pos.c];
        if (isSolution) {
          charSpan.textContent = pos.char;
        } else if (gridCell.isHint) {
          charSpan.textContent = gridCell.char;
        } else if (gridCell.userChar) {
          charSpan.textContent = gridCell.userChar;
        }
        box.appendChild(charSpan);

        boxesDiv.appendChild(box);
      });

      secretBar.appendChild(infoDiv);
      secretBar.appendChild(boxesDiv);
      block.appendChild(secretBar);
    }

    return block;
  }

  // YEN-3: Toggle Starter Hint Letters (~15% of letter cells)
  toggleHints() {
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    this.isHintsActive = !this.isHintsActive;
    if (this.btnHint) {
      this.btnHint.classList.toggle('active', this.isHintsActive);
      this.btnHint.innerHTML = this.isHintsActive ? t.btnHintHide : t.btnHint;
    }

    const rng = new SeededRandom((this.currentSeed || 12345) + 333);

    if (this.puzzleType === 'cengel') {
      this.currentCengelPuzzles.forEach(puzzle => {
        for (let r = 0; r < puzzle.rows; r++) {
          for (let c = 0; c < puzzle.cols; c++) {
            const cell = puzzle.grid[r][c];
            if (cell.type === 'letter') {
              if (this.isHintsActive) {
                cell.isHint = rng.next() < 0.16;
              } else {
                cell.isHint = false;
              }
            }
          }
        }
      });
      this.renderCengelView();
    } else if (this.currentPuzzle) {
      const { rows, cols, grid } = this.currentPuzzle;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (!cell.isBlocked) {
            cell.isHint = this.isHintsActive ? (rng.next() < 0.16) : false;
          }
        }
      }
      this.renderGrid(this.crosswordGrid, grid, false, false);
    }

    this.showToast(this.isHintsActive ? t.toastHintsShown : t.toastHintsHidden);
  }

  // YEN-1: Validate User-Entered Letters
  checkAnswers() {
    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;

    if (this.puzzleType === 'cengel') {
      const cells = this.cengelView.querySelectorAll('.cengel-cell.letter-cell');
      cells.forEach(cellDiv => {
        cellDiv.classList.remove('cell-correct', 'cell-wrong');
        const pIdx = parseInt(cellDiv.dataset.pidx || '0');
        const r = parseInt(cellDiv.dataset.r);
        const c = parseInt(cellDiv.dataset.c);
        const cell = this.currentCengelPuzzles[pIdx]?.grid[r]?.[c];
        if (!cell || cell.isHint) return;

        if (cell.userChar) {
          if (cell.userChar.toUpperCase() === cell.char.toUpperCase()) {
            cellDiv.classList.add('cell-correct');
            correctCount++;
          } else {
            cellDiv.classList.add('cell-wrong');
            wrongCount++;
          }
        } else {
          emptyCount++;
        }
      });
    } else if (this.currentPuzzle) {
      const cells = this.crosswordGrid.querySelectorAll('.cell:not(.blocked)');
      cells.forEach(cellDiv => {
        cellDiv.classList.remove('cell-correct', 'cell-wrong');
        const r = parseInt(cellDiv.dataset.r);
        const c = parseInt(cellDiv.dataset.c);
        const cell = this.currentPuzzle.grid[r]?.[c];
        if (!cell || cell.isHint) return;

        if (cell.userChar) {
          if (cell.userChar.toUpperCase() === cell.letter.toUpperCase()) {
            cellDiv.classList.add('cell-correct');
            correctCount++;
          } else {
            cellDiv.classList.add('cell-wrong');
            wrongCount++;
          }
        } else {
          emptyCount++;
        }
      });
    }

    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    if (correctCount === 0 && wrongCount === 0) {
      this.showToast(t.toastCheckEmpty);
    } else if (wrongCount === 0 && emptyCount === 0) {
      this.showToast(t.toastCheckPerfect);
    } else {
      const msg = t.toastCheckScore
        .replace('{correct}', correctCount)
        .replace('{wrong}', wrongCount)
        .replace('{empty}', emptyCount);
      this.showToast(msg);
    }
  }

  focusCengelCell(pIdx, r, c) {
    let dir = 'across';
    if (
      this.focusedCell &&
      this.focusedCell.mode === 'cengel' &&
      this.focusedCell.pIdx === pIdx &&
      this.focusedCell.r === r &&
      this.focusedCell.c === c
    ) {
      // Clicking the same cell toggles direction
      dir = this.focusedCell.dir === 'across' ? 'down' : 'across';
    } else if (this.focusedCell && this.focusedCell.mode === 'cengel') {
      dir = this.focusedCell.dir;
    }

    this.focusedCell = { mode: 'cengel', pIdx, r, c, dir };
    this.cengelView.querySelectorAll('.cengel-cell.focused-cell').forEach(el => el.classList.remove('focused-cell'));
    const target = this.cengelView.querySelector(`.cengel-cell.letter-cell[data-pidx="${pIdx}"][data-r="${r}"][data-c="${c}"]`);
    if (target) target.classList.add('focused-cell');
  }

  focusClassicCell(r, c) {
    let dir = 'across';
    if (
      this.focusedCell &&
      this.focusedCell.mode === 'classic' &&
      this.focusedCell.r === r &&
      this.focusedCell.c === c
    ) {
      dir = this.focusedCell.dir === 'across' ? 'down' : 'across';
    } else if (this.focusedCell && this.focusedCell.mode === 'classic') {
      dir = this.focusedCell.dir;
    }

    this.focusedCell = { mode: 'classic', pIdx: 0, r, c, dir };
    this.crosswordGrid.querySelectorAll('.cell.focused-cell').forEach(el => el.classList.remove('focused-cell'));
    const target = this.crosswordGrid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (target) target.classList.add('focused-cell');
  }

  handleKeyDown(e) {
    if (!this.focusedCell) return;
    // Ignore if user is editing a contenteditable header or input element
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName))) {
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const { mode, pIdx, r, c, dir } = this.focusedCell;

    if (e.key === ' ') {
      e.preventDefault();
      const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
      this.focusedCell.dir = dir === 'across' ? 'down' : 'across';
      this.showToast(this.focusedCell.dir === 'across' ? t.toastDirectionAcross : t.toastDirectionDown);
      return;
    }

    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const dr = e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowUp' ? -1 : 0);
      const dc = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
      this.moveFocusStep(dr, dc);
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      this.setFocusedCellChar('');
      if (e.key === 'Backspace') {
        const dr = dir === 'down' ? -1 : 0;
        const dc = dir === 'across' ? -1 : 0;
        this.moveFocusStep(dr, dc);
      }
      return;
    }

    if (this.answerLang === 'tr' && /^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toLocaleUpperCase('tr-TR');
      this.setFocusedCellChar(letter);
      const dr = dir === 'down' ? 1 : 0;
      const dc = dir === 'across' ? 1 : 0;
      this.moveFocusStep(dr, dc);
      return;
    }

    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      this.setFocusedCellChar(letter);
      const dr = dir === 'down' ? 1 : 0;
      const dc = dir === 'across' ? 1 : 0;
      this.moveFocusStep(dr, dc);
    }
  }

  setFocusedCellChar(char) {
    if (!this.focusedCell) return;
    const { mode, pIdx, r, c } = this.focusedCell;

    if (mode === 'cengel') {
      const puzzle = this.currentCengelPuzzles[pIdx];
      if (!puzzle) return;
      const cell = puzzle.grid[r]?.[c];
      if (!cell || cell.type !== 'letter' || cell.isHint) return;

      cell.userChar = char;
      const cellDiv = this.cengelView.querySelector(`.cengel-cell.letter-cell[data-pidx="${pIdx}"][data-r="${r}"][data-c="${c}"]`);
      if (cellDiv) {
        cellDiv.classList.remove('cell-correct', 'cell-wrong');
        let uSpan = cellDiv.querySelector('.user-char');
        if (char) {
          cellDiv.classList.add('user-filled');
          if (!uSpan) {
            uSpan = document.createElement('span');
            uSpan.className = 'user-char';
            cellDiv.appendChild(uSpan);
          }
          uSpan.textContent = char;
        } else {
          cellDiv.classList.remove('user-filled');
          if (uSpan) uSpan.remove();
        }
      }

      // Sync with Secret Keyword Bar if this cell has a secretIndex
      if (cell.secretIndex && this.cengelLayout === 'single') {
        const secretBoxChar = this.cengelView.querySelector(`.secret-box[data-secret-idx="${cell.secretIndex}"] .secret-box-char`);
        if (secretBoxChar) {
          secretBoxChar.textContent = char;
        }
      }
    } else if (mode === 'classic' && this.currentPuzzle) {
      const cell = this.currentPuzzle.grid[r]?.[c];
      if (!cell || cell.isBlocked || cell.isHint) return;

      cell.userChar = char;
      const cellDiv = this.crosswordGrid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if (cellDiv) {
        cellDiv.classList.remove('cell-correct', 'cell-wrong');
        let uSpan = cellDiv.querySelector('.user-char');
        if (char) {
          cellDiv.classList.add('user-filled');
          if (!uSpan) {
            uSpan = document.createElement('span');
            uSpan.className = 'user-char';
            cellDiv.appendChild(uSpan);
          }
          uSpan.textContent = char;
        } else {
          cellDiv.classList.remove('user-filled');
          if (uSpan) uSpan.remove();
        }
      }
    }
  }

  moveFocusStep(dr, dc) {
    if (!this.focusedCell) return;
    const { mode, pIdx, r, c } = this.focusedCell;

    if (mode === 'cengel') {
      const puzzle = this.currentCengelPuzzles[pIdx];
      if (!puzzle) return;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < puzzle.rows && nc >= 0 && nc < puzzle.cols) {
        if (puzzle.grid[nr][nc].type === 'letter') {
          this.focusCengelCell(pIdx, nr, nc);
        }
      }
    } else if (mode === 'classic' && this.currentPuzzle) {
      const { rows, cols, grid } = this.currentPuzzle;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (!grid[nr][nc].isBlocked) {
          this.focusClassicCell(nr, nc);
        }
      }
    }
  }

  toggleSolution() {
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    this.isSolutionVisible = !this.isSolutionVisible;
    if (this.isSolutionVisible) {
      this.solutionSheet.classList.add('visible');
      this.btnToggleSolution.classList.add('active');
      this.btnToggleSolution.innerHTML = t.btnHideSolution;
      this.pageCountDisplays.forEach(el => el.textContent = '2');
    } else {
      this.solutionSheet.classList.remove('visible');
      this.btnToggleSolution.classList.remove('active');
      this.btnToggleSolution.innerHTML = t.btnShowSolution;
      this.pageCountDisplays.forEach(el => el.textContent = '1');
    }
  }

  renderPuzzles() {
    if (!this.currentPuzzle) return;
    const { rows, cols, grid, acrossClues, downClues, allWords, intersections } = this.currentPuzzle;

    let cellSizePx = 28;
    const maxDim = Math.max(rows, cols);
    if (maxDim > 18) cellSizePx = 21;
    else if (maxDim > 15) cellSizePx = 24;
    else if (maxDim > 12) cellSizePx = 27;
    else cellSizePx = 30;

    document.documentElement.style.setProperty('--cell-size', `${cellSizePx}px`);

    this.renderGrid(this.crosswordGrid, grid, false, true);
    this.renderGrid(this.solutionGrid, grid, true, false);

    this.renderClues(this.acrossCluesList, acrossClues);
    this.renderClues(this.downCluesList, downClues);
    this.renderSolutionWordsSummary(allWords);
    
    // Stats Update (YEN-5)
    let filledCells = 0;
    for(let r=0; r<rows; r++) {
      for(let c=0; c<cols; c++) {
        if(!grid[r][c].isBlocked) filledCells++;
      }
    }
    
    const density = Math.round((filledCells / (rows * cols)) * 100);
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    this.statsWords.textContent = `${t.statsWords} ${allWords.length} ${t.statsPlaced}`;
    this.statsGrid.textContent = `${t.statsGrid} ${rows}x${cols}`;
    this.statsDensity.textContent = `${t.statsDensity} ${density}%`;
    this.statsIntersections.textContent = `${t.statsIntersections} ${intersections}`;
  }

  renderGrid(container, grid, isSolution, animate) {
    container.innerHTML = '';
    const rows = grid.length;
    const cols = grid[0].length;
    container.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;
    container.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellData = grid[r][c];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        
        if (animate) {
          cellDiv.classList.add('animate-in');
          cellDiv.style.animationDelay = `${(r * cols + c) * 12}ms`;
        }

        if (cellData.isBlocked) {
          cellDiv.classList.add('blocked');
        } else {
          cellDiv.dataset.r = r;
          cellDiv.dataset.c = c;
          if (cellData.number) {
            const numSpan = document.createElement('span');
            numSpan.className = 'cell-num';
            numSpan.textContent = cellData.number;
            cellDiv.appendChild(numSpan);
          }
          if (isSolution && cellData.letter) {
            cellDiv.classList.add('solution-cell');
            const letterSpan = document.createElement('span');
            letterSpan.textContent = cellData.letter;
            cellDiv.appendChild(letterSpan);
          } else if (!isSolution) {
            if (cellData.isHint && cellData.letter) {
              cellDiv.classList.add('hint-cell');
              const hintSpan = document.createElement('span');
              hintSpan.textContent = cellData.letter;
              cellDiv.appendChild(hintSpan);
            } else if (cellData.userChar) {
              cellDiv.classList.add('user-filled');
              const uSpan = document.createElement('span');
              uSpan.className = 'user-char';
              uSpan.textContent = cellData.userChar;
              cellDiv.appendChild(uSpan);
            }
            cellDiv.addEventListener('click', (e) => {
              e.stopPropagation();
              this.focusClassicCell(r, c);
            });
          }
        }
        container.appendChild(cellDiv);
      }
    }
  }

  renderClues(container, clueList) {
    container.innerHTML = '';
    if (clueList.length === 0) {
      const li = document.createElement('li');
      li.className = 'clue-item';
      li.textContent = 'None';
      container.appendChild(li);
      return;
    }
    clueList.forEach(item => {
      const li = document.createElement('li');
      li.className = 'clue-item';
      li.innerHTML = `<strong>${item.number}.</strong> <span>${item.clue}</span> <span class="clue-word-len">(${item.word.length})</span>`;
      container.appendChild(li);
    });
  }

  renderSolutionWordsSummary(words) {
    if (!this.solutionWordsSummary) return;
    this.solutionWordsSummary.innerHTML = '';
    words.forEach(item => {
      const div = document.createElement('div');
      div.className = 'solution-item';
      div.innerHTML = `<span class="num">${item.number} ${item.direction === 'across' ? 'A' : 'D'}</span> <span class="word">${item.word}</span> <span class="clue-word-len">(${item.word.length} letters)</span>`;
      this.solutionWordsSummary.appendChild(div);
    });
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  calculateDifficultyScore(puzzle) {
    if (!puzzle || !puzzle.allWords || puzzle.allWords.length === 0) return '';
    let avgLen = 0, rarePoints = 0;
    puzzle.allWords.forEach(w => {
      avgLen += w.word.length;
      for (const c of w.word) {
        if (['Q','X','Z','J','K'].includes(c)) rarePoints++;
      }
    });
    avgLen /= puzzle.allWords.length;
    const numWords = puzzle.allWords.length;
    const intersections = puzzle.intersections || 1;
    const diffScore = (avgLen * 0.5) + (rarePoints * 1.5) + (numWords * 0.3) - (intersections * 0.2);
    const score = Math.max(1, Math.min(10, Math.round(diffScore)));
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    const stars = score <= 3 ? `⭐ ${t.diffEasy}` : (score <= 6 ? `⭐⭐ ${t.diffMedium}` : `⭐⭐⭐ ${t.diffHard}`);
    const diffTitle = this.currentDifficulty === 'easy' ? t.diffEasy : (this.currentDifficulty === 'hard' ? t.diffHard : t.diffMedium);
    return `${diffTitle} — ${stars} (${score}/10)`;
  }

  batchPrint(count) {
    const container = document.getElementById('batch-container');
    container.innerHTML = '';
    document.body.classList.add('batch-print-active');
    document.body.dataset.puzzleType = this.puzzleType;
    
    const bank = this.getFilteredWords();
    const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
    const diffLabel = this.currentDifficulty === 'easy' ? t.diffEasy : (this.currentDifficulty === 'hard' ? t.diffHard : t.diffMedium);

    if (this.puzzleType === 'cengel') {
      let rows = 18, cols = 14;
      if (this.cengelLayout === 'single') {
        if (this.currentDifficulty === 'easy') { rows = 15; cols = 12; }
        else if (this.currentDifficulty === 'medium') { rows = 18; cols = 14; }
        else { rows = 20; cols = 15; }
      } else {
        if (this.currentDifficulty === 'easy') { rows = 11; cols = 11; }
        else if (this.currentDifficulty === 'medium') { rows = 13; cols = 11; }
        else { rows = 14; cols = 12; }
      }

      const batchPuzzlesList = [];
      for (let i = 0; i < count; i++) {
        const seed = Math.floor(Math.random() * 2147483647);
        const baseNum = (seed % 80) + 10;
        if (this.cengelLayout === 'dual') {
          const rng1 = new SeededRandom(seed);
          const p1 = new CengelGenerator(bank, { rows, cols, rng: rng1, clueLang: this.clueLang }).generate();
          p1.puzzleNumber = `#${baseNum}`;
          p1.difficultyLabel = diffLabel;

          const rng2 = new SeededRandom((seed + 101) % 2147483647);
          const p2 = new CengelGenerator(bank, { rows, cols, rng: rng2, clueLang: this.clueLang }).generate();
          p2.puzzleNumber = `#${baseNum + 1}`;
          p2.difficultyLabel = diffLabel;

          batchPuzzlesList.push([p1, p2]);
        } else {
          const rng = new SeededRandom(seed);
          const p = new CengelGenerator(bank, { rows, cols, rng, clueLang: this.clueLang }).generate();
          p.puzzleNumber = `#${baseNum}`;
          p.difficultyLabel = diffLabel;
          batchPuzzlesList.push([p]);
        }
      }

      const isDualBatch = this.cengelLayout === 'dual';
      const typeBadge = this.uiLang === 'tr' ? 'Gazete Çengel' : 'Arrowword';

      // Render puzzle sheets
      batchPuzzlesList.forEach((puzzles, idx) => {
        const sheet = this.puzzleSheet.cloneNode(true);
        sheet.id = '';
        sheet.querySelector('#puzzle-id').textContent = `Batch #${idx + 1}`;
        sheet.querySelector('#puzzle-diff-label').textContent = `${diffLabel} (${typeBadge})`;
        const classicBox = sheet.querySelector('#classic-view');
        if (classicBox) classicBox.style.display = 'none';

        const cView = sheet.querySelector('#cengel-view');
        cView.style.display = 'flex';
        cView.classList.toggle('layout-single', !isDualBatch);
        cView.classList.toggle('layout-dual', isDualBatch);
        cView.innerHTML = '';
        puzzles.forEach((puz, pIdx) => {
          if (pIdx > 0) {
            const div = document.createElement('div');
            div.className = 'cengel-dual-divider';
            cView.appendChild(div);
          }
          cView.appendChild(this.createCengelDOMBlock(puz, false, pIdx));
        });

        const footer = sheet.querySelector('.sheet-footer');
        footer.innerHTML = `<span>${t.footerCengelPage} ${idx + 1} / ${count * 2}</span>`;
        container.appendChild(sheet);
      });

      // Render solution sheets
      batchPuzzlesList.forEach((puzzles, idx) => {
        const sheet = this.solutionSheet.cloneNode(true);
        sheet.id = '';
        sheet.classList.add('visible');
        sheet.querySelector('#solution-puzzle-id').textContent = `Batch #${idx + 1}`;
        sheet.querySelector('#solution-diff-label').textContent = `${diffLabel} (${typeBadge})`;
        const classicSol = sheet.querySelector('#solution-classic-view');
        if (classicSol) classicSol.style.display = 'none';

        const sView = sheet.querySelector('#solution-cengel-view');
        sView.style.display = 'flex';
        sView.classList.toggle('layout-single', !isDualBatch);
        sView.classList.toggle('layout-dual', isDualBatch);
        sView.innerHTML = '';
        puzzles.forEach((puz, pIdx) => {
          if (pIdx > 0) {
            const div = document.createElement('div');
            div.className = 'cengel-dual-divider';
            sView.appendChild(div);
          }
          sView.appendChild(this.createCengelDOMBlock(puz, true, pIdx));
        });

        const footer = sheet.querySelector('.sheet-footer');
        footer.innerHTML = `<span>${t.footerCengelSol} ${count + idx + 1} / ${count * 2}</span>`;
        container.appendChild(sheet);
      });

      const onAfterPrint = () => {
        document.body.classList.remove('batch-print-active');
        container.innerHTML = '';
        window.removeEventListener('afterprint', onAfterPrint);
      };
      window.addEventListener('afterprint', onAfterPrint);

      setTimeout(() => {
        window.print();
      }, 100);
      return;
    }
    
    // Classic batch print
    const targetCount = this.targetCounts[this.currentDifficulty];
    const generatedPuzzles = [];
    
    // Generate puzzles
    for(let i=0; i<count; i++) {
      const rng = new SeededRandom(Math.floor(Math.random() * 2147483647));
      const generator = new CrosswordGenerator(bank, targetCount, rng, this.clueLang);
      generatedPuzzles.push(generator.generate());
    }
    
    // Render puzzles
    generatedPuzzles.forEach((puzzle, idx) => {
      const sheet = this.puzzleSheet.cloneNode(true);
      sheet.id = '';
      sheet.querySelector('#puzzle-id').textContent = `Batch #${idx+1}`;
      
      const cView = sheet.querySelector('#cengel-view');
      if (cView) cView.style.display = 'none';
      const clView = sheet.querySelector('#classic-view');
      if (clView) clView.style.display = 'block';

      const maxDim = Math.max(puzzle.rows, puzzle.cols);
      let cellSizePx = 28;
      if (maxDim > 18) cellSizePx = 21;
      else if (maxDim > 15) cellSizePx = 24;
      else if (maxDim > 12) cellSizePx = 27;
      else cellSizePx = 30;

      const pGrid = sheet.querySelector('#crossword-grid');
      pGrid.style.setProperty('--cell-size', `${cellSizePx}px`);
      this.renderGrid(pGrid, puzzle.grid, false, false);
      
      const acList = sheet.querySelector('#across-clues');
      const dnList = sheet.querySelector('#down-clues');
      this.renderClues(acList, puzzle.acrossClues);
      this.renderClues(dnList, puzzle.downClues);
      
      const batchDiffLabel = this.calculateDifficultyScore(puzzle);
      sheet.querySelector('#puzzle-diff-label').textContent = batchDiffLabel;

      sheet.querySelector('.page-count-display').textContent = `${count*2}`;
      const footer = sheet.querySelector('.sheet-footer');
      footer.innerHTML = `<span>${t.footerClassicPage} ${idx+1} / ${count*2}</span>`;
      
      container.appendChild(sheet);
    });
    
    // Render solutions
    generatedPuzzles.forEach((puzzle, idx) => {
      const sheet = this.solutionSheet.cloneNode(true);
      sheet.id = '';
      sheet.classList.add('visible');
      sheet.querySelector('#solution-puzzle-id').textContent = `Batch #${idx+1}`;

      const sCView = sheet.querySelector('#solution-cengel-view');
      if (sCView) sCView.style.display = 'none';
      const sClView = sheet.querySelector('#solution-classic-view');
      if (sClView) sClView.style.display = 'block';

      const maxDim = Math.max(puzzle.rows, puzzle.cols);
      let cellSizePx = 28;
      if (maxDim > 18) cellSizePx = 21;
      else if (maxDim > 15) cellSizePx = 24;
      else if (maxDim > 12) cellSizePx = 27;
      else cellSizePx = 30;
      
      const sGrid = sheet.querySelector('#solution-grid');
      sGrid.style.setProperty('--cell-size', `${cellSizePx}px`);
      this.renderGrid(sGrid, puzzle.grid, true, false);

      const batchDiffLabel = this.calculateDifficultyScore(puzzle);
      sheet.querySelector('#solution-diff-label').textContent = batchDiffLabel;
      
      const sSummary = sheet.querySelector('#solution-words-summary');
      sSummary.innerHTML = '';
      puzzle.allWords.forEach(item => {
        const div = document.createElement('div');
        div.className = 'solution-item';
        div.innerHTML = `<span class="num">${item.number} ${item.direction === 'across' ? 'A' : 'D'}</span> <span class="word">${item.word}</span>`;
        sSummary.appendChild(div);
      });
      
      const footer = sheet.querySelector('.sheet-footer');
      footer.innerHTML = `<span>${t.footerClassicSol} ${count + idx + 1} / ${count*2}</span>`;
      
      container.appendChild(sheet);
    });

    const onAfterPrint = () => {
      document.body.classList.remove('batch-print-active');
      container.innerHTML = '';
      window.removeEventListener('afterprint', onAfterPrint);
    };
    window.addEventListener('afterprint', onAfterPrint);
    
    setTimeout(() => {
      window.print();
    }, 100);
  }

  exportPdf() {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
      script.onload = () => this._generatePdf();
      script.onerror = () => {
        const t = TRANSLATIONS[this.uiLang] || TRANSLATIONS.tr;
        this.showToast(t.toastPdfOffline);
      };
      document.head.appendChild(script);
    } else {
      this._generatePdf();
    }
  }

  _generatePdf() {
    if (this.puzzleType === 'cengel') {
      if (!this.currentCengelPuzzles || this.currentCengelPuzzles.length === 0) return;
      const diffLabel = this.currentDifficulty === 'easy' ? 'Kolay Seviye' : (this.currentDifficulty === 'hard' ? 'Zor Seviye' : 'Orta Seviye');
      PdfExporter.exportCengel(this.currentCengelPuzzles, {
        difficulty: diffLabel,
        isSolutionVisible: this.isSolutionVisible,
        puzzleId: this.currentCengelPuzzles[0].puzzleNumber || '#26'
      });
      return;
    }

    if (!this.currentPuzzle) return;
    const titleEl = document.querySelector('.sheet-title');
    const subtitleEl = document.querySelector('.sheet-subtitle');
    const title = titleEl ? titleEl.textContent.trim() : 'English Crossword';
    const subtitle = subtitleEl ? subtitleEl.textContent.trim() : 'Vocabulary & General Knowledge';

    PdfExporter.export(this.currentPuzzle, {
      puzzleId: this.puzzleIdDisplay.textContent,
      difficulty: this.puzzleDiffDisplay.textContent,
      title: title,
      subtitle: subtitle,
      isSolutionVisible: this.isSolutionVisible,
      date: this.puzzleDateDisplay.textContent
    });
  }
}
