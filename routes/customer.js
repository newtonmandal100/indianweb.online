const express = require('express');
const router = express.Router();
const Software = require('../models/Software');
const Order = require('../models/Order');
const CustomOrder = require('../models/CustomOrder');
const SupportQuery = require('../models/SupportQuery');
const Portfolio = require('../models/Portfolio');

// Home Page
router.get('/', async (req, res) => {
  const featuredSoftware = await Software.find({ isActive: true }).limit(6);
  const portfolio = await Portfolio.findOne();
  res.render('customer/home', { featuredSoftware, portfolio, user: req.session });
});

// Store Page
router.get('/store', async (req, res) => {
  const software = await Software.find({ isActive: true });
  res.render('customer/store', { software, user: req.session });
});

// Software Detail
router.get('/software/:slug', async (req, res) => {
  const software = await Software.findOne({ slug: req.params.slug });
  res.render('customer/software-detail', { software, user: req.session });
});

// Cart
router.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  res.render('customer/cart', { cart, total, user: req.session });
});

// Custom Order
router.get('/custom-order', (req, res) => {
  res.render('customer/custom-order', { user: req.session });
});

router.post('/custom-order', async (req, res) => {
  const { name, email, phone, softwareName, description, features, budget, timeline } = req.body;
  const customOrder = new CustomOrder({ customerName: name, customerEmail: email, customerPhone: phone, softwareName, description, features, budget, timeline });
  await customOrder.save();
  res.redirect('/custom-order?success=true');
});

// Support
router.get('/support', async (req, res) => {
  const portfolio = await Portfolio.findOne();
  res.render('customer/support', { portfolio, user: req.session });
});

router.post('/support', async (req, res) => {
  const { name, email, subject, message } = req.body;
  await new SupportQuery({ name, email, subject, message }).save();
  res.redirect('/support?success=true');
});

// Contact
router.get('/contact', async (req, res) => {
  const portfolio = await Portfolio.findOne();
  res.render('customer/contact', { portfolio, user: req.session });
});

module.exports = router;