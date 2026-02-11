const app = require('./app');
const connectDB = require('./config/db');
const dotenv = require('dotenv');


dotenv.config();


connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Serveri po punon në portën ${PORT}`);
});