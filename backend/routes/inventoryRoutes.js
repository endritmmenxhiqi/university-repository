const express = require('express');
const router = express.Router();

// Middleware-at e autorizimit
const { protect, authorize } = require('../middleware/authMiddleware');

// Importojmë funksionet nga Controller-i
const { 
    getItems, 
    createItem, 
    updateStatus, 
    getHistory, 
    deleteItem 
} = require('../controllers/inventoryController');

/** * Tani rrugët janë shumë të thjeshta për t'u lexuar.
 * Çdo rrugë përdor 'protect' për të siguruar që përdoruesi është i loguar.
 */

// 1. Merr të gjitha mjetet (Filtrimi sipas rolit ndodh brenda getItems)
router.get('/', protect, getItems);

// 2. Regjistrimi i mjetit të ri (Vetëm Admin)
router.post('/', protect, authorize('admin'), createItem);

// 3. Ndryshimi i statusit (Vetëm Admin)
router.patch('/:id/status', protect, authorize('admin'), updateStatus);

// 4. Marrja e historikut të një mjeti (Për të gjithë përdoruesit e regjistruar)
router.get('/:id/history', protect, getHistory);

// 5. Fshirja e mjetit (Vetëm Admin)
router.delete('/:id', protect, authorize('admin'), deleteItem);

module.exports = router;