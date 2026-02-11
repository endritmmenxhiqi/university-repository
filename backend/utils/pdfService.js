const PDFDocument = require('pdfkit');

exports.generateInventoryPDF = (res, items, location) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' }); // Landscape per shkak te shume kolonave

    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // KREU I DOKUMENTIT
    doc.font('Helvetica-Bold').fontSize(12).text('UNIVERSITETI "ISA BOLETINI" MITROVICË', { align: 'center' });
    doc.fontSize(10).text('FAKULTETI I INXHINIERISË MEKANIKE DHE KOMPJUTERIKE', { align: 'center' });
    
    const isKapitale = items.every(item => item.value >= 1000);
    const titulli = isKapitale ? "PASURIA JO FINANCIARE KAPITALE (>1000€)" : "PASURIA JO FINANCIARE JO KAPITALE (<1000€)";
    
    doc.moveDown().fontSize(11).text(`RAPORTI: ${titulli}`, { align: 'center', underline: true });
    doc.text(`Lokacioni: ${location}`, { align: 'center' });
    doc.moveDown(2);

    // TABELA - HEADER
    const tableTop = 150;
    const col = { nr: 30, desc: 60, sasia: 230, njesia: 270, cmimi: 320, shuma: 390, serial: 460, burimi: 580 };

    doc.rect(30, tableTop, 750, 25).fill('#f2f2f2').stroke();
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(9);
    
    doc.text('Nr', col.nr + 5, tableTop + 8);
    doc.text('Pershkrimi i mjetit', col.desc + 5, tableTop + 8);
    doc.text('Sas', col.sasia + 5, tableTop + 8);
    doc.text('Nj', col.njesia + 5, tableTop + 8);
    doc.text('Cmimi', col.cmimi + 5, tableTop + 8);
    doc.text('Shuma', col.shuma + 5, tableTop + 8);
    doc.text('Nr. Serial', col.serial + 5, tableTop + 8);
    doc.text('Burimi Financimit', col.burimi + 5, tableTop + 8);

    // RRESHTAT
    let currentY = tableTop + 25;
    let totalPerRaport = 0;

    doc.font('Helvetica').fontSize(8);
    items.forEach((item, index) => {
        const shuma = item.quantity * item.value;
        totalPerRaport += shuma;

        doc.rect(30, currentY, 750, 20).stroke(); // Vija si Excel
        
        doc.text(index + 1, col.nr + 5, currentY + 6);
        doc.text(item.description, col.desc + 5, currentY + 6, { width: 160 });
        doc.text(item.quantity, col.sasia + 5, currentY + 6);
        doc.text(item.unit, col.njesia + 5, currentY + 6);
        doc.text(`${item.value.toFixed(2)}€`, col.cmimi + 5, currentY + 6);
        doc.text(`${shuma.toFixed(2)}€`, col.shuma + 5, currentY + 6);
        doc.text(item.serialNumber || '/', col.serial + 5, currentY + 6);
        doc.text(item.fundingSource, col.burimi + 5, currentY + 6);

        currentY += 20;
    });

    // TOTALI
    doc.rect(30, currentY, 750, 25).fill('#eeeeee').stroke();
    doc.fillColor('#000').font('Helvetica-Bold');
    doc.text('TOTALI i PËRGJITHSHËM:', col.cmimi, currentY + 8);
    doc.text(`${totalPerRaport.toFixed(2)} €`, col.shuma + 5, currentY + 8);

    doc.end();
};