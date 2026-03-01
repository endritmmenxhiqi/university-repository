const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Inventory = require('../models/Inventory');
const StatusLog = require('../models/StatusLog');

/**
 * @function generateUniqueSN
 * Gjeneron Barkod unik UIBM-XXXXX duke kontrolluar nëse ekziston në DB
 */
const generateUniqueSN = async () => {
    let isUnique = false;
    let sn = "";
    while (!isUnique) {
        const random5Digit = Math.floor(10000 + Math.random() * 90000);
        sn = `UIBM-${random5Digit}`;
        const existing = await Inventory.findOne({ serialNumber: sn });
        if (!existing) isUnique = true;
    }
    return sn;
};

// --- 1. MARRJA E ASETEVE (FILTRIMI SIPAS ROLEVE DHE EMAILIT TË PLOTË) ---
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        
        // Marrim të dhënat e përdoruesit nga Token-i (i rregulluar nga middleware)
        const userRole = req.user.role ? req.user.role.toLowerCase().trim() : 'viewer';
        const userEmail = req.user.email.toLowerCase().trim(); // endrit.menxhiqi@umib.net
        
        // Marrim vetëm pjesën e emrit (endrit.menxhiqi) për kërkim fleksibël
        const emailPrefix = userEmail.split('@')[0];

        // LOGJIKA E QASJES: Kush ka qasje në të gjitha pajisjet (KREJT FK)
        const hasFullAccess = ['admin', 'super_viewer', 'superviewer'].includes(userRole);

        if (!hasFullAccess) {
            // Për Viewer normal: Kërkojmë mjetet ku 'assignedTo' përmban email-in e plotë OSE vetëm emrin/mbiemrin
            query.assignedTo = { 
                $regex: `${emailPrefix}`, 
                $options: 'i' 
            };
        }

        // --- FILTRAT SHTESË (Location, Status, Search) ---
        const { location, status, search, valueRange } = req.query;

        if (location && location !== 'KREJT FK') {
            query.location = location.trim().toUpperCase();
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (valueRange === 'low') query.value = { $lt: 1000 };
        if (valueRange === 'high') query.value = { $gte: 1000 };

        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { serialNumber: { $regex: search, $options: 'i' } },
                { assignedTo: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await Inventory.find(query).sort({ createdAt: -1 });
        
        // Debug për console-n e serverit (shiko në terminal nëse roli dhe emaili po lexohen saktë)
        console.log(`[AUTH] User: ${userEmail} | Role: ${userRole} | Items Found: ${items.length}`);
        
        res.json(items);

    } catch (error) {
        res.status(500).json({ message: "Gabim në server: " + error.message });
    }
});

// --- 2. REGJISTRIMI (VETËM ADMIN) ---
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { description, location, value, quantity, unit, assignedTo, fundingSource } = req.body;

        const finalSerialNumber = await generateUniqueSN();

        const newItem = new Inventory({
            description: description.trim(),
            serialNumber: finalSerialNumber,
            location: location ? location.toUpperCase().trim() : 'E PACAKTUAR',
            value: Number(value),
            quantity: Number(quantity) || 1,
            unit: unit || 'copë',
            fundingSource: fundingSource || 'Buxheti i Kosovës',
            status: 'ne_perdorim',
            // Këshillë: Këtu shëno email-in e plotë: endrit.menxhiqi@umib.net
            assignedTo: assignedTo ? assignedTo.toLowerCase().trim() : '',
            createdBy: req.user.id
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: "Gabim gjatë regjistrimit: " + error.message });
    }
});

// --- 3. NDRYSHIMI I STATUSIT (VETËM ADMIN) ---
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, reason } = req.body;
        const item = await Inventory.findById(req.params.id);
        
        if (!item) return res.status(404).json({ message: "Aseti nuk u gjet" });
        
        const oldStatus = item.status;
        item.status = status;
        await item.save();

        // Ruajmë log-un për historik
        await StatusLog.create({
            assetId: item._id,
            oldStatus,
            newStatus: status,
            reason: reason || "Ndryshim manual",
            changedBy: req.user.name || req.user.email 
        });

        res.json(item);
    } catch (error) { 
        res.status(400).json({ message: "Përditësimi dështoi: " + error.message }); 
    }
});

// --- 4. HISTORIKU I STATUSIT ---
router.get('/:id/history', protect, async (req, res) => {
    try {
        const history = await StatusLog.find({ assetId: req.params.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 5. FSHIRJA (VETËM ADMIN) ---
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.json({ message: "U fshi me sukses" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;