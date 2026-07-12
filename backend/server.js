const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const portfolioRoutes = require('./routes/portfolio');
const projectRoutes = require('./routes/projects');
const skillRoutes = require('./routes/skills');
const experienceRoutes = require('./routes/experience');
const educationRoutes = require('./routes/education');
const certificateRoutes = require('./routes/certificates');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const uploadRoutes = require('./routes/upload');
const themeRoutes = require('./routes/themes');
const adminThemeRoutes = require('./routes/adminThemes');
const billingRoutes = require('./routes/billing');
const familyRoutes = require('./routes/family');
const paymentRoutes = require('./routes/payment');
const adminPaymentRoutes = require('./routes/adminPayment');
const razorpayRoutes = require('./routes/payments');
const { handleWebhook } = require('./controllers/billingController');
const { handleWebhook: handleRazorpayWebhook } = require('./controllers/razorpayController');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' }
});

// Stripe webhook — MUST be mounted before express.json() below, because
// Stripe signature verification requires the exact raw request bytes.
// Every other route in this app gets parsed JSON; this one deliberately doesn't.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Razorpay webhook — same reasoning as the Stripe one directly above: HMAC
// signature verification needs the untouched raw body, so this has to be
// mounted before express.json() too, or the signature check would be
// comparing against a body Express had already parsed and re-serialized.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/certificates', certificateRoutes);
// Mounted before the generic /api/admin router so this more specific
// path is matched first (defensive — Express would fall through correctly
// either way since adminRoutes has no /themes route, but explicit > implicit).
app.use('/api/admin/themes', adminThemeRoutes);
app.use('/api/admin/payment', adminPaymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/payment', paymentRoutes);
// Plural and deliberately distinct from '/api/payment' above (the manual
// UPI flow — UPI ID + QR + admin-reviewed screenshot/UTR claims). Both are
// first-class, simultaneously-offered payment methods — the pricing page
// shows Razorpay as the recommended option, with Manual UPI alongside it
// for whichever users the admin has made it visible to (per-user
// allowlist + optional discount, see controllers/paymentController.js).
// See PricingPage.jsx / RazorpayCheckoutButton.jsx / UpiPaymentCard.jsx.
app.use('/api/payments', razorpayRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
