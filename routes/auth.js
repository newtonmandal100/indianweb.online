const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Customer Registration
router.get('/register', (req, res) => {
  res.render('customer/register', { user: req.session });
});

router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, phone, password: hashedPassword, role: 'customer' });
  await user.save();
  req.session.userId = user._id;
  req.session.userRole = user.role;
  req.session.userName = user.name;
  res.redirect('/');
});

// Customer Login
router.get('/login', (req, res) => {
  res.render('customer/login', { user: req.session });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;