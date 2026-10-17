/**
 * PdfExporter
 * Handles vector PDF generation for A4 crossword and Gazete Çengel worksheets using jsPDF.
 * Includes full Unicode / Turkish character sanitization for standard PDF fonts.
 */

const TR_CHAR_MAP = {
  'ç': 'c', 'Ç': 'C',
  'ğ': 'g', 'Ğ': 'G',
  'ı': 'i', 'İ': 'I',
  'ö': 'o', 'Ö': 'O',
  'ş': 's', 'Ş': 'S',
  'ü': 'u', 'Ü': 'U',
  'â': 'a', 'Â': 'A',
  'î': 'i', 'Î': 'I',
  'û': 'u', 'Û': 'U',
  '—': '-', '–': '-',
  '“': '"', '”': '"',
  '‘': "'", '’': "'",
  '…': '...'
};

export class PdfExporter {
  /**
   * Sanitizes UTF-8 strings (especially Turkish characters and smart punctuation)
   * so jsPDF standard Helvetica font renders them cleanly withoutmojibake.
   */
  static sanitizeText(str) {
    if (!str) return '';
    return String(str).replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ—–“”‘’…]/g, ch => TR_CHAR_MAP[ch] || ch);
  }

  /**
   * Draws clean 45-degree parallel diagonal hatch lines inside a square cell.
   */
  static drawHatchedCell(doc, x, y, cellW, step = 2.0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, cellW, cellW, 'FD');

    doc.setDrawColor(110, 110, 110);
    doc.setLineWidth(0.2);
    for (let offset = -cellW; offset <= cellW; offset += step) {
      const uMin = Math.max(0, offset);
      const uMax = Math.min(cellW, cellW + offset);
      const vMin = uMin - offset;
      const vMax = uMax - offset;
      if (uMin < uMax) {
        doc.line(x + uMin, y + vMin, x + uMax, y + vMax);
      }
    }
  }

  /**
   * Generates and downloads the Classic Crossword PDF.
   */
  static export(puzzle, options = {}) {
    if (!window.jspdf) {
      throw new Error('jsPDF library not loaded');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const puzzleId = options.puzzleId || '#CW-001';
    const difficulty = this.sanitizeText(options.difficulty || 'Medium');
    const title = this.sanitizeText(options.title || 'English Crossword');
    const subtitle = this.sanitizeText(options.subtitle || 'Vocabulary & General Knowledge');
    const isSolutionVisible = options.isSolutionVisible || false;
    const dateStr = this.sanitizeText(options.date || new Date().toLocaleDateString('en-US'));

    const renderPage = (isSol) => {
      // Header Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(isSol ? `${title} - Answer Key` : title, 15, 18);

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text(isSol ? 'Solutions for Teachers & Self-Checking' : subtitle, 15, 23.5);

      if (!isSol) {
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        doc.text('Name: _______________________      Score: ______ / 100', 15, 30);
      }

      // Meta Box (Top Right)
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text(`Puzzle ID: ${this.sanitizeText(puzzleId)}`, 195, 16, { align: 'right' });
      doc.text(`Difficulty: ${difficulty}`, 195, 21, { align: 'right' });
      doc.text(`Date: ${dateStr}`, 195, 26, { align: 'right' });

      // Divider Line
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.5);
      doc.line(15, 33, 195, 33);

      // Grid Sizing
      const maxGridW = 160;
      const maxGridH = 115;
      const cellW = Math.min(maxGridW / puzzle.cols, maxGridH / puzzle.rows, 9.5);
      const gridW = puzzle.cols * cellW;
      const startX = (210 - gridW) / 2;
      const startY = 38;

      doc.setLineWidth(0.4);
      doc.setDrawColor(40, 40, 40);

      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const cell = puzzle.grid[r][c];
          const x = startX + c * cellW;
          const y = startY + r * cellW;

          if (cell.isBlocked) {
            this.drawHatchedCell(doc, x, y, cellW, 1.8);
            doc.setDrawColor(40, 40, 40);
            doc.setLineWidth(0.4);
          } else {
            doc.setFillColor(255, 255, 255);
            doc.rect(x, y, cellW, cellW, 'FD');

            if (cell.number) {
              doc.setFontSize(cellW > 7 ? 6 : 5);
              doc.setTextColor(50, 50, 50);
              doc.text(cell.number.toString(), x + 0.8, y + (cellW > 7 ? 2.5 : 2.0));
            }

            if ((isSol || cell.isHint) && cell.letter) {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(cellW > 7 ? 11 : 9.5);
              if (isSol) {
                doc.setTextColor(20, 20, 20);
              } else {
                doc.setTextColor(120, 130, 145);
              }
              doc.text(cell.letter, x + cellW / 2, y + cellW / 2 + (cellW > 7 ? 1.5 : 1.2), { align: 'center' });
              doc.setFont('helvetica', 'normal');
            }
          }
        }
      }

      // Clues / Solution Section
      doc.setTextColor(20, 20, 20);
      const totalClues = puzzle.acrossClues.length + puzzle.downClues.length;
      let currentY = startY + (puzzle.rows * cellW) + 9;

      if (!isSol) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Across', 15, currentY);
        doc.text('Down', 110, currentY);

        currentY += 5;
        doc.setFont('helvetica', 'normal');

        const isDenseHard = totalClues > 22 || puzzle.rows > 14;
        const clueFontSize = isDenseHard ? 7.5 : 8.5;
        const lineSpacing = isDenseHard ? 3.6 : 4.2;

        doc.setFontSize(clueFontSize);

        const startYClues = currentY;
        let yA = startYClues;
        puzzle.acrossClues.forEach(clue => {
          const rawText = `${clue.number}. ${clue.clue} (${clue.word.length})`;
          const text = this.sanitizeText(rawText);
          const lines = doc.splitTextToSize(text, 88);
          doc.text(lines, 15, yA);
          yA += lines.length * lineSpacing;
        });

        let yD = startYClues;
        puzzle.downClues.forEach(clue => {
          const rawText = `${clue.number}. ${clue.clue} (${clue.word.length})`;
          const text = this.sanitizeText(rawText);
          const lines = doc.splitTextToSize(text, 88);
          doc.text(lines, 110, yD);
          yD += lines.length * lineSpacing;
        });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Word Index', 15, currentY);

        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        const colWidth = 45;
        const startXIndex = 15;
        let colIdx = 0;
        let ySol = currentY;

        puzzle.allWords.forEach((item) => {
          const dir = item.direction === 'across' ? 'A' : 'D';
          const text = `${item.number}${dir}. ${item.word} (${item.word.length})`;
          const x = startXIndex + colIdx * colWidth;
          doc.text(text, x, ySol);

          colIdx++;
          if (colIdx >= 4) {
            colIdx = 0;
            ySol += 4.2;
          }
        });
      }

      // Page Footer
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('English Crossword Challenge * Printable A4 Worksheet', 15, 290);
      doc.text(isSol ? 'Page 2 of 2' : (isSolutionVisible ? 'Page 1 of 2' : 'Page 1 of 1'), 195, 290, { align: 'right' });
    };

    renderPage(false);

    if (isSolutionVisible) {
      doc.addPage();
      renderPage(true);
    }

    const safeId = puzzleId.replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`crossword-${safeId || 'puzzle'}.pdf`);
  }

  /**
   * Generates and downloads the authentic Gazete Çengel Bulmaca PDF.
   */
  static exportCengel(cengelData, options = {}) {
    if (!window.jspdf) throw new Error('jsPDF library not loaded');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const puzzles = Array.isArray(cengelData) ? cengelData : [cengelData];
    const isDual = puzzles.length > 1;
    const isSolutionVisible = options.isSolutionVisible || false;
    const puzzleId = options.puzzleId || '#26';

    const renderCengelPage = (isSol) => {
      // Worksheet header
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      doc.text('Name: _______________________      Date: ____________      Score: _____ / 100', 15, 12);

      let currentY = 16;

      puzzles.forEach((puzzle, pIdx) => {
        const hasSecret = !isDual && puzzle.secretWord;
        const maxAvailW = 182;
        const maxAvailH = isDual ? 122 : (hasSecret ? 236 : 254);
        const cellW = Math.min(maxAvailW / puzzle.cols, maxAvailH / puzzle.rows);
        const gridW = puzzle.cols * cellW;
        const startX = (210 - gridW) / 2;

        // Draw Board
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        for (let r = 0; r < puzzle.rows; r++) {
          for (let c = 0; c < puzzle.cols; c++) {
            const cell = puzzle.grid[r][c];
            const x = startX + c * cellW;
            const y = currentY + r * cellW;

            if (cell.type === 'blocked') {
              this.drawHatchedCell(doc, x, y, cellW, 2.2);
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.3);
            } else if (cell.type === 'letter') {
              doc.setFillColor(255, 255, 255);
              doc.rect(x, y, cellW, cellW, 'FD');

              if ((isSol || cell.isHint) && cell.char) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(cellW > 12.5 ? 12.5 : 9.5);
                if (isSol) {
                  doc.setTextColor(29, 78, 216);
                } else {
                  doc.setTextColor(130, 140, 155);
                }
                doc.text(cell.char, x + cellW / 2, y + cellW / 2 + 1.2, { align: 'center' });
              }

              if (cell.secretIndex) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(5.5);
                doc.setTextColor(2, 132, 199);
                doc.text(String(cell.secretIndex), x + cellW - 0.8, y + cellW - 0.8, { align: 'right' });
              }
            } else {
              // Clue Cell
              doc.setFillColor(245, 247, 250);
              doc.rect(x, y, cellW, cellW, 'FD');

              if (cell.acrossWord && cell.downWord) {
                // Dual Clue
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(cellW > 12.5 ? 4.2 : 3.8);
                doc.setTextColor(20, 20, 20);

                const tAcross = this.sanitizeText(cell.acrossWord.clue);
                const lA = doc.splitTextToSize(tAcross, cellW - 2.8);
                doc.text(lA.slice(0, 2), x + 1, y + 2.2);

                doc.setTextColor(2, 132, 199);
                doc.setFontSize(cellW > 12.5 ? 5.2 : 4.6);
                doc.text('>', x + cellW - 0.8, y + cellW / 2 - 0.8, { align: 'right' });

                // Divider line
                doc.setDrawColor(180, 180, 180);
                doc.setLineWidth(0.15);
                doc.line(x, y + cellW / 2, x + cellW, y + cellW / 2);
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.3);

                // Down Clue
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(cellW > 12.5 ? 4.2 : 3.8);
                doc.setTextColor(20, 20, 20);
                const tDown = this.sanitizeText(cell.downWord.clue);
                const lD = doc.splitTextToSize(tDown, cellW - 2.8);
                doc.text(lD.slice(0, 2), x + 1, y + cellW / 2 + 2.2);

                doc.setTextColor(2, 132, 199);
                doc.setFontSize(cellW > 12.5 ? 5.2 : 4.6);
                doc.text('v', x + cellW - 0.8, y + cellW - 0.8, { align: 'right' });
              } else if (cell.acrossWord) {
                // Single Across Clue
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(cellW > 12.5 ? 4.8 : 4.4);
                doc.setTextColor(20, 20, 20);
                const t = this.sanitizeText(cell.acrossWord.clue);
                const lines = doc.splitTextToSize(t, cellW - 2.8);
                doc.text(lines.slice(0, 3), x + 1, y + 2.8);

                doc.setTextColor(2, 132, 199);
                doc.setFontSize(cellW > 12.5 ? 6.0 : 5.2);
                doc.text('>', x + cellW - 0.8, y + cellW - 0.8, { align: 'right' });
              } else if (cell.downWord) {
                // Single Down Clue
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(cellW > 12.5 ? 4.8 : 4.4);
                doc.setTextColor(20, 20, 20);
                const t = this.sanitizeText(cell.downWord.clue);
                const lines = doc.splitTextToSize(t, cellW - 2.8);
                doc.text(lines.slice(0, 3), x + 1, y + 2.8);

                doc.setTextColor(2, 132, 199);
                doc.setFontSize(cellW > 12.5 ? 6.0 : 5.2);
                doc.text('v', x + cellW - 0.8, y + cellW - 0.8, { align: 'right' });
              } else {
                this.drawHatchedCell(doc, x, y, cellW, 2.2);
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.3);
              }
            }
          }
        }

        currentY += (puzzle.rows * cellW) + 6;

        // Render Secret Keyword Bar on Single Full-Page Mode
        if (hasSecret) {
          const sw = puzzle.secretWord;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(`SIFRELI KELIME (${this.sanitizeText(sw.clue)}):`, startX, currentY + 4);

          const boxSize = 8.5;
          const boxesStartX = startX + gridW - (sw.word.length * (boxSize + 1.5));
          for (let i = 0; i < sw.word.length; i++) {
            const bx = boxesStartX + i * (boxSize + 1.5);
            const by = currentY - 1.5;
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(2, 132, 199);
            doc.setLineWidth(0.35);
            doc.rect(bx, by, boxSize, boxSize, 'FD');

            doc.setFontSize(5.5);
            doc.setTextColor(2, 132, 199);
            doc.text(String(i + 1), bx + 1, by + 2.2);

            if (isSol) {
              doc.setFontSize(9.5);
              doc.setTextColor(29, 78, 216);
              doc.text(sw.word[i], bx + boxSize / 2, by + boxSize / 2 + 1.5, { align: 'center' });
            }
          }
          currentY += 10;
        }

        if (isDual && pIdx === 0) {
          doc.setDrawColor(160, 160, 160);
          doc.setLineDashPattern([2, 2], 0);
          doc.line(15, currentY - 2, 195, currentY - 2);
          doc.setLineDashPattern([], 0);
          currentY += 4;
        }
      });

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('Gazete Cengel Bulmacasi * A4 Baski Sayfasi', 15, 290);
      doc.text(isSol ? 'Sayfa 2 / 2 (Cevap Anahtari)' : (isSolutionVisible ? 'Sayfa 1 / 2' : 'Sayfa 1 / 1'), 195, 290, { align: 'right' });
    };

    renderCengelPage(false);

    if (isSolutionVisible) {
      doc.addPage();
      renderCengelPage(true);
    }

    const safeId = puzzleId.replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`cengel-${safeId || 'bulmaca'}.pdf`);
  }
}
