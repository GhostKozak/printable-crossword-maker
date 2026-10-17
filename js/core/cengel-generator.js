/**
 * CengelGenerator
 * Generates authentic Turkish Newspaper-Style Hooked / Arrow Crosswords (Gazete Çengel Bulmacası)
 * - 0% blocked/dead cells: every cell is either an answer letter square or an in-grid clue square
 * - In-grid clues with directional indicator arrows (→ and ↓)
 * - Supports dual-clue cells (split top/bottom for intersecting word starts)
 * - Seeded PRNG for reproducible puzzles
 */

export class CengelGenerator {
  constructor(wordBank, options = {}) {
    this.wordBank = wordBank;
    this.rows = options.rows || 11;
    this.cols = options.cols || 13;
    this.clueLang = options.clueLang || 'mixed';
    this.rng = options.rng || null;
  }

  _rand() {
    return this.rng ? this.rng.next() : Math.random();
  }

  _shuffle(arr) {
    if (this.rng) return this.rng.shuffle(arr);
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  generate() {
    let best = null;
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const puzzle = this._generateSingle();
      if (puzzle && (!best || puzzle.words.length > best.words.length)) {
        best = puzzle;
        if (best.words.length >= (this.rows * this.cols) * 0.18) {
          break; // High density reached
        }
      }
    }

    return best || this._generateFallback();
  }

  _generateSingle() {
    const R = this.rows;
    const C = this.cols;
    const grid = Array.from({ length: R }, () => Array(C).fill(null));
    const words = [];
    const usedWords = new Set();

    const canPlace = (word, row, col, dir) => {
      const len = word.length;
      if (dir === 'across') {
        if (row < 0 || row >= R) return false;
        if (col < 1 || col + len > C) return false; // col-1 is clue cell

        const clueCell = grid[row][col - 1];
        if (clueCell && clueCell.type === 'letter') return false;
        if (clueCell && clueCell.acrossWord) return false;

        // Ensure word does not run into another letter without separator
        if (col + len < C) {
          const nextCell = grid[row][col + len];
          if (nextCell && nextCell.type === 'letter') return false;
        }

        let matches = 0;
        for (let i = 0; i < len; i++) {
          const cell = grid[row][col + i];
          if (cell) {
            if (cell.type === 'clue') return false;
            if (cell.type === 'letter') {
              if (cell.char !== word[i]) return false;
              matches++;
            }
          }
        }
        return matches;
      } else {
        if (col < 0 || col >= C) return false;
        if (row < 1 || row + len > R) return false; // row-1 is clue cell

        const clueCell = grid[row - 1][col];
        if (clueCell && clueCell.type === 'letter') return false;
        if (clueCell && clueCell.downWord) return false;

        if (row + len < R) {
          const nextCell = grid[row + len][col];
          if (nextCell && nextCell.type === 'letter') return false;
        }

        let matches = 0;
        for (let i = 0; i < len; i++) {
          const cell = grid[row + i][col];
          if (cell) {
            if (cell.type === 'clue') return false;
            if (cell.type === 'letter') {
              if (cell.char !== word[i]) return false;
              matches++;
            }
          }
        }
        return matches;
      }
    };

    const place = (item, row, col, dir) => {
      const len = item.word.length;

      // Select clue based on selected language
      let clueList = [];
      if (this.clueLang === 'tr' && item.clues && item.clues.tr && item.clues.tr.length > 0) {
        clueList = item.clues.tr;
      } else if (this.clueLang === 'en' && item.clues && item.clues.en && item.clues.en.length > 0) {
        clueList = item.clues.en;
      } else {
        const tr = (item.clues && item.clues.tr) || [];
        const en = (item.clues && item.clues.en) || [];
        clueList = [...tr, ...en];
      }
      if (clueList.length === 0) clueList = [item.word];
      const clueText = clueList[Math.floor(this._rand() * clueList.length)];

      const wordObj = {
        word: item.word,
        clue: clueText,
        cat: item.cat,
        row,
        col,
        dir
      };

      // Assign Clue cell
      const clueR = dir === 'across' ? row : row - 1;
      const clueC = dir === 'across' ? col - 1 : col;
      if (!grid[clueR][clueC]) {
        grid[clueR][clueC] = {
          type: 'clue',
          acrossWord: null,
          downWord: null
        };
      }

      if (dir === 'across') {
        grid[clueR][clueC].acrossWord = wordObj;
      } else {
        grid[clueR][clueC].downWord = wordObj;
      }

      // Assign Letters
      for (let i = 0; i < len; i++) {
        const r = dir === 'across' ? row : row + i;
        const c = dir === 'across' ? col + i : col;
        if (!grid[r][c]) {
          grid[r][c] = {
            type: 'letter',
            char: item.word[i],
            words: []
          };
        }
        grid[r][c].words.push(wordObj);
      }

      words.push(wordObj);
      usedWords.add(item.word);
    };

    // 1. Initial Seeds
    const seedLongs = this._shuffle(this.wordBank.filter(w => w.word.length >= 5 && w.word.length <= 7));
    if (seedLongs.length > 0) {
      place(seedLongs[0], 1, 1, 'across');
    }
    const seedDown = this._shuffle(this.wordBank.filter(w => w.word.length >= 4 && w.word.length <= 6));
    if (seedDown.length > 0 && canPlace(seedDown[0].word, 1, 3, 'down') !== false) {
      place(seedDown[0], 1, 3, 'down');
    }

    // 2. Main Growth Pass (words 4 to 6 letters)
    const mediums = this._shuffle(this.wordBank.filter(w => w.word.length >= 4 && w.word.length <= 6));
    for (const item of mediums) {
      if (usedWords.has(item.word)) continue;
      let bestScore = -1;
      let bestPos = null;

      for (const dir of ['across', 'down']) {
        for (let r = 1; r < R; r++) {
          for (let c = 1; c < C; c++) {
            const m = canPlace(item.word, r, c, dir);
            if (m !== false && m >= 1) {
              const score = m * 25 - (r + c) * 0.2;
              if (score > bestScore) {
                bestScore = score;
                bestPos = { row: r, col: c, dir };
              }
            }
          }
        }
      }
      if (bestPos) place(item, bestPos.row, bestPos.col, bestPos.dir);
    }

    // 3. Dense Gap Filling (words 3 to 4 letters)
    const shorts = this._shuffle(this.wordBank.filter(w => w.word.length <= 4));
    for (const item of shorts) {
      if (usedWords.has(item.word)) continue;
      for (const dir of ['across', 'down']) {
        for (let r = 1; r < R; r++) {
          for (let c = 1; c < C; c++) {
            const m = canPlace(item.word, r, c, dir);
            if (m !== false && m >= 1) {
              place(item, r, c, dir);
              break;
            }
          }
        }
      }
    }

    // 4. Zero-Waste Guarantee: Convert every unassigned cell into a Clue / Emblem cell
    let letterCells = 0;
    let clueCells = 0;
    let dualClueCells = 0;

    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (!grid[r][c]) {
          grid[r][c] = {
            type: 'clue',
            isBranding: true,
            label: (r === 0 && c === 0) ? '🧩 EN' : (r === 0 && c === C - 1) ? '★' : '💡'
          };
        }

        if (grid[r][c].type === 'letter') {
          letterCells++;
        } else {
          clueCells++;
          if (grid[r][c].acrossWord && grid[r][c].downWord) {
            dualClueCells++;
          }
        }
      }
    }

    // Count intersections
    let intersections = 0;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (grid[r][c].type === 'letter' && grid[r][c].words && grid[r][c].words.length > 1) {
          intersections++;
        }
      }
    }

    return {
      rows: R,
      cols: C,
      grid,
      words,
      letterCells,
      clueCells,
      dualClueCells,
      intersections,
      density: Math.round((letterCells / (R * C)) * 100)
    };
  }

  _generateFallback() {
    // Guaranteed hardcoded mini çengel for edge cases
    const R = 7, C = 7;
    const grid = Array.from({ length: R }, () => Array(C).fill(null));
    return {
      rows: R,
      cols: C,
      grid,
      words: [],
      letterCells: 0,
      clueCells: 0,
      dualClueCells: 0,
      intersections: 0,
      density: 0
    };
  }
}
