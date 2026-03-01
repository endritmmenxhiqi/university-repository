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
    // assignedTo do të ruajë email-in e përdoruesit
    assignedTo: { 
        type: String, 
        default: '', 
        lowercase: true, // E kthen automatikisht në shkronja të vogla në DB
        trim: true 
    }, 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);