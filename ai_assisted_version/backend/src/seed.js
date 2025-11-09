const mongoose = require('mongoose');
require('dotenv').config();
const Equipment = require('./models/Equipment');

const sample = [
  { name: 'Chromebook', category: 'Computers', condition: 'Good', quantity: 10, available: 10, description: 'Dell Chromebooks for classroom use' },
  { name: 'Projector', category: 'AV', condition: 'Good', quantity: 3, available: 3, description: 'Epson projectors' },
  { name: 'DSLR Camera', category: 'Photography', condition: 'Fair', quantity: 2, available: 2, description: 'Canon DSLR for media club' },
  { name: 'Microscope', category: 'Science', condition: 'Good', quantity: 5, available: 5, description: 'Compound microscopes' }
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in environment. Please add it to .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing collection (optional)
    await Equipment.deleteMany({});
    const created = await Equipment.insertMany(sample);
    console.log(`Inserted ${created.length} equipment items`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message || err);
    process.exit(1);
  }
}

seed();
