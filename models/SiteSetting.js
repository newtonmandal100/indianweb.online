const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema({
  // লোগো সেটিংস
  logo: { type: String, default: '/uploads/logo/default-logo.png' },
  logoAlt: { type: String, default: 'INDIAN WEB Logo' },
  logoWidth: { type: Number, default: 150 },
  logoHeight: { type: Number, default: 50 },
  
  // অ্যানিমেশন সেটিংস
  heroAnimation: { type: String, default: 'fade-up' },
  cardAnimation: { type: String, default: 'fade-up' },
  animationSpeed: { type: Number, default: 1000 },
  customAnimationCSS: { type: String, default: '' },
  
  // ব্যাকগ্রাউন্ড অ্যানিমেশন
  backgroundAnimation: { type: String, enum: ['gradient-move', 'particle', 'wave', 'none'], default: 'gradient-move' },
  
  // লোগো পজিশন
  logoPosition: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
  
  // ফেভিকন
  favicon: { type: String, default: '/uploads/logo/favicon.ico' },
  
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteSetting', SiteSettingSchema);
const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema({
  logo: { type: String, default: '/uploads/logo/default-logo.png' },
  watermark: { type: String, default: '/uploads/watermark/default-watermark.png' },
  heroBackground: { type: String, default: '' },
  logoAlt: { type: String, default: 'INDIAN WEB Logo' },
  logoWidth: { type: Number, default: 70 },
  logoHeight: { type: Number, default: 70 },
  heroAnimation: { type: String, default: 'fade-up' },
  cardAnimation: { type: String, default: 'fade-up' },
  animationSpeed: { type: Number, default: 1000 },
  backgroundAnimation: { type: String, default: 'gradient-move' },
  customAnimationCSS: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteSetting', SiteSettingSchema);
const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema({
  // Logo Settings
  logo: { type: String, default: '/uploads/logo/default-logo.png' },
  watermark: { type: String, default: '/uploads/watermark/default-watermark.png' },
  logoAlt: { type: String, default: 'INDIAN WEB Logo' },
  logoWidth: { type: Number, default: 70 },
  logoHeight: { type: Number, default: 70 },
  
  // Hero Section Background
  heroBackground: { type: String, default: '' },
  
  // Stats Section Background
  statsBackground: { type: String, default: '' },
  
  // Featured Software Section Background
  featuredBackground: { type: String, default: '' },
  
  // Services Section Background
  servicesBackground: { type: String, default: '' },
  
  // Footer Background
  footerBackground: { type: String, default: '' },
  
  // Animation Settings
  heroAnimation: { type: String, default: 'fade-up' },
  cardAnimation: { type: String, default: 'fade-up' },
  animationSpeed: { type: Number, default: 1000 },
  backgroundAnimation: { type: String, default: 'gradient-move' },
  customAnimationCSS: { type: String, default: '' },
  
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteSetting', SiteSettingSchema);