import { WORD_BANK } from "./data/words.js";
import { SeededRandom } from "./utils/seeded-random.js";
import { CrosswordGenerator } from "./core/generator.js";
import { PdfExporter } from "./utils/pdf-exporter.js";

export class CrosswordApp {
  constructor() {
    this.currentDifficulty = 'medium';
    this.currentPuzzle = null;
    this.isSolutionVisible = false;
    this.targetCounts = { easy: 14, medium: 21, hard: 30 };
    this.categories = ['animals', 'science', 'geography', 'food', 'technology', 'body', 'general', 'sports', 'household', 'weather', 'vehicles', 'culture', 'emotions'];
    this.categoryMeta = {
      animals: { icon: '🐾', label: 'Animals' },
      science: { icon: '🔬', label: 'Science' },
      geography: { icon: '🌍', label: 'Geography' },
      food: { icon: '🍕', label: 'Food' },
      technology: { icon: '💻', label: 'Tech' },
      body: { icon: '🧑‍⚕️', label: 'Body/Jobs' },
      general: { icon: '✨', label: 'General' },
      sports: { icon: '⚽', label: 'Sports' },
      household: { icon: '🏠', label: 'Home' },
      weather: { icon: '🌤️', label: 'Weather' },
      vehicles: { icon: '🚀', label: 'Vehicles' },
      culture: { icon: '🏛️', label: 'Culture' },
      emotions: { icon: '❤️', label: 'Emotions' }
    };
    this.selectedCategories = new Set(this.categories);
    this.clueLang = 'mixed';
    try { this.clueLang = localStorage.getItem('clueLang') || 'mixed'; } catch(e){}

    this.initDOMElements();
    this.bindEvents();
    this.applyTheme();
    
    // YEN-3: URL Hash parsing
    this.checkHash();
  }

  initDOMElements() {
    this.diffButtons = document.querySelectorAll('.diff-btn');
    this.langButtons = document.querySelectorAll('.lang-btn');
    this.btnGenerate = document.getElementById('btn-generate');
    this.btnToggleSolution = document.getElementById('btn-toggle-solution');
    this.btnPrint = document.getElementById('btn-print');
    
    this.puzzleSheet = document.getElementById('puzzle-sheet');
    this.solutionSheet = document.getElementById('solution-sheet');
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
    
    // Stats
    this.statsWords = document.getElementById('stats-words');
    this.statsGrid = document.getElementById('stats-grid');
    this.statsDensity = document.getElementById('stats-density');
    this.statsIntersections = document.getElementById('stats-intersections');

    // Quick Category Selection Controls
    const quickControls = document.createElement('div');
    quickControls.className = 'cat-quick-actions';
    quickControls.innerHTML = `
      <button type="button" class="cat-quick-btn" id="btn-cat-all" title="Select all categories">✅ All</button>
      <button type="button" class="cat-quick-btn" id="btn-cat-clear" title="Keep minimum 2 categories">❌ Clear</button>
    `;
    this.catContainer.appendChild(quickControls);

    quickControls.querySelector('#btn-cat-all').addEventListener('click', () => {
      this.selectedCategories = new Set(this.categories);
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.add('selected'));
      this.resetSolutionKey();
      this.generateNewPuzzle();
    });

    quickControls.querySelector('#btn-cat-clear').addEventListener('click', () => {
      this.selectedCategories = new Set(this.categories.slice(0, 2));
      document.querySelectorAll('.cat-chip').forEach(c => {
        if (this.selectedCategories.has(c.dataset.cat)) {
          c.classList.add('selected');
        } else {
          c.classList.remove('selected');
        }
      });
      this.showToast('Selected minimum 2 categories (Animals, Science)');
      this.resetSolutionKey();
      this.generateNewPuzzle();
    });

    // Create Category Chips with icons
    this.categories.forEach(cat => {
      const info = this.categoryMeta[cat] || { icon: '🏷️', label: cat };
      const chip = document.createElement('div');
      chip.className = 'cat-chip selected';
      chip.innerHTML = `<span class="chip-icon">${info.icon}</span> <span>${info.label}</span>`;
      chip.dataset.cat = cat;
      chip.addEventListener('click', () => this.toggleCategory(chip, cat));
      this.catContainer.appendChild(chip);
    });
  }

  bindEvents() {
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
      // EKS-3 Reset answer key
      this.resetSolutionKey();
      this.generateNewPuzzle();
    });

    this.btnToggleSolution.addEventListener('click', () => {
      this.toggleSolution();
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
      url.hash = `#seed=${this.currentSeed}&diff=${this.currentDifficulty}&lang=${this.clueLang}&cats=${cats}`;
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
            this.showToast('🔗 Link copied!');
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
            this.showToast('🔗 Link copied!');
          })
          .catch(() => {
            copyFallback(shareUrl);
          });
      } else {
        copyFallback(shareUrl);
      }
    });

    // PDF
    this.btnPdf.addEventListener('click', () => {
      this.exportPdf();
    });
  }

  applyTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.btnTheme.textContent = '☀️';
    }
    // Sync language buttons
    this.langButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.lang === this.clueLang);
    });
  }

  updatePuzzleLanguage() {
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
      if (this.selectedCategories.size <= 2) {
        this.showToast('At least 2 categories must remain selected.');
        return;
      }
      this.selectedCategories.delete(cat);
      chip.classList.remove('selected');
    } else {
      this.selectedCategories.add(cat);
      chip.classList.add('selected');
    }
    this.resetSolutionKey();
    this.generateNewPuzzle();
  }

  resetSolutionKey() {
    this.isSolutionVisible = false;
    this.solutionSheet.classList.remove('visible');
    this.btnToggleSolution.classList.remove('active');
    this.btnToggleSolution.innerHTML = '👁️ Show Answer Key';
    this.pageCountDisplays.forEach(el => el.textContent = '1');
  }

  checkHash() {
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const seed = params.get('seed');
      const diff = params.get('diff');
      const lang = params.get('lang');
      const cats = params.get('cats');
      
      if (diff && this.targetCounts[diff]) {
        this.currentDifficulty = diff;
        this.diffButtons.forEach(b => {
          b.classList.toggle('active', b.dataset.diff === diff);
        });
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
      }
      if (seed) {
        this.generateNewPuzzle(parseInt(seed));
        return;
      }
    }
    this.generateNewPuzzle();
  }

  getFilteredWords() {
    return WORD_BANK.filter(w => this.selectedCategories.has(w.cat));
  }

  generateNewPuzzle(forceSeed = null) {
    // EKS-5 Loading indicator
    const originalText = this.btnGenerate.innerHTML;
    this.btnGenerate.innerHTML = '⏳ Generating...';
    this.btnGenerate.disabled = true;

    setTimeout(() => {
      const targetCount = this.targetCounts[this.currentDifficulty];
      const bank = this.getFilteredWords();
      
      this.currentSeed = forceSeed !== null ? forceSeed : Math.floor(Math.random() * 2147483647);
      const rng = new SeededRandom(this.currentSeed);
      const generator = new CrosswordGenerator(bank, targetCount, rng, this.clueLang);
      
      this.currentPuzzle = generator.generate();

      const puzzleId = '#CW-' + this.currentSeed.toString().substring(0,4);
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

      // Difficulty Score (YEN-8)
      const scoreLabel = this.calculateDifficultyScore(this.currentPuzzle);

      this.puzzleIdDisplay.textContent = puzzleId;
      this.solutionPuzzleIdDisplay.textContent = puzzleId;
      this.puzzleDiffDisplay.textContent = scoreLabel;
      this.solutionDiffDisplay.textContent = scoreLabel;
      this.puzzleDateDisplay.textContent = today;

      this.renderPuzzles();
      
      this.btnGenerate.innerHTML = originalText;
      this.btnGenerate.disabled = false;
      
      if(forceSeed !== null) {
        // clear hash so normal generation works next
        history.replaceState(null, null, window.location.pathname + window.location.search);
      }
    }, 50);
  }

  toggleSolution() {
    this.isSolutionVisible = !this.isSolutionVisible;
    if (this.isSolutionVisible) {
      this.solutionSheet.classList.add('visible');
      this.btnToggleSolution.classList.add('active');
      this.btnToggleSolution.innerHTML = '🔒 Hide Answer Key';
      this.pageCountDisplays.forEach(el => el.textContent = '2');
    } else {
      this.solutionSheet.classList.remove('visible');
      this.btnToggleSolution.classList.remove('active');
      this.btnToggleSolution.innerHTML = '👁️ Show Answer Key';
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
    this.statsWords.textContent = `Words: ${allWords.length} placed`;
    this.statsGrid.textContent = `Grid: ${rows}x${cols}`;
    this.statsDensity.textContent = `Density: ${density}%`;
    this.statsIntersections.textContent = `Intersections: ${intersections}`;
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
    const stars = score <= 3 ? '⭐ Easy' : (score <= 6 ? '⭐⭐ Medium' : '⭐⭐⭐ Hard');
    const diffTitle = this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
    return `${diffTitle} — ${stars} (${score}/10)`;
  }

  batchPrint(count) {
    const container = document.getElementById('batch-container');
    container.innerHTML = '';
    document.body.classList.add('batch-print-active');
    
    const bank = this.getFilteredWords();
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
      // Footer text modification
      const footer = sheet.querySelector('.sheet-footer');
      footer.innerHTML = `<span>Page ${idx+1} of ${count*2} (Puzzles)</span>`;
      
      container.appendChild(sheet);
    });
    
    // Render solutions
    generatedPuzzles.forEach((puzzle, idx) => {
      const sheet = this.solutionSheet.cloneNode(true);
      sheet.id = '';
      sheet.classList.add('visible');
      sheet.querySelector('#solution-puzzle-id').textContent = `Batch #${idx+1}`;

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
      footer.innerHTML = `<span>Page ${count + idx + 1} of ${count*2} (Solutions)</span>`;
      
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
        this.showToast('PDF export requires internet. Use Print button and select "Save as PDF" instead.');
      };
      document.head.appendChild(script);
    } else {
      this._generatePdf();
    }
  }

  _generatePdf() {
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
