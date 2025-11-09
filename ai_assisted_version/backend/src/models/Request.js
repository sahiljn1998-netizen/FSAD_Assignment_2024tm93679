const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedQuantity: { type: Number, required: true, default: 1 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'issued', 'returned'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issuedAt: Date,
  returnedAt: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);
