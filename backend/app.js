const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const pdfRoutes = require('./routes/pdfRoutes'); 

const app = express();
app.use(express.json());
app.use(cors());


app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', pdfRoutes); 

module.exports = app;