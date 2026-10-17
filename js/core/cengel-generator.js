/**
 * CengelGenerator
 * Generates authentic Turkish Newspaper-Style Hooked / Arrow Crosswords (Gazete Çengel Bulmacası)
 * - Strict End-Stop & Same-Direction Invariants: every word has an exact, unambiguous length
 * - Chained Clue Placement: prioritizes placing new clue cells at the end-stop of previous words
 * - Shortest-Clue Priority for optimal fit inside grid squares
 * - Supports dual-clue cells (split top/bottom for intersecting word starts)
 * - Generates a Secret Keyword (Şifreli Kelime) from numbered grid letters
 * - Seeded PRNG for 100% reproducible puzzles
 */

export class CengelGenerator {
  constructor(wordBank, options = {}) {
    const unique = [];
    const seen = new Set();
    for (const w of wordBank) {
      if (!seen.has(w.word)) {
        seen.add(w.word);
        unique.push(w);
      }
    }
    this.wordBank = unique;
    this.rows = options.rows || 16;
    this.cols = options.cols || 12;
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

  /**
   * Selects the most concise, fitting clue for in-grid display.
   */
  static pickBestClue(cluesObj, clueLang = 'mixed', randFn = Math.random, isDual = false) {
    if (!cluesObj) return 'İpucu yok';
    let pool = [];
    if (clueLang === 'tr' && cluesObj.tr && cluesObj.tr.length > 0) {
      pool = [...cluesObj.tr];
    } else if (clueLang === 'en' && cluesObj.en && cluesObj.en.length > 0) {
      pool = [...cluesObj.en];
    } else {
      const tr = cluesObj.tr || [];
      const en = cluesObj.en || [];
      pool = [...tr, ...en];
    }
    if (pool.length === 0) return 'İpucu';

    const maxPreferredLen = isDual ? 22 : 30;
    const shortClues = pool.filter(c => c.length <= maxPreferredLen);
    if (shortClues.length > 0) {
      return shortClues[Math.floor(randFn() * shortClues.length)];
    }
    pool.sort((a, b) => a.length - b.length);
    return pool[0];
  }

  generate() {
    let best = null;
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const puzzle = this._generateSingle();
      if (puzzle && (!best || puzzle.letterCells > best.letterCells)) {
        best = puzzle;
        if (best.letterCells >= (this.rows * this.cols) * 0.68) {
          break;
        }
      }
    }

    return best || this._generateFallback();
  }

  _generateSingle() {
    if (this.wordBank.length === 0) return null;

    const R = this.rows;
    const C = this.cols;
    const grid = Array.from({ length: R }, () => Array(C).fill(null));
    // Track cells that must NOT become letters because an earlier word terminates right before them
    const endStops = Array.from({ length: R }, () => Array(C).fill(false));
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

        // Cell immediately after word must not be a letter
        if (col + len < C) {
          const nextCell = grid[row][col + len];
          if (nextCell && nextCell.type === 'letter') return false;
        }

        let matches = 0;
        for (let i = 0; i < len; i++) {
          const r = row;
          const c = col + i;
          if (endStops[r][c]) return false; // Cannot overwrite another word's end-stop with a letter
          const cell = grid[r][c];
          if (cell) {
            if (cell.type !== 'letter') return false;
            if (cell.char !== word[i]) return false;
            if (cell.words.some(w => w.dir === 'across')) return false;
            matches++;
          }
        }
        return matches;
      } else {
        if (col < 0 || col >= C) return false;
        if (row < 1 || row + len > R) return false; // row-1 is clue cell

        const clueCell = grid[row - 1][col];
        if (clueCell && clueCell.type === 'letter') return false;
        if (clueCell && clueCell.downWord) return false;

        // Cell immediately after word must not be a letter
        if (row + len < R) {
          const nextCell = grid[row + len][col];
          if (nextCell && nextCell.type === 'letter') return false;
        }

        let matches = 0;
        for (let i = 0; i < len; i++) {
          const r = row + i;
          const c = col;
          if (endStops[r][c]) return false; // Cannot overwrite another word's end-stop with a letter
          const cell = grid[r][c];
          if (cell) {
            if (cell.type !== 'letter') return false;
            if (cell.char !== word[i]) return false;
            if (cell.words.some(w => w.dir === 'down')) return false;
            matches++;
          }
        }
        return matches;
      }
    };

    const place = (item, row, col, dir) => {
      const len = item.word.length;
      const clueR = dir === 'across' ? row : row - 1;
      const clueC = dir === 'across' ? col - 1 : col;
      const willBeDual = Boolean(grid[clueR][clueC] && (grid[clueR][clueC].acrossWord || grid[clueR][clueC].downWord));

      const clueText = CengelGenerator.pickBestClue(item.clues, this.clueLang, () => this._rand(), willBeDual);

      const wordObj = {
        word: item.word,
        clues: item.clues,
        clue: clueText,
        cat: item.cat,
        row,
        col,
        dir
      };

      // Assign Clue cell
      if (!grid[clueR][clueC]) {
        grid[clueR][clueC] = {
          type: 'clue',
          acrossWord: null,
          downWord: null
        };
      }

      if (dir === 'across') {
        grid[clueR][clueC].acrossWord = wordObj;
        if (grid[clueR][clueC].downWord) {
          grid[clueR][clueC].downWord.clue = CengelGenerator.pickBestClue(
            grid[clueR][clueC].downWord.clues,
            this.clueLang,
            () => this._rand(),
            true
          );
        }
        // Mark end-stop cell after across word
        if (col + len < C) {
          endStops[row][col + len] = true;
        }
      } else {
        grid[clueR][clueC].downWord = wordObj;
        if (grid[clueR][clueC].acrossWord) {
          grid[clueR][clueC].acrossWord.clue = CengelGenerator.pickBestClue(
            grid[clueR][clueC].acrossWord.clues,
            this.clueLang,
            () => this._rand(),
            true
          );
        }
        // Mark end-stop cell after down word
        if (row + len < R) {
          endStops[row + len][col] = true;
        }
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

    // 1. Initial Seeds (Start at row 1, col 1 so row 0 and col 0 can host intersecting clue cells)
    const seedLongs = this._shuffle(this.wordBank.filter(w => w.word.length >= 5 && w.word.length <= 7));
    if (seedLongs.length > 0) {
      place(seedLongs[0], 1, 1, 'across');
    }
    const seedDown = this._shuffle(this.wordBank.filter(w => w.word.length >= 4 && w.word.length <= 6));
    for (const sd of seedDown) {
      if (!usedWords.has(sd.word) && canPlace(sd.word, 1, 2, 'down') !== false) {
        place(sd, 1, 2, 'down');
        break;
      }
    }

    // 2. Main Intersecting Growth Pass (4 to 7 letters)
    const mediums = this._shuffle(this.wordBank.filter(w => w.word.length >= 4 && w.word.length <= 7));
    for (let pass = 0; pass < 2; pass++) {
      for (const item of mediums) {
        if (usedWords.has(item.word)) continue;
        let bestScore = -1;
        let bestPos = null;

        for (const dir of ['across', 'down']) {
          const startR = dir === 'across' ? 0 : 1;
          const startC = dir === 'across' ? 1 : 0;
          for (let r = startR; r < R; r++) {
            for (let c = startC; c < C; c++) {
              const m = canPlace(item.word, r, c, dir);
              if (m !== false && m >= 1) {
                const clueR = dir === 'across' ? r : r - 1;
                const clueC = dir === 'across' ? c - 1 : c;
                const sharesClue = grid[clueR][clueC] && grid[clueR][clueC].type === 'clue' ? 15 : 0;
                const usesEndStop = endStops[clueR][clueC] ? 20 : 0;
                const score = m * 25 + sharesClue + usesEndStop - (r + c) * 0.15;
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
    }

    // 3. Dense Gap Filling (3 to 4 letters, intersecting)
    const shorts = this._shuffle(this.wordBank.filter(w => w.word.length <= 4));
    for (const item of shorts) {
      if (usedWords.has(item.word)) continue;
      for (const dir of ['across', 'down']) {
        const startR = dir === 'across' ? 0 : 1;
        const startC = dir === 'across' ? 1 : 0;
        let placed = false;
        for (let r = startR; r < R && !placed; r++) {
          for (let c = startC; c < C && !placed; c++) {
            const m = canPlace(item.word, r, c, dir);
            if (m !== false && m >= 1) {
              place(item, r, c, dir);
              placed = true;
            }
          }
        }
        if (placed) break;
      }
    }

    // 4. Pocket Filling (Fill any remaining open spaces where a word + clue can legally fit)
    const allShortMed = this._shuffle(this.wordBank.filter(w => w.word.length >= 3 && w.word.length <= 5));
    for (const item of allShortMed) {
      if (usedWords.has(item.word)) continue;
      for (const dir of ['across', 'down']) {
        const startR = dir === 'across' ? 0 : 1;
        const startC = dir === 'across' ? 1 : 0;
        let placed = false;
        for (let r = startR; r < R && !placed; r++) {
          for (let c = startC; c < C && !placed; c++) {
            const m = canPlace(item.word, r, c, dir);
            if (m !== false && m >= 0) {
              place(item, r, c, dir);
              placed = true;
            }
          }
        }
        if (placed) break;
      }
    }

    // 5. Convert remaining unassigned cells into blocked (hatched/taralı) cells
    let letterCells = 0;
    let clueCells = 0;
    let dualClueCells = 0;
    let blockedCells = 0;

    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (!grid[r][c]) {
          grid[r][c] = {
            type: 'blocked',
            isBlocked: true
          };
        }

        if (grid[r][c].type === 'letter') {
          letterCells++;
        } else if (grid[r][c].type === 'clue') {
          clueCells++;
          if (grid[r][c].acrossWord && grid[r][c].downWord) {
            dualClueCells++;
          }
        } else {
          blockedCells++;
        }
      }
    }

    // 6. Count intersections
    let intersections = 0;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (grid[r][c].type === 'letter' && grid[r][c].words && grid[r][c].words.length > 1) {
          intersections++;
        }
      }
    }

    // 7. Generate Secret Keyword (Şifreli Anahtar Kelime)
    const secretWord = this._generateSecretWord(grid, R, C, usedWords);

    const activeDensity = Math.round(((letterCells + clueCells) / (R * C)) * 100);

    return {
      rows: R,
      cols: C,
      grid,
      words,
      letterCells,
      clueCells,
      dualClueCells,
      blockedCells,
      intersections,
      density: activeDensity,
      secretWord
    };
  }

  _generateSecretWord(grid, R, C, usedWords) {
    const letterCoordsByChar = {};
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (grid[r][c] && grid[r][c].type === 'letter') {
          const ch = grid[r][c].char;
          if (!letterCoordsByChar[ch]) letterCoordsByChar[ch] = [];
          letterCoordsByChar[ch].push({ r, c });
        }
      }
    }

    const candidates = this._shuffle(
      this.wordBank.filter(w => !usedWords.has(w.word) && w.word.length >= 5 && w.word.length <= 7)
    );

    for (const cand of candidates) {
      const usedCoords = new Set();
      const mapping = [];
      let possible = true;

      for (let i = 0; i < cand.word.length; i++) {
        const ch = cand.word[i];
        const coords = letterCoordsByChar[ch] || [];
        const available = coords.find(pt => !usedCoords.has(`${pt.r},${pt.c}`));
        if (!available) {
          possible = false;
          break;
        }
        usedCoords.add(`${available.r},${available.c}`);
        mapping.push({ index: i + 1, char: ch, r: available.r, c: available.c });
      }

      if (possible) {
        for (const m of mapping) {
          grid[m.r][m.c].secretIndex = m.index;
        }
        return {
          word: cand.word,
          clue: CengelGenerator.pickBestClue(cand.clues, this.clueLang, () => this._rand(), false),
          clues: cand.clues,
          positions: mapping,
          mapping
        };
      }
    }

    return null;
  }

  _generateFallback() {
    const R = 7, C = 7;
    const grid = Array.from({ length: R }, () => Array(C).fill({ type: 'blocked', isBlocked: true }));
    return {
      rows: R,
      cols: C,
      grid,
      words: [],
      letterCells: 0,
      clueCells: 0,
      dualClueCells: 0,
      blockedCells: R * C,
      intersections: 0,
      density: 0,
      secretWord: null
    };
  }
}
