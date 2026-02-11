const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`✅ MongoDB u lidh me sukses: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Gabim gjatë lidhjes me DB: ${error.message}`);
        process.exit(1); 
    }
};

module.exports = connectDB;