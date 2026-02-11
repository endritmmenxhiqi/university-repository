const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Inventory = require('../models/Inventory');


// Leximi i aseteve --- Lejohet për të gjithë (Admin & Viewer) që janë të kyçur
router.get('/', protect, async (req, res) => {
    try {
        const items = await Inventory.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Vetëm përdoruesit me rolin 'admin' mund të shtojnë asete
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const newItem = new Inventory(req.body);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Vetëm përdoruesit me rolin 'admin' mund të ndryshojnë statusin
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const updatedItem = await Inventory.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );
        if (!updatedItem) return res.status(404).json({ message: "Aseti nuk u gjet" });
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;