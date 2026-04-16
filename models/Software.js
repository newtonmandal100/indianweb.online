const mongoose = require('mongoose');

const SoftwareSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  longDescription: { type: String },
  price: { type: Number, required: true },
  category: { type: String, default: 'Software' },
  demoUrl: { type: String },
  demoDownloadUrl: { type: String },
  imageUrl: { type: String, default: '/images/default-software.jpg' },
  features: [{ type: String }],
  version: { type: String, default: '1.0.0' },
  downloads: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Software', SoftwareSchema);