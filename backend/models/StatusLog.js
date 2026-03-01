const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema({
    assetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Inventory', 
        required: true 
    },
    oldStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    reason: { type: String, default: "Pa arsye të specifikuara" },
    changedBy: { type: String, required: true }, // Emri i personit që e bëri ndryshimin
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StatusLog', statusLogSchema);