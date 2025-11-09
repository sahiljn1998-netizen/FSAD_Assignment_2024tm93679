require('dotenv').config();
const mongoose = require('mongoose');
const Request = require('./models/Request');
const db = require('./config/db');

async function clearRequests() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to database...');
        
        const result = await Request.deleteMany({});
        console.log(`Cleared ${result.deletedCount} requests from the database`);
        
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearRequests();