const mongoose = require('mongoose');

const CustomOrderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  softwareName: { type: String, required: true },
  description: { type: String, required: true },
  features: { type: String },
  budget: { type: String },
  timeline: { type: String },
  status: { type: String, enum: ['pending', 'reviewed', 'approved', 'completed'], default: 'pending' },
  adminNote: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomOrder', CustomOrderSchema);