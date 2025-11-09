const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const users = [
  { name: 'Alice Student', email: 'alice@student.local', password: 'password123', role: 'student' },
  { name: 'Bob Teacher', email: 'bob@staff.local', password: 'password123', role: 'staff' },
  { name: 'Carol Admin', email: 'carol@admin.local', password: 'password123', role: 'admin' }
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in environment. Please add it to .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for user seeding');

    await User.deleteMany({});

    for (const u of users) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(u.password, salt);
      const user = new User({ name: u.name, email: u.email, password: hashed, role: u.role });
      await user.save();
      console.log(`Created user ${u.email} (${u.role})`);
    }

    process.exit(0);
  } catch (err) {
    console.error('User seeding error:', err.message || err);
    process.exit(1);
  }
}

seed();
