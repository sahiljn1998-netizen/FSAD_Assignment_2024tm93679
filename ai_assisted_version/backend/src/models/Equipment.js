const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  condition: { type: String, default: 'Good' },
  quantity: { type: Number, required: true, default: 1 },
  available: { type: Number, required: true, default: 1 },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Equipment', EquipmentSchema);
