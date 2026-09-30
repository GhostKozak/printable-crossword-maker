import { SeededRandom } from "../utils/seeded-random.js";

export class CrosswordGenerator {
  constructor(wordBank, difficultyOrCount = 'medium', rng = null, clueLang = null) {
    const unique = [];
    const seen = new Set();
    for (const w of wordBank) {
      if (!seen.has(w.word)) {
        seen.add(w.word);
        unique.push(w);
      }
    }
    this.wordBank = unique;
    
    if (typeof difficultyOrCount === 'number') {
      this.targetCount = difficultyOrCount;
      if (difficultyOrCount <= 14) this.gridSize = 15;
      else if (difficultyOrCount >= 26) this.gridSize = 18;
      else this.gridSize = 16;
    } else if (difficultyOrCount === 'easy') {
      this.targetCount = 14; this.gridSize = 15;
    } else if (difficultyOrCount === 'hard') {
      this.targetCount = 30; this.gridSize = 18;
    } else {
      this.targetCount = 21; this.gridSize = 16;
    }
    
    this.rng = rng;
    if (clueLang) {
      this.clueLang = clueLang;
    } else {
      try { this.clueLang = localStorage.getItem('clueLang') || 'mixed'; } catch(e){ this.clueLang = 'mixed'; }
    }
  }

  generate() {
    const maxAttempts = 50; 
    let bestPuzzle = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const puzzle = this._generateSingle();
      if (puzzle && puzzle.allWords.length >= Math.max(6, this.targetCount - 5)) {
        if (!bestPuzzle || puzzle.allWords.length > bestPuzzle.allWords.length) {
          bestPuzzle = puzzle;
          if (bestPuzzle.allWords.length >= this.targetCount) {
            break;
          }
        }
      }
    }
    return bestPuzzle || this._generateFallback();
  }

  _generateSingle() {
    if (this.wordBank.length === 0) return null;

    let shuffled;
    if (this.rng) {
      shuffled = this.rng.shuffle(this.wordBank);
    } else {
      shuffled = [...this.wordBank].sort(() => Math.random() - 0.5);
    }
    
    let longs = shuffled.filter(w => w.word.length >= 6);
    let shorts = shuffled.filter(w => w.word.length < 6);
    const candidateWords = [...longs.slice(0, Math.floor(this.targetCount / 3)), ...shorts, ...longs.slice(Math.floor(this.targetCount / 3))].slice(0, this.targetCount * 3);
    
    if (candidateWords.length === 0) return null;

    const grid = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(null));
    const placedWords = [];

    const first = candidateWords[0];
    const startRow = Math.floor(this.gridSize / 2);
    const startCol = Math.floor((this.gridSize - first.word.length) / 2);

    this._placeWordOnGrid(grid, first.word, startRow, startCol, 'across');
    placedWords.push({ word: first.word, clues: first.clues, row: startRow, col: startCol, direction: 'across' });

    let minRow = startRow, maxRow = startRow, minCol = startCol, maxCol = startCol + first.word.length - 1;

    for (let i = 1; i < candidateWords.length; i++) {
      if (placedWords.length >= this.targetCount) break;

      const item = candidateWords[i];
      const bestPos = this._findBestPlacement(grid, item.word, placedWords, minRow, maxRow, minCol, maxCol);

      if (bestPos) {
        this._placeWordOnGrid(grid, item.word, bestPos.row, bestPos.col, bestPos.direction);
        placedWords.push({ word: item.word, clues: item.clues, row: bestPos.row, col: bestPos.col, direction: bestPos.direction });
        
        if (bestPos.direction === 'across') {
           minRow = Math.min(minRow, bestPos.row); maxRow = Math.max(maxRow, bestPos.row);
           minCol = Math.min(minCol, bestPos.col); maxCol = Math.max(maxCol, bestPos.col + item.word.length - 1);
        } else {
           minRow = Math.min(minRow, bestPos.row); maxRow = Math.max(maxRow, bestPos.row + item.word.length - 1);
           minCol = Math.min(minCol, bestPos.col); maxCol = Math.max(maxCol, bestPos.col);
        }
      }
    }

    if (placedWords.length < 5) return null;
    return this._formatPuzzle(grid, placedWords);
  }

  _findBestPlacement(grid, word, placedWords, minRow, maxRow, minCol, maxCol) {
    const matches = [];
    for (let charIndex = 0; charIndex < word.length; charIndex++) {
      const char = word[charIndex];
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          if (grid[r][c] === char) {
            for (const direction of ['across', 'down']) {
              const row = direction === 'across' ? r : r - charIndex;
              const col = direction === 'across' ? c - charIndex : c;
              
              if (this._canPlaceWord(grid, word, row, col, direction)) {
                const score = this._scorePlacement(grid, word, row, col, direction, minRow, maxRow, minCol, maxCol);
                matches.push({ row, col, direction, score });
              }
            }
          }
        }
      }
    }

    if (matches.length === 0) return null;
    matches.sort((a, b) => b.score - a.score);
    return matches[0];
  }

  _canPlaceWord(grid, word, row, col, direction) {
    const len = word.length;
    if (direction === 'across') {
      if (row < 0 || row >= this.gridSize || col < 0 || col + len > this.gridSize) return false;
      if (col > 0 && grid[row][col - 1] !== null) return false;
      if (col + len < this.gridSize && grid[row][col + len] !== null) return false;

      for (let i = 0; i < len; i++) {
        const curr = grid[row][col + i];
        if (curr !== null && curr !== word[i]) return false;
        if (curr === null) {
          if (row > 0 && grid[row - 1][col + i] !== null) return false;
          if (row < this.gridSize - 1 && grid[row + 1][col + i] !== null) return false;
        }
      }
    } else {
      if (row < 0 || row + len > this.gridSize || col < 0 || col >= this.gridSize) return false;
      if (row > 0 && grid[row - 1][col] !== null) return false;
      if (row + len < this.gridSize && grid[row + len][col] !== null) return false;

      for (let i = 0; i < len; i++) {
        const curr = grid[row + i][col];
        if (curr !== null && curr !== word[i]) return false;
        if (curr === null) {
          if (col > 0 && grid[row + i][col - 1] !== null) return false;
          if (col < this.gridSize - 1 && grid[row + i][col + 1] !== null) return false;
        }
      }
    }
    return true;
  }

  _scorePlacement(grid, word, row, col, direction, minRow, maxRow, minCol, maxCol) {
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      if (grid[r][c] === word[i]) intersections++;
    }
    
    let score = 0;
    if (intersections === 1) score += 10;
    if (intersections === 2) score += 35; 
    if (intersections >= 3) score += 85; 

    let newMinRow = minRow, newMaxRow = maxRow, newMinCol = minCol, newMaxCol = maxCol;
    if (direction === 'across') {
       newMinRow = Math.min(newMinRow, row); newMaxRow = Math.max(newMaxRow, row);
       newMinCol = Math.min(newMinCol, col); newMaxCol = Math.max(newMaxCol, col + word.length - 1);
    } else {
       newMinRow = Math.min(newMinRow, row); newMaxRow = Math.max(newMaxRow, row + word.length - 1);
       newMinCol = Math.min(newMinCol, col); newMaxCol = Math.max(newMaxCol, col);
    }
    
    let areaDiff = ((newMaxRow - newMinRow + 1) * (newMaxCol - newMinCol + 1)) - ((maxRow - minRow + 1) * (maxCol - minCol + 1));
    score -= (areaDiff * 2);

    return score;
  }

  _placeWordOnGrid(grid, word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      grid[r][c] = word[i];
    }
  }

  _formatPuzzle(grid, placedWords) {
    const gridRows = grid.length;
    const gridCols = grid[0].length;
    let minR = gridRows, maxR = 0, minC = gridCols, maxC = 0;
    let intersections = 0;
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (grid[r][c] !== null) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
          // check if intersection
          const hasH = (c > 0 && grid[r][c-1] !== null) || (c < gridCols-1 && grid[r][c+1] !== null);
          const hasV = (r > 0 && grid[r-1][c] !== null) || (r < gridRows-1 && grid[r+1][c] !== null);
          if (hasH && hasV) intersections++;
        }
      }
    }

    minR = Math.max(0, minR - 1);
    minC = Math.max(0, minC - 1);
    maxR = Math.min(gridRows - 1, maxR + 1);
    maxC = Math.min(gridCols - 1, maxC + 1);

    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;

    const adjustedWords = placedWords.map(w => {
            const clueLang = this.clueLang || 'mixed';
            let availableClues = [];
            if (clueLang === 'tr' && w.clues && w.clues.tr && w.clues.tr.length > 0) {
              availableClues = w.clues.tr;
            } else if (clueLang === 'en' && w.clues && w.clues.en && w.clues.en.length > 0) {
              availableClues = w.clues.en;
            } else {
              let combined = [...(w.clues && w.clues.tr ? w.clues.tr : []), ...(w.clues && w.clues.en ? w.clues.en : [])];
              availableClues = combined.length ? combined : ["No clue"];
            }
            let randomClue = availableClues[Math.floor(Math.random() * availableClues.length)];
            return {
                ...w,
                clue: randomClue,
                row: w.row - minR,
                col: w.col - minC
            };
        });

    let currentNumber = 1;
    const numberedWords = [];
    const cellNumbers = Array.from({ length: rows }, () => Array(cols).fill(null));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const starting = adjustedWords.filter(w => w.row === r && w.col === c);
        if (starting.length > 0) {
          cellNumbers[r][c] = currentNumber;
          for (const sw of starting) {
            numberedWords.push({
              ...sw,
              number: currentNumber
            });
          }
          currentNumber++;
        }
      }
    }

    const finalGrid = [];
    for (let r = minR; r <= maxR; r++) {
      const rowData = [];
      for (let c = minC; c <= maxC; c++) {
        const letter = grid[r][c];
        const num = cellNumbers[r - minR][c - minC];
        rowData.push({
          letter: letter,
          number: num,
          isBlocked: letter === null
        });
      }
      finalGrid.push(rowData);
    }

    const acrossClues = numberedWords.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
    const downClues = numberedWords.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);

    return {
      rows, cols, grid: finalGrid,
      acrossClues, downClues,
      allWords: numberedWords.sort((a, b) => a.number - b.number),
      intersections
    };
  }

  _generateFallback() {
    const fallbackWords = [
      { word: "ELEPHANT", clues: {en: ["Largest land mammal with a long trunk"], tr: ["Uzun hortumlu dev memeli"]}, row: 7, col: 3, direction: 'across' },
      { word: "PLANET", clues: {en: ["Celestial body orbiting a star"], tr: ["Yıldız etrafında dönen gök cismi"]}, row: 5, col: 3, direction: 'down' }
    ];
    const grid = Array.from({ length: 15 }, () => Array(15).fill(null));
    for (const w of fallbackWords) {
      this._placeWordOnGrid(grid, w.word, w.row, w.col, w.direction);
    }
    return this._formatPuzzle(grid, fallbackWords);
  }
}
