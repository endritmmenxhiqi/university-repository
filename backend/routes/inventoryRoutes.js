const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const { 
    getItems, 
    createItem, 
    updateStatus, 
    updateScanDate, 
    getHistory, 
    deleteItem 
} = require('../controllers/inventoryController');

// 1. Merr të gjitha mjetet
router.get('/', protect, getItems);

// 2. Përditësimi i datës së skanimit (Auditimi)
// Kjo duhet të jetë MBI rrugët me :id që të mos ngatërrohet Express-i
router.patch('/scan/:serialNumber', protect, updateScanDate);

// 3. Regjistrimi i mjetit të ri
router.post('/', protect, authorize('admin'), createItem);

// 4. Ndryshimi i statusit (Admin)
router.patch('/:id/status', protect, authorize('admin'), updateStatus);

// 5. Marrja e historikut
router.get('/:id/history', protect, getHistory);

// 6. Fshirja e mjetit (Admin)
router.delete('/:id', protect, authorize('admin'), deleteItem);

module.exports = router;