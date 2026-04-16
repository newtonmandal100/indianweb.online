const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user) {
      req.user = user;
      return next();
    }
  }
  res.redirect('/login');
};

const isAdmin = async (req, res, next) => {
  if (req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  res.redirect('/admin/login');
};

const isCustomer = async (req, res, next) => {
  if (req.session.userId && req.session.userRole === 'customer') {
    return next();
  }
  res.redirect('/login');
};

module.exports = { isAuthenticated, isAdmin, isCustomer };