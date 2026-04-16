const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  heroTitle: { type: String, default: 'Premium Software Solutions' },
  heroSubtitle: { type: String, default: 'Download high-quality software for your business' },
  companyName: { type: String, default: 'INDIAN WEB' },
  companyDescription: { type: String, default: 'We provide premium software solutions for businesses worldwide.' },
  contactEmail: { type: String, default: 'support@indianweb.com' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  contactAddress: { type: String, default: 'New Delhi, India' },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  featuredSoftware: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Software' }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);