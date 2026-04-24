const PDFDocument = require('pdfkit');

const generatePdf = (data, title, columns) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666')
        .text(`Generated on ${new Date().toLocaleDateString()} | ${data.length} records`, { align: 'center' });
      doc.moveDown(1);

      if (!data || data.length === 0) {
        doc.fontSize(12).fillColor('#333').text('No data available.');
        doc.end();
        return;
      }

      const cols = columns || Object.keys(data[0]).filter(k => k !== 'id' && k !== 'created_at');
      const pageWidth = doc.page.width - 80;
      const colWidth = Math.min(pageWidth / cols.length, 180);

      // Header row
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#333');
      let x = 40;
      cols.forEach(col => {
        const label = col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.text(label, x, doc.y, { width: colWidth, continued: false });
        x += colWidth;
      });

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(40 + cols.length * colWidth, doc.y).stroke('#ddd');
      doc.moveDown(0.3);

      // Data rows
      doc.font('Helvetica').fontSize(7).fillColor('#444');
      data.forEach((row, i) => {
        if (doc.y > doc.page.height - 60) {
          doc.addPage();
          doc.fontSize(7).font('Helvetica').fillColor('#444');
        }

        const startY = doc.y;
        x = 40;
        cols.forEach(col => {
          let value = row[col];
          if (value && typeof value === 'object') value = JSON.stringify(value);
          value = value != null ? String(value).substring(0, 80) : '-';
          doc.text(value, x, startY, { width: colWidth - 5, height: 30 });
          x += colWidth;
        });

        doc.y = startY + 25;

        if (i % 2 === 0) {
          doc.rect(40, startY - 2, cols.length * colWidth, 25)
            .fillOpacity(0.03).fill('#000').fillOpacity(1).fillColor('#444');
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePdf };
