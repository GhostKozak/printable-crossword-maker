/**
 * PDF Exporter for Crossword Puzzles
 * Utilizes jsPDF with Unicode-to-ASCII sanitization to ensure perfect rendering
 * and dynamic layout scaling to prevent overflow on A4 pages.
 */

export class PdfExporter {
  /**
   * Sanitizes Turkish and special Unicode characters for standard PDF Helvetica font.
   */
  static sanitizeText(text) {
    if (!text) return '';
    const charMap = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G',
      'ı': 'i', 'I': 'I', 'İ': 'I',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U',
      'â': 'a', 'Â': 'A',
      'î': 'i', 'Î': 'I',
      'û': 'u', 'Û': 'U',
      '—': '-', '–': '-',
      '“': '"', '”': '"',
      '‘': "'", '’': "'",
      '•': '*'
    };
    return text.replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ—–“”‘’•]/g, m => charMap[m] || m);
  }

  /**
   * Generates and downloads the PDF document.
   */
  static export(puzzle, options = {}) {
    if (!window.jspdf) {
      throw new Error('jsPDF library not loaded');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const puzzleId = options.puzzleId || '#CW-001';
    const difficulty = options.difficulty || 'Medium';
    const title = options.title || 'English Crossword';
    const subtitle = options.subtitle || 'Vocabulary & General Knowledge';
    const isSolutionVisible = options.isSolutionVisible || false;
    const dateStr = options.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const renderPage = (isSol) => {
      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(this.sanitizeText(isSol ? 'Answer Key' : title), 15, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(this.sanitizeText(isSol ? 'Solutions for Self-Checking' : subtitle), 15, 26);

      // Meta Box (Top Right)
      doc.setFontSize(8.5);
      doc.text(`ID: ${this.sanitizeText(puzzleId)}`, 195, 17, { align: 'right' });
      doc.text(`Difficulty: ${this.sanitizeText(difficulty)}`, 195, 22, { align: 'right' });
      doc.text(`Date: ${this.sanitizeText(dateStr)}`, 195, 27, { align: 'right' });

      // Student name / date fields for worksheet
      if (!isSol) {
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.text('Name: _______________________', 15, 33);
        doc.text('Score: _______ / 100', 135, 33);
      }

      // Dynamic Grid Cell Size
      const maxDim = Math.max(puzzle.rows, puzzle.cols);
      let cellW = 8;
      if (maxDim > 17) cellW = 6.2;
      else if (maxDim > 14) cellW = 7.0;
      else if (maxDim > 11) cellW = 7.8;
      else cellW = 8.5;

      const gridW = puzzle.cols * cellW;
      const startX = (210 - gridW) / 2;
      const startY = isSol ? 32 : 38;

      doc.setDrawColor(40, 40, 40);
      doc.setLineWidth(0.4);

      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const cell = puzzle.grid[r][c];
          const x = startX + c * cellW;
          const y = startY + r * cellW;

          if (cell.isBlocked) {
            doc.setFillColor(255, 255, 255);
            doc.rect(x, y, cellW, cellW, 'FD');

            // Draw diagonal hatch lines for toner savings
            doc.setDrawColor(70, 70, 70);
            doc.setLineWidth(0.2);
            const step = 1.6;
            for (let offset = -cellW; offset <= cellW; offset += step) {
              const uMin = Math.max(0, offset);
              const uMax = Math.min(cellW, cellW + offset);
              const vMin = uMin - offset;
              const vMax = uMax - offset;
              if (uMin < uMax) {
                doc.line(x + uMin, y + vMin, x + uMax, y + vMax);
              }
            }
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

            if (isSol && cell.letter) {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(cellW > 7 ? 11 : 9.5);
              doc.setTextColor(20, 20, 20);
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
        // Clue Headings
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Across', 15, currentY);
        doc.text('Down', 110, currentY);

        currentY += 5;
        doc.setFont('helvetica', 'normal');

        // Adaptive clue sizing to ensure single-page fit
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
        // Word Index on Solution Page
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

        puzzle.allWords.forEach((item, i) => {
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

    const isDual = Array.isArray(cengelData);
    const puzzles = isDual ? cengelData : [cengelData];
    const difficulty = options.difficulty || 'Orta Seviye';
    const isSolutionVisible = options.isSolutionVisible || false;
    const puzzleId = options.puzzleId || '#26';

    const renderCengelPage = (isSol) => {
      // Worksheet header
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Name: _______________________      Date: ____________      Score: _____ / 100', 15, 12);

      let currentY = 16;

      puzzles.forEach((puzzle, pIdx) => {
        const subId = isDual ? `${puzzleId}${pIdx === 0 ? 'A' : 'B'}` : puzzleId;
        const subTitle = isDual ? `${difficulty} - Gazete Cengel #${pIdx + 1}` : `${difficulty} - Gazete Cengel Bulmacasi`;

        // Banner width & grid calculation
        const cellW = isDual ? 13.0 : 11.5;
        const gridW = puzzle.cols * cellW;
        const startX = (210 - gridW) / 2;

        // Draw Newspaper Blue Banner
        doc.setFillColor(2, 132, 199);
        doc.rect(startX, currentY, gridW, 7, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(255, 255, 255);
        doc.text(this.sanitizeText(subTitle), startX + 3, currentY + 5);

        // Number Badge
        doc.setFillColor(3, 105, 161);
        doc.rect(startX + gridW - 20, currentY + 1, 18, 5, 'F');
        doc.setFontSize(9);
        doc.text(this.sanitizeText(subId), startX + gridW - 11, currentY + 4.5, { align: 'center' });

        currentY += 7;

        // Draw Board
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        for (let r = 0; r < puzzle.rows; r++) {
          for (let c = 0; c < puzzle.cols; c++) {
            const cell = puzzle.grid[r][c];
            const x = startX + c * cellW;
            const y = currentY + r * cellW;

            if (cell.type === 'letter') {
              doc.setFillColor(255, 255, 255);
              doc.rect(x, y, cellW, cellW, 'FD');

              if (isSol && cell.char) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(cellW > 12 ? 11 : 9.5);
                doc.setTextColor(29, 78, 216);
                doc.text(cell.char, x + cellW / 2, y + cellW / 2 + 1.2, { align: 'center' });
              }
            } else {
              // Clue Cell
              doc.setFillColor(245, 247, 250);
              doc.rect(x, y, cellW, cellW, 'FD');

              if (cell.acrossWord && cell.downWord) {
                // Dual Clue
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(4.2);
                doc.setTextColor(20, 20, 20);

                const tAcross = this.sanitizeText(cell.acrossWord.clue);
                const lA = doc.splitTextToSize(tAcross, cellW - 2.8);
                doc.text(lA.slice(0, 2), x + 1, y + 2.2);

                doc.setTextColor(2, 132, 199);
                doc.setFontSize(5);
                doc.text('>', x + cellW - 1.2, y + cellW / 2 - 0.6, { align: 'right' });

                // Divider line
                doc.setDrawColor(180, 180, 180);
                doc.setLineWidth(0.15);
                doc.line(x, y + cellW / 2, x + cellW, y + cellW / 2);
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.3);

                // Down Clue
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(4.2);
                doc.setTextColor(20, 20, 20);
                const tDown = this.sanitizeText(cell.downWord.clue);
                const lD = doc.splitTextToSize(tDown, cellW - 2.8);
                doc.text(lD.slice(0, 2), x + 1, y + cellW / 2 + 2.2);

                doc.setTextColor(2, 132, 199);
                doc.setFontSize(5);
                doc.text('v', x + cellW - 1.2, y + cellW - 0.8, { align: 'right' });
              } else if (cell.acrossWord) {
                // Single Across Clue
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(4.6);
                doc.setTextColor(20, 20, 20);
                const t = this.sanitizeText(cell.acrossWord.clue);
                const lines = doc.splitTextToSize(t, cellW - 2.5);
                doc.text(lines.slice(0, 3), x + 1, y + 2.6);

                doc.setTextColor(2, 132, 199);
                doc.setFontSize(5.5);
                doc.text('>', x + cellW - 1.2, y + cellW - 1, { align: 'right' });
              } else if (cell.downWord) {
                // Single Down Clue
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(4.6);
                doc.setTextColor(20, 20, 20);
                const t = this.sanitizeText(cell.downWord.clue);
                const lines = doc.splitTextToSize(t, cellW - 2.5);
                doc.text(lines.slice(0, 3), x + 1, y + 2.6);

                doc.setTextColor(2, 132, 199);
                doc.setFontSize(5.5);
                doc.text('v', x + cellW - 1.2, y + cellW - 1, { align: 'right' });
              } else {
                // Emblem
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                doc.text(this.sanitizeText(cell.label || '*'), x + cellW / 2, y + cellW / 2 + 1, { align: 'center' });
              }
            }
          }
        }

        currentY += (puzzle.rows * cellW) + 12;

        if (isDual && pIdx === 0) {
          // Cut line
          doc.setDrawColor(160, 160, 160);
          doc.setLineDashPattern([2, 2], 0);
          doc.line(15, currentY - 5, 195, currentY - 5);
          doc.setLineDashPattern([], 0);
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
