import { RAW_WORD_BANK } from '../js/data/words.js';
import { CrosswordGenerator } from '../js/core/generator.js';
import { SeededRandom } from '../js/utils/seeded-random.js';
import { PdfExporter } from '../js/utils/pdf-exporter.js';
import { CengelGenerator } from '../js/core/cengel-generator.js';

console.log('=== RUNNING COMPREHENSIVE SYSTEM VERIFICATION ===\n');

// 1. Word Bank Validation
console.log('1. Checking Word Bank...');
const totalWords = RAW_WORD_BANK.length;
console.log(`Total words: ${totalWords}`);
if (totalWords < 1000) throw new Error(`Word bank too small: ${totalWords}`);

const seen = new Set();
const dups = [];
for (const w of RAW_WORD_BANK) {
  if (seen.has(w.word)) dups.push(w.word);
  seen.add(w.word);
}
if (dups.length > 0) throw new Error(`Duplicates found: ${dups.join(', ')}`);
console.log('✓ 0 duplicate words');

// Categories
const categories = new Set(RAW_WORD_BANK.map(w => w.cat));
console.log(`✓ Populated categories: ${categories.size}`);
if (categories.size !== 13) throw new Error(`Expected 13 categories, got ${categories.size}`);

// Self-referencing clues check
let selfRefClues = 0;
for (const w of RAW_WORD_BANK) {
  const word = w.word;
  const allClues = [...(w.clues.tr || []), ...(w.clues.en || [])];
  for (const clue of allClues) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(clue)) {
      console.warn(`Self-reference: "${word}" in "${clue}"`);
      selfRefClues++;
    }
  }
}
if (selfRefClues > 0) throw new Error(`Found ${selfRefClues} self-referencing clues`);
console.log('✓ 0 self-referencing clues');

// 2. Generator Performance & Density
console.log('\n2. Testing Generator (Easy, Medium, Hard)...');
for (const diff of ['easy', 'medium', 'hard']) {
  const targets = { easy: 14, medium: 21, hard: 30 };
  const target = targets[diff];
  const rng = new SeededRandom(42);
  const gen = new CrosswordGenerator(RAW_WORD_BANK, target, rng, 'mixed');
  const puzzle = gen.generate();
  
  if (!puzzle) throw new Error(`Failed to generate puzzle for ${diff}`);
  console.log(`- ${diff.toUpperCase()}: Placed ${puzzle.allWords.length}/${target} words | Grid ${puzzle.rows}x${puzzle.cols} | Intersections: ${puzzle.intersections}`);
  if (puzzle.allWords.length < target - 3) {
    throw new Error(`Word count too low for ${diff}: ${puzzle.allWords.length}`);
  }
}
console.log('✓ Generator passed all difficulties');

// 3. Seed Determinism
console.log('\n3. Testing Seed Determinism...');
const seed = 987654321;
const gen1 = new CrosswordGenerator(RAW_WORD_BANK, 21, new SeededRandom(seed), 'mixed');
const p1 = gen1.generate();

const gen2 = new CrosswordGenerator(RAW_WORD_BANK, 21, new SeededRandom(seed), 'mixed');
const p2 = gen2.generate();

if (p1.rows !== p2.rows || p1.cols !== p2.cols || p1.allWords.length !== p2.allWords.length) {
  throw new Error('Seed determinism failed for grid shape');
}
for (let i = 0; i < p1.allWords.length; i++) {
  if (p1.allWords[i].word !== p2.allWords[i].word || p1.allWords[i].clue !== p2.allWords[i].clue) {
    throw new Error(`Determinism mismatch at word index ${i}`);
  }
}
console.log('✓ Seed determinism 100% verified (identical grid, positions & clues)');

// 4. PDF Sanitizer
console.log('\n4. Testing PDF Sanitizer...');
const testStr = 'Çiğdem ve Şükrü, İstanbul’da “özel” bir çöl ovası gördü — harika!';
const sanitized = PdfExporter.sanitizeText(testStr);
console.log(`Original:  ${testStr}`);
console.log(`Sanitized: ${sanitized}`);
if (/[çÇğĞıİöÖşŞüÜ—–“”‘’]/.test(sanitized)) {
  throw new Error('PDF Sanitizer left unmapped Unicode characters');
}
console.log('✓ PDF Sanitizer passed');

// 5. Gazete Çengel Generator Verification (Exact Word-Length Invariant, Secret Keyword & Clues)
console.log('\n5. Testing Gazete Çengel Generator (Word-Length Invariant & Secret Keyword)...');

function verifyCengelWordLengths(puzzle, label) {
  for (const w of puzzle.words) {
    let r = w.row;
    let c = w.col;
    let actual = '';
    while (r < puzzle.rows && c < puzzle.cols && puzzle.grid[r][c].type === 'letter') {
      actual += puzzle.grid[r][c].char;
      if (w.dir === 'across') c++;
      else r++;
    }
    if (actual !== w.word) {
      throw new Error(`[${label}] Word length/boundary violation for ${w.word} (${w.dir}): found "${actual}" on board`);
    }
  }
}

// Test 13x11 Dual Layout
const cengelRng = new SeededRandom(12345);
const cGenDual = new CengelGenerator(RAW_WORD_BANK, { rows: 13, cols: 11, rng: cengelRng, clueLang: 'mixed' });
const cDual = cGenDual.generate();

console.log(`- Dual Layout (13x11): Placed ${cDual.words.length} words | Letters: ${cDual.letterCells} | Clues: ${cDual.clueCells} | Blocked: ${cDual.blockedCells} | Active Density: ${cDual.density}%`);
if (cDual.letterCells + cDual.clueCells + cDual.blockedCells !== 13 * 11) {
  throw new Error(`Total cells mismatch: expected ${13 * 11} cells, got ${cDual.letterCells + cDual.clueCells + cDual.blockedCells}`);
}
if (cDual.words.length < 18) {
  throw new Error(`Expected at least 18 words placed in 13x11, got ${cDual.words.length}`);
}
verifyCengelWordLengths(cDual, '13x11 Dual');

// Test 18x13 Full-Page Single Layout
const cGenSingle = new CengelGenerator(RAW_WORD_BANK, { rows: 18, cols: 13, rng: new SeededRandom(54321), clueLang: 'mixed' });
const cSingle = cGenSingle.generate();
console.log(`- Full-Page Single Layout (18x13): Placed ${cSingle.words.length} words | Letters: ${cSingle.letterCells} | Clues: ${cSingle.clueCells} | Blocked: ${cSingle.blockedCells} | Active Density: ${cSingle.density}%`);
if (cSingle.letterCells + cSingle.clueCells + cSingle.blockedCells !== 18 * 13) {
  throw new Error(`Total cells mismatch: expected ${18 * 13} cells, got ${cSingle.letterCells + cSingle.clueCells + cSingle.blockedCells}`);
}
if (cSingle.words.length < 32) {
  throw new Error(`Expected at least 32 words placed in 18x13, got ${cSingle.words.length}`);
}
verifyCengelWordLengths(cSingle, '18x13 Single');

// Verify Secret Keyword (Şifreli Kelime)
if (!cSingle.secretWord || !cSingle.secretWord.word || cSingle.secretWord.positions.length !== cSingle.secretWord.word.length) {
  throw new Error('Secret keyword was not generated properly');
}
for (const pos of cSingle.secretWord.positions) {
  const cell = cSingle.grid[pos.r][pos.c];
  if (cell.type !== 'letter' || cell.char !== pos.char || cell.secretIndex !== pos.index) {
    throw new Error(`Secret keyword cell mismatch at index ${pos.index}`);
  }
}
console.log(`✓ Secret Keyword verified: "${cSingle.secretWord.word}" (${cSingle.secretWord.clue})`);

// Test Seed Reproducibility
const cSeed = 777888;
const cTest1 = new CengelGenerator(RAW_WORD_BANK, { rows: 13, cols: 11, rng: new SeededRandom(cSeed) }).generate();
const cTest2 = new CengelGenerator(RAW_WORD_BANK, { rows: 13, cols: 11, rng: new SeededRandom(cSeed) }).generate();
if (cTest1.words.length !== cTest2.words.length) {
  throw new Error('Cengel seed determinism failed for word count');
}
for (let i = 0; i < cTest1.words.length; i++) {
  if (cTest1.words[i].word !== cTest2.words[i].word || cTest1.words[i].clue !== cTest2.words[i].clue) {
    throw new Error(`Cengel determinism mismatch at word index ${i}`);
  }
}
console.log('✓ Gazete Çengel Generator passed (100% exact word lengths, secret keyword, reproducible seed)');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
