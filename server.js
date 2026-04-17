const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const app = express();

// ফাইল আপলোড কনফিগারেশন
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'public/uploads/';
    if (file.fieldname === 'logo') uploadPath += 'logo/';
    else if (file.fieldname === 'animation') uploadPath += 'animations/';
    else if (file.fieldname === 'softwareImage') uploadPath += 'software-images/';
    else if (file.fieldname === 'watermark') uploadPath += 'watermark/';
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session - সঠিক কনফিগারেশন
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecret',
  resave: false,
  saveUninitialized: false,  // false করা ভালো
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indianweb';
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err.message));

// ============= MODELS =============

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const SoftwareSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'Software' },
  demoUrl: { type: String },
  imageUrl: { type: String, default: '/images/default-software.jpg' },
  version: { type: String, default: '1.0.0' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
const Software = mongoose.model('Software', SoftwareSchema);

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  items: [{
    softwareId: { type: mongoose.Schema.Types.ObjectId, ref: 'Software' },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

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
const CustomOrder = mongoose.model('CustomOrder', CustomOrderSchema);

const SupportQuerySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  reply: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const SupportQuery = mongoose.model('SupportQuery', SupportQuerySchema);

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
  updatedAt: { type: Date, default: Date.now }
});
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

const SiteSettingSchema = new mongoose.Schema({
  logo: { type: String, default: '/uploads/logo/default-logo.png' },
  watermark: { type: String, default: '/uploads/watermark/default-watermark.png' },
  logoAlt: { type: String, default: 'INDIAN WEB Logo' },
  logoWidth: { type: Number, default: 150 },
  logoHeight: { type: Number, default: 50 },
  heroAnimation: { type: String, default: 'fade-up' },
  cardAnimation: { type: String, default: 'fade-up' },
  animationSpeed: { type: Number, default: 1000 },
  backgroundAnimation: { type: String, default: 'gradient-move' },
  customAnimationCSS: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});
const SiteSetting = mongoose.model('SiteSetting', SiteSettingSchema);

// ============= MIDDLEWARE =============

app.use(async (req, res, next) => {
  let siteSettings = await SiteSetting.findOne();
  if (!siteSettings) {
    siteSettings = new SiteSetting();
    await siteSettings.save();
  }
  res.locals.siteSettings = siteSettings;
  next();
});

function isAdmin(req, res, next) {
  if (req.session.userId && req.session.userRole === 'admin') return next();
  res.redirect('/admin/login');
}

// ============= CUSTOMER ROUTES =============

// Home Page
app.get('/', async (req, res) => {
  try {
    const featuredSoftware = await Software.find({ isActive: true }).limit(6);
    const portfolio = await Portfolio.findOne();
    const stats = {
      totalCustomers: await User.countDocuments({ role: 'customer' }),
      totalSoftware: await Software.countDocuments(),
      totalOrders: await Order.countDocuments()
    };
    res.render('customer/home', { 
      featuredSoftware, 
      portfolio, 
      stats, 
      user: req.session 
    });
  } catch (error) {
    console.log('Home page error:', error);
    res.render('customer/home', { 
      featuredSoftware: [], 
      portfolio: null, 
      stats: { totalCustomers: 0, totalSoftware: 0, totalOrders: 0 }, 
      user: req.session 
    });
  }
});

// Store Page
app.get('/store', async (req, res) => {
  try {
    const software = await Software.find({ isActive: true });
    res.render('customer/store', { software, user: req.session });
  } catch (error) {
    console.log(error);
    res.render('customer/store', { software: [], user: req.session });
  }
});

// Software Detail Page
app.get('/software/:slug', async (req, res) => {
  try {
    const software = await Software.findOne({ slug: req.params.slug });
    if (!software) return res.redirect('/store');
    res.render('customer/software-detail', { software, user: req.session });
  } catch (error) {
    res.redirect('/store');
  }
});

// Custom Order Page
app.get('/custom-order', (req, res) => {
  res.render('customer/custom-order', { user: req.session });
});

app.post('/custom-order', async (req, res) => {
  try {
    const { name, email, phone, softwareName, description, features, budget, timeline } = req.body;
    const customOrder = new CustomOrder({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      softwareName,
      description,
      features,
      budget,
      timeline
    });
    await customOrder.save();
    res.redirect('/custom-order?success=true');
  } catch (error) {
    res.redirect('/custom-order?error=1');
  }
});

// Support Page
app.get('/support', async (req, res) => {
  const portfolio = await Portfolio.findOne();
  res.render('customer/support', { portfolio, user: req.session });
});

app.post('/support', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const query = new SupportQuery({ name, email, subject, message });
    await query.save();
    res.redirect('/support?success=true');
  } catch (error) {
    res.redirect('/support?error=1');
  }
});

// Contact Page
app.get('/contact', async (req, res) => {
  const portfolio = await Portfolio.findOne();
  res.render('customer/contact', { portfolio, user: req.session });
});

// Cart Page
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  res.render('customer/cart', { cart, total, user: req.session });
});

// Cart API
app.get('/api/cart-count', (req, res) => {
  const cart = req.session.cart || [];
  res.json({ count: cart.length });
});

app.post('/add-to-cart', (req, res) => {
  const { softwareId, name, price } = req.body;
  if (!req.session.cart) req.session.cart = [];
  req.session.cart.push({ softwareId, name, price, quantity: 1 });
  res.json({ success: true, cartCount: req.session.cart.length });
});

app.post('/remove-from-cart', (req, res) => {
  const { index } = req.body;
  if (req.session.cart && req.session.cart[index]) {
    req.session.cart.splice(index, 1);
  }
  res.json({ success: true });
});

// ============= CUSTOMER LOGIN/REGISTER =============

// Login Page
app.get('/login', (req, res) => {
  res.render('customer/login', { error: req.query.error, user: req.session });
});

// Register Page
app.get('/register', (req, res) => {
  res.render('customer/register', { error: req.query.error, user: req.session });
});

// Login Process
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (user && user.password === password) {
      req.session.userId = user._id;
      req.session.userRole = user.role;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      
      console.log(`✅ User logged in: ${user.email} (${user.role})`);
      res.redirect('/');
    } else {
      console.log(`❌ Login failed for: ${email}`);
      res.redirect('/login?error=1');
    }
  } catch (error) {
    console.log('Login error:', error);
    res.redirect('/login?error=1');
  }
});

// Register Process
app.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (existingUser) {
      console.log(`❌ Registration failed - Email exists: ${email}`);
      res.redirect('/register?error=1');
    } else {
      const newUser = new User({ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        phone: phone || '', 
        password: password, 
        role: 'customer' 
      });
      await newUser.save();
      
      req.session.userId = newUser._id;
      req.session.userRole = 'customer';
      req.session.userName = newUser.name;
      req.session.userEmail = newUser.email;
      
      console.log(`✅ New user registered: ${newUser.email}`);
      res.redirect('/');
    }
  } catch (error) {
    console.log('Registration error:', error);
    res.redirect('/register?error=1');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ============= ADMIN ROUTES =============

// Admin Login
app.get('/admin/login', (req, res) => {
  res.render('admin/login');
});

app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    req.session.userId = 'admin';
    req.session.userRole = 'admin';
    req.session.userName = 'Newton Mandal';
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login?error=1');
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin Dashboard
app.get('/admin/dashboard', isAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    
    const revenueData = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;
    
    const customOrders = await CustomOrder.find().sort({ createdAt: -1 }).limit(5);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);
    
    res.render('admin/dashboard', { 
      totalRevenue,
      totalOrders,
      totalCustomers,
      recentOrders,
      customOrders, 
      admin: req.session 
    });
  } catch (error) {
    console.log('Dashboard error:', error);
    res.render('admin/dashboard', { 
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      recentOrders: [],
      customOrders: [], 
      admin: req.session 
    });
  }
});

// Software Management
app.get('/admin/software', isAdmin, async (req, res) => {
  try {
    const software = await Software.find().sort({ createdAt: -1 });
    res.render('admin/software', { software, admin: req.session });
  } catch (error) {
    res.render('admin/software', { software: [], admin: req.session });
  }
});

app.post('/admin/software/add', isAdmin, upload.single('softwareImage'), async (req, res) => {
  try {
    const { name, slug, description, price, category, demoUrl, version } = req.body;
    const imageUrl = req.file ? '/uploads/software-images/' + req.file.filename : '/images/default-software.jpg';
    
    const newSoftware = new Software({
      name,
      slug,
      description,
      price: Number(price),
      category: category || 'Software',
      demoUrl,
      version: version || '1.0.0',
      imageUrl,
      isActive: true
    });
    
    await newSoftware.save();
    res.redirect('/admin/software');
  } catch (error) {
    console.log(error);
    res.redirect('/admin/software?error=1');
  }
});

app.post('/admin/software/delete/:id', isAdmin, async (req, res) => {
  try {
    await Software.findByIdAndDelete(req.params.id);
    res.redirect('/admin/software');
  } catch (error) {
    res.redirect('/admin/software?error=1');
  }
});

// Custom Orders Management
app.get('/admin/custom-orders', isAdmin, async (req, res) => {
  try {
    const customOrders = await CustomOrder.find().sort({ createdAt: -1 });
    res.render('admin/custom-orders', { customOrders, admin: req.session });
  } catch (error) {
    res.render('admin/custom-orders', { customOrders: [], admin: req.session });
  }
});

app.post('/admin/custom-orders/update/:id', isAdmin, async (req, res) => {
  try {
    await CustomOrder.findByIdAndUpdate(req.params.id, { 
      status: req.body.status, 
      adminNote: req.body.adminNote 
    });
    res.redirect('/admin/custom-orders');
  } catch (error) {
    res.redirect('/admin/custom-orders?error=1');
  }
});

// Support Queries Management
app.get('/admin/support-queries', isAdmin, async (req, res) => {
  try {
    const queries = await SupportQuery.find().sort({ createdAt: -1 });
    res.render('admin/support-queries', { queries, admin: req.session });
  } catch (error) {
    res.render('admin/support-queries', { queries: [], admin: req.session });
  }
});

app.post('/admin/support-queries/reply/:id', isAdmin, async (req, res) => {
  try {
    await SupportQuery.findByIdAndUpdate(req.params.id, { 
      reply: req.body.reply, 
      status: 'resolved' 
    });
    res.redirect('/admin/support-queries');
  } catch (error) {
    res.redirect('/admin/support-queries?error=1');
  }
});

// Portfolio Management
app.get('/admin/portfolio', isAdmin, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne();
    if (!portfolio) portfolio = new Portfolio();
    res.render('admin/portfolio', { portfolio, admin: req.session });
  } catch (error) {
    res.render('admin/portfolio', { portfolio: null, admin: req.session });
  }
});

app.post('/admin/portfolio', isAdmin, async (req, res) => {
  try {
    await Portfolio.findOneAndUpdate({}, req.body, { upsert: true });
    res.redirect('/admin/portfolio');
  } catch (error) {
    res.redirect('/admin/portfolio?error=1');
  }
});

// Site Settings
app.get('/admin/site-settings', isAdmin, async (req, res) => {
  try {
    let siteSettings = await SiteSetting.findOne();
    if (!siteSettings) siteSettings = new SiteSetting();
    res.render('admin/site-settings', { siteSettings, admin: req.session });
  } catch (error) {
    res.render('admin/site-settings', { siteSettings: null, admin: req.session });
  }
});

// Logo Upload
app.post('/admin/upload-logo', isAdmin, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.json({ error: 'No file uploaded' });
    const logoUrl = '/uploads/logo/' + req.file.filename;
    await SiteSetting.findOneAndUpdate({}, { logo: logoUrl, updatedAt: Date.now() }, { upsert: true });
    res.json({ success: true, logoUrl });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Watermark Upload
app.post('/admin/upload-watermark', isAdmin, upload.single('watermark'), async (req, res) => {
  try {
    if (!req.file) return res.json({ error: 'No file uploaded' });
    const watermarkUrl = '/uploads/watermark/' + req.file.filename;
    await SiteSetting.findOneAndUpdate({}, { watermark: watermarkUrl, updatedAt: Date.now() }, { upsert: true });
    res.json({ success: true, watermarkUrl });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Update Animation
app.post('/admin/update-animation', isAdmin, async (req, res) => {
  try {
    await SiteSetting.findOneAndUpdate({}, {
      heroAnimation: req.body.heroAnimation,
      cardAnimation: req.body.cardAnimation,
      animationSpeed: parseInt(req.body.animationSpeed),
      backgroundAnimation: req.body.backgroundAnimation,
      customAnimationCSS: req.body.customAnimationCSS
    }, { upsert: true });
    res.redirect('/admin/site-settings');
  } catch (error) {
    res.redirect('/admin/site-settings?error=1');
  }
});

// Sales Report
app.get('/admin/sales-report', isAdmin, async (req, res) => {
  try {
    const daily = await Order.aggregate([
      { $match: { status: 'completed' } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          total: { $sum: "$totalAmount" }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: -1 } }
    ]);
    res.render('admin/sales-report', { daily, admin: req.session });
  } catch (error) {
    res.render('admin/sales-report', { daily: [], admin: req.session });
  }
});

// Create Test Admin
app.get('/create-test-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'newtonmandal@indianweb.com' });
    
    if (existingAdmin) {
      res.send('Admin user already exists!');
    } else {
      const admin = new User({
        name: 'Newton Mandal',
        email: process.env.ADMIN_EMAIL || 'newtonmandal@indianweb.com',
        phone: '9876543210',
        password: process.env.ADMIN_PASSWORD || 'Newton@2025',
        role: 'admin'
      });
      await admin.save();
      res.send('✅ Admin user created!');
    }
  } catch (error) {
    res.send('Error: ' + error.message);
  }
});

// ============= START SERVER =============
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 INDIAN WEB running on http://localhost:${PORT}`);
  console.log(`📱 Customer Panel: http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin/login`);
  console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || 'newtonmandal@indianweb.com'}`);
  console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD || 'Newton@2025'}`);
});