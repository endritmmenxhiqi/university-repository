const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    description: { type: String, required: true },
    serialNumber: { 
        type: String, 
        unique: true, 
        sparse: true,
        immutable: true 
    }, 
    location: { type: String, required: true },
    quantity: { type: Number, default: 1 }, 
    unit: { type: String, default: 'copë' }, 
    value: { type: Number, required: true }, 
    fundingSource: { type: String, default: 'Buxheti i Kosovës' }, 
    status: {
        type: String,
        enum: ['ne_perdorim', 'ne_depo', 'ne_riparim', 'i_amortizuar'],
        default: 'ne_perdorim'
    },
    
    // --- KJO ËSHTË SHTESA E RE ---
    lastScanDate: { 
        type: Date, 
        default: null // Në fillim do jetë null, që do të thotë rreshti do dalë i kuq menjëherë
    },
    // ----------------------------

    assignedTo: { 
        type: String, 
        default: '', 
        lowercase: true, 
        trim: true 
    }, 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }); // timestamps: true ruan 'createdAt' (data origjinale)

module.exports = mongoose.model('Inventory', inventorySchema);