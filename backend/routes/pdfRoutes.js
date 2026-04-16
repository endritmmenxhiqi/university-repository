const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const PDFDocument = require('pdfkit');
const path = require('path');
const { protect, authorize } = require('../middleware/authMiddleware'); // Siguria

// Vetëm Admini dhe Super Viewer mund të shkarkojnë raporte
router.get('/download', protect, authorize('admin', 'super_viewer'), async (req, res) => {
    try {
        const { location, status, valueRange, member1, member2, member3 } = req.query;
        
        let query = {};
        if (location && location !== 'KREJT FK') query.location = location;
        if (status && status !== 'all') query.status = status;
        
        if (valueRange === 'low') query.value = { $lt: 1000 };
        else if (valueRange === 'high') query.value = { $gte: 1000 };

        const items = await Inventory.find(query);
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // --- KONFIGURIMI I KOLONAVE ---
        const colWidths = { nr: 25, desc: 150, loc: 70, sas: 35, njesia: 40, cPa: 70, sPa: 75, sMe: 75, data: 70, burimi: 140 };
        const headers = ['Nr', 'Përshkrimi', 'Lokacioni', 'Sasia', 'Njësia', 'Çmimi pa TVSH', 'Shuma pa TVSH', 'Shuma me TVSH', 'Data', 'Burimi'];

        // Funksioni për vizatimin e Headerit (përsëritet në çdo faqe të re)
        const drawHeader = (d, loc, vRange) => {
            const logoUIBM = path.join(__dirname, '../public/logo-uibm.png'); 
            try { d.image(logoUIBM, 35, 25, { width: 370}); } catch (err) {}

            d.fillColor('#1a3a5a').font('Helvetica-Bold').fontSize(11);
            d.text('UNIVERSITETI "ISA BOLETINI" MITROVICË', 0, 35, { align: 'center' });
            d.fontSize(9).text('UNIVERSITY "ISA BOLETINI" MITROVICË', { align: 'center' });
            d.fontSize(10).text('FAKULTETI I INXHINIERISË MEKANIKE DHE KOMPJUTERIKE', { align: 'center' });
            d.moveDown(1);

            d.fillColor('#000').font('Helvetica-Bold').fontSize(16).text('R A P O R T', { align: 'center' });
            d.fontSize(11).text(`Lokacioni: ${loc || 'Të gjitha'}`, { align: 'center' });

            if (vRange && vRange !== 'all') {
                d.fontSize(10).font('Helvetica').text(`Pasuria jo financiare kapitale ${vRange === 'high' ? '> 1000€' : '< 1000€'}`, { align: 'center' });
            }

            d.moveDown(1);
            let currentY = d.y;
            
            // Vizatimi i Headerit të Tabelës
            d.rect(30, currentY, 750, 25).fill('#1a3a5a');
            d.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
            
            let hX = 30;
            headers.forEach((h, i) => {
                d.text(h, hX + 2, currentY + 8, { width: Object.values(colWidths)[i] - 4, align: 'center' });
                hX += Object.values(colWidths)[i];
            });
            
            return currentY + 25;
        };

        let y = drawHeader(doc, location, valueRange);
        let totalPaTVSH = 0;
        let totalMeTVSH = 0;

        doc.font('Helvetica').fontSize(8).fillColor('#000');
        
        items.forEach((item, i) => {
            // Kontrolli për faqe të re (Landscape lartësia është rreth 595, max y rreth 500)
            if (y > 480) { 
                doc.addPage(); 
                y = drawHeader(doc, location, valueRange); 
            }

            const sasia = item.quantity || 1;
            const vMe = item.value || 0;
            const vPa = vMe / 1.18;
            const sMe = vMe * sasia;
            const sPa = vPa * sasia;
            
            totalPaTVSH += sPa;
            totalMeTVSH += sMe;

            // Rreshtat me ngjyrë alternuese
            if (i % 2 === 1) doc.save().rect(30, y, 750, 25).fill('#f8f8f8').restore();

            let rowX = 30;
            const rowData = [
                i + 1, 
                item.description, 
                item.location || '/', 
                sasia, 
                item.unit || 'copë',
                vPa.toFixed(2), 
                sPa.toFixed(2), 
                sMe.toFixed(2),
                item.createdAt ? new Date(item.createdAt).toLocaleDateString('sq-AL') : '/',
                item.fundingSource || 'Buxheti i Kosovës'
            ];

            rowData.forEach((val, idx) => {
                doc.rect(rowX, y, Object.values(colWidths)[idx], 25).strokeColor('#cccccc').stroke();
                doc.fillColor('#000').text(val.toString(), rowX + 2, y + 8, { 
                    width: Object.values(colWidths)[idx] - 4, 
                    align: idx >= 5 && idx <= 7 ? 'right' : 'center' 
                });
                rowX += Object.values(colWidths)[idx];
            });
            y += 25;
        });

        // Vija e Totaleve
        doc.rect(30, y, 750, 25).fill('#eeeeee').stroke('#ccc');
        doc.fillColor('#000').font('Helvetica-Bold').text('Gjithsej:', 35, y + 8);
        
        // Pozicionimi i saktë i shumave
        const xShumaPa = 30 + colWidths.nr + colWidths.desc + colWidths.loc + colWidths.sas + colWidths.njesia + colWidths.cPa;
        doc.text(totalPaTVSH.toFixed(2), xShumaPa, y + 8, { width: colWidths.sPa, align: 'right' });
        doc.text(totalMeTVSH.toFixed(2), xShumaPa + colWidths.sPa, y + 8, { width: colWidths.sMe, align: 'right' });

        // --- KOMISIONI ---
        y += 50;
        if (y > 450) { doc.addPage(); y = 50; }
        
        const sigX = 550; 
        const vizaWidth = 120; 

        doc.fontSize(11).font('Helvetica-Bold').text('Komisioni:', sigX, y);
        
        const sigs = [
            { name: member1, role: '(Kryetar)' },
            { name: member2, role: '(Anëtar)' },
            { name: member3, role: '(Anëtar)' }
        ];

        sigs.forEach((m, idx) => {
            const curY = y + 35 + (idx * 40); 
            const emriTekst = m.name || "____________________";
            doc.font('Helvetica-Bold').fontSize(10).text(emriTekst, sigX, curY);

            const emriWidth = doc.widthOfString(emriTekst);
            const vizaStartX = sigX + emriWidth + 10;

            doc.moveTo(vizaStartX, curY + 8)
                .lineTo(vizaStartX + vizaWidth, curY + 8)
                .lineWidth(0.7).strokeColor('#000000').stroke();

            doc.font('Helvetica').fontSize(9).text(m.role, vizaStartX + vizaWidth + 10, curY);

            if (idx === 2) {
                doc.fontSize(10).font('Helvetica').text(`Mitrovicë, më ${new Date().toLocaleDateString('sq-AL')}`, 35, curY);
            }
        });

        doc.end();
    } catch (err) {
        console.error("GABIM:", err);
        res.status(500).json({ message: "Gabim gjatë gjenerimit të PDF." });
    }
});

module.exports = router;