const Inventory = require('../models/Inventory');
const { generateInventoryPDF } = require('../utils/pdfService');

exports.downloadInventoryReport = async (req, res) => {
    try {
        const { location } = req.query;
        console.log("--- KËRKESË PËR PDF ---");
        console.log("Lokacioni i kërkuar:", location);

        const items = await Inventory.find({ location: location });
        console.log("Asetet e gjetura në DB:", items.length);

        if (items.length === 0) {
            return res.status(404).json({ message: "Nuk u gjet asnjë aset." });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Raporti.pdf`);

        generateInventoryPDF(res, items, location);

    } catch (error) {
        console.log("GABIM:", error.message);
        res.status(500).json({ message: error.message });
    }
};