const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Software = require('../models/Software');
const Order = require('../models/Order');
const CustomOrder = require('../models/CustomOrder');
const SupportQuery = require('../models/SupportQuery');
const Portfolio = require('../models/Portfolio');
const SiteSetting = require('../models/SiteSetting');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'public/uploads/';
    if (file.fieldname === 'logo') uploadPath += 'logo/';
    else if (file.fieldname === 'softwareImage') uploadPath += 'software-images/';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware
function isAdmin(req, res, next) {
  if (req.session.userId && req.session.userRole === 'admin') return next();
  res.redirect('/admin/login');
}

// Dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
  const totalSales = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
  const totalOrders = await Order.countDocuments();
  const totalCustomers = 0;
  const totalRevenue = totalSales[0]?.total || 0;
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);
  const customOrders = await CustomOrder.find().sort({ createdAt: -1 }).limit(5);
  res.render('admin/dashboard', { totalRevenue, totalOrders, totalCustomers, recentOrders, customOrders, admin: req.session });
});

// Software Management
router.get('/software', isAdmin, async (req, res) => {
  const software = await Software.find();
  res.render('admin/software', { software, admin: req.session });
});

router.post('/software/add', isAdmin, upload.single('softwareImage'), async (req, res) => {
  const { name, slug, description, price, demoUrl, category, version } = req.body;
  const imageUrl = req.file ? '/uploads/software-images/' + req.file.filename : '/images/default-software.jpg';
  await new Software({ name, slug, description, price, demoUrl, category, version, imageUrl }).save();
  res.redirect('/admin/software');
});

router.post('/software/delete/:id', isAdmin, async (req, res) => {
  await Software.findByIdAndDelete(req.params.id);
  res.redirect('/admin/software');
});

// Custom Orders
router.get('/custom-orders', isAdmin, async (req, res) => {
  const customOrders = await CustomOrder.find().sort({ createdAt: -1 });
  res.render('admin/custom-orders', { customOrders, admin: req.session });
});

router.post('/custom-orders/update/:id', isAdmin, async (req, res) => {
  await CustomOrder.findByIdAndUpdate(req.params.id, { status: req.body.status, adminNote: req.body.adminNote });
  res.redirect('/admin/custom-orders');
});

// Support Queries
router.get('/support-queries', isAdmin, async (req, res) => {
  const queries = await SupportQuery.find().sort({ createdAt: -1 });
  res.render('admin/support-queries', { queries, admin: req.session });
});

router.post('/support-queries/reply/:id', isAdmin, async (req, res) => {
  await SupportQuery.findByIdAndUpdate(req.params.id, { reply: req.body.reply, status: 'resolved' });
  res.redirect('/admin/support-queries');
});

// Portfolio
router.get('/portfolio', isAdmin, async (req, res) => {
  let portfolio = await Portfolio.findOne();
  if (!portfolio) portfolio = new Portfolio();
  res.render('admin/portfolio', { portfolio, admin: req.session });
});

router.post('/portfolio', isAdmin, async (req, res) => {
  await Portfolio.findOneAndUpdate({}, req.body, { upsert: true });
  res.redirect('/admin/portfolio');
});

// Site Settings
router.get('/site-settings', isAdmin, async (req, res) => {
  let siteSettings = await SiteSetting.findOne();
  if (!siteSettings) siteSettings = new SiteSetting();
  res.render('admin/site-settings', { siteSettings, admin: req.session });
});

router.post('/upload-logo', isAdmin, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.json({ error: 'No file uploaded' });
  const logoUrl = '/uploads/logo/' + req.file.filename;
  await SiteSetting.findOneAndUpdate({}, { logo: logoUrl }, { upsert: true });
  res.json({ success: true, logoUrl });
});

router.post('/update-animation', isAdmin, async (req, res) => {
  await SiteSetting.findOneAndUpdate({}, {
    heroAnimation: req.body.heroAnimation,
    cardAnimation: req.body.cardAnimation,
    animationSpeed: parseInt(req.body.animationSpeed),
    backgroundAnimation: req.body.backgroundAnimation,
    customAnimationCSS: req.body.customAnimationCSS
  }, { upsert: true });
  res.redirect('/admin/site-settings');
});

module.exports = router;