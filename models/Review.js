const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  softwareId: { type: mongoose.Schema.Types.ObjectId, ref: 'Software', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);