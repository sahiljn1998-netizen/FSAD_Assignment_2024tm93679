require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/equipment', require('./routes/equipment'));
app.use('/api/v1/requests', require('./routes/requests'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
