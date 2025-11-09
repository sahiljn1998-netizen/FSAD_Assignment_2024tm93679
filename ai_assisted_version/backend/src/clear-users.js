require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function clearUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to database...');
        
        const result = await User.deleteMany({});
        console.log(`Cleared ${result.deletedCount} users from the database`);
        
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearUsers();