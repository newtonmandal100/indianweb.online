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

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indianweb';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// Models
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
  status: { type: String, enum: ['pending', 'reviewed', 'approved', 'completed'], default: 'pending' },
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

const SiteSettingSchema = new mongoose.Schema({
  logo: { type: String, default: '/uploads/logo/default-logo.png' },
  heroAnimation: { type: String, default: 'fade-up' },
  cardAnimation: { type: String, default: 'fade-up' },
  animationSpeed: { type: Number, default: 1000 },
  backgroundAnimation: { type: String, default: 'gradient-move' }
});
const SiteSetting = mongoose.model('SiteSetting', SiteSettingSchema);

// Middleware for site settings
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

// Routes
app.get('/', async (req, res) => {
  const featuredSoftware = await Software.find({ isActive: true }).limit(6);
  res.render('customer/home', { featuredSoftware, user: req.session });
});

app.get('/store', async (req, res) => {
  const software = await Software.find({ isActive: true });
  res.render('customer/store', { software, user: req.session });
});

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

app.get('/admin/dashboard', isAdmin, async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const customOrders = await CustomOrder.find().sort({ createdAt: -1 }).limit(5);
  res.render('admin/dashboard', { totalOrders, customOrders, admin: req.session });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

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

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 INDIAN WEB running on http://localhost:${PORT}`);
  console.log(`📱 Customer Panel: http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin/login`);
});