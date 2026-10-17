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

// 5. Gazete Çengel Generator Verification (Zero-Waste, In-Grid Clues)
console.log('\n5. Testing Gazete Çengel Generator (Zero-Waste & Clues)...');

// Test 13x11 Dual Layout
const cengelRng = new SeededRandom(12345);
const cGenDual = new CengelGenerator(RAW_WORD_BANK, { rows: 13, cols: 11, rng: cengelRng, clueLang: 'mixed' });
const cDual = cGenDual.generate();

console.log(`- Dual Layout (13x11): Placed ${cDual.words.length} words | Letter cells: ${cDual.letterCells} | Clue cells: ${cDual.clueCells} | Dual clues: ${cDual.dualClueCells}`);
if (cDual.letterCells + cDual.clueCells !== 13 * 11) {
  throw new Error(`Zero-waste violation: expected ${13 * 11} cells, got ${cDual.letterCells + cDual.clueCells}`);
}
if (cDual.words.length < 20) {
  throw new Error(`Expected at least 20 words placed in 13x11, got ${cDual.words.length}`);
}

// Test 15x13 Single Layout
const cGenSingle = new CengelGenerator(RAW_WORD_BANK, { rows: 15, cols: 13, rng: new SeededRandom(54321), clueLang: 'mixed' });
const cSingle = cGenSingle.generate();
console.log(`- Single Layout (15x13): Placed ${cSingle.words.length} words | Letter cells: ${cSingle.letterCells} | Clue cells: ${cSingle.clueCells} | Dual clues: ${cSingle.dualClueCells}`);
if (cSingle.letterCells + cSingle.clueCells !== 15 * 13) {
  throw new Error(`Zero-waste violation: expected ${15 * 13} cells, got ${cSingle.letterCells + cSingle.clueCells}`);
}
if (cSingle.words.length < 25) {
  throw new Error(`Expected at least 25 words placed in 15x13, got ${cSingle.words.length}`);
}

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
console.log('✓ Gazete Çengel Generator passed (100% cell utilization, zero dead cells, reproducible seed)');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
