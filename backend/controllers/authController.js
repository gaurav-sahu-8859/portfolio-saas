const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { generateToken } = require('../middleware/authMiddleware');
const { isPremiumEntitled } = require('../utils/entitlements');
const sendEmail = require('../utils/sendEmail');

// @desc    Register
// @route   POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    res.status(400); throw new Error('Please provide all required fields');
  }
  if (password.length < 6) { res.status(400); throw new Error('Password must be at least 6 characters'); }

  const cleanUsername = username.toLowerCase().trim();
  if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
    res.status(400); throw new Error('Username can only contain letters, numbers, hyphens and underscores');
  }

  const [emailExists, usernameExists] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username: cleanUsername })
  ]);
  if (emailExists)    { res.status(400); throw new Error('Email already registered'); }
  if (usernameExists) { res.status(400); throw new Error('Username already taken'); }

  const user = await User.create({ name, username: cleanUsername, email, password });

  // New portfolios inherit whatever theme the admin has currently marked as
  // default — this satisfies "when a new user opens their portfolio, the
  // default theme selected by admin should load automatically."
  // Falls back to 'modern-saas' only if the catalog hasn't been seeded yet.
  const Theme = require('../models/Theme');
  const defaultTheme = await Theme.findOne({ isDefault: true, isEnabled: true });
  await Portfolio.create({ user: user._id, fullName: name, theme: defaultTheme?.key || 'modern-saas' });

  res.status(201).json({
    _id: user._id, name: user.name, username: user.username,
    email: user.email, role: user.role, plan: user.plan,
    entitlement: isPremiumEntitled(user), token: generateToken(user._id)
  });
});

// @desc    Login
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // console.log(email, password);
  if (!email || !password) { res.status(400); throw new Error('Please provide email and password'); }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid email or password');
  }
  if (!user.isActive) { res.status(401); throw new Error('Account deactivated. Contact support.'); }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    _id: user._id, name: user.name, username: user.username,
    email: user.email, role: user.role, avatar: user.avatar, plan: user.plan,
    entitlement: isPremiumEntitled(user), token: generateToken(user._id)
  });
});

// @desc    Get me
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ ...user.toJSON(), entitlement: isPremiumEntitled(user) });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401); throw new Error('Current password is incorrect');
  }
  if (newPassword.length < 6) { res.status(400); throw new Error('New password must be at least 6 characters'); }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// @desc    Check username availability
// @route   GET /api/auth/check-username/:username
const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const exists = await User.findOne({ username: username.toLowerCase() });
  res.json({ available: !exists });
});

// Inline, dependency-free HTML email template — email clients don't load
// external stylesheets, so styling has to be inline like this.
const buildResetEmail = ({ name, resetUrl }) => {
  const subject = 'Reset your PortfolioForge password';
  const text = `Hi ${name},\n\nYou requested a password reset. This link expires in 20 minutes:\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
  <div style="background:#0a0a12;padding:40px 20px;font-family:Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#16161d;border:1px solid #26263a;border-radius:16px;overflow:hidden;">
      <div style="padding:32px 32px 0;text-align:center;">
        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#9333ea);display:inline-block;line-height:48px;color:#fff;font-weight:bold;font-size:16px;">PF</div>
      </div>
      <div style="padding:24px 32px 32px;">
        <h1 style="color:#fff;font-size:20px;margin:0 0 12px;text-align:center;">Reset your password</h1>
        <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Hi ${name}, we received a request to reset your PortfolioForge password. This link is valid for the next 20 minutes.
        </p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
            Reset Password
          </a>
        </div>
        <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0 0 8px;">
          If the button doesn't work, copy this link into your browser:
        </p>
        <p style="color:#818cf8;font-size:12px;word-break:break-all;margin:0 0 24px;">${resetUrl}</p>
        <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0;">
          Didn't request this? You can safely ignore this email — your password won't change.
        </p>
      </div>
    </div>
  </div>`;
  return { subject, html, text };
};

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400); throw new Error('Email is required'); }

  // Same status, same JSON shape, returned whether or not the email
  // exists — this object IS the security control for "don't reveal
  // whether an email is registered," not just a UI nicety.
  const genericResponse = { message: 'If an account exists for that email, a password reset link has been sent.' };

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.json(genericResponse);
  }

  const resetToken = user.getResetPasswordToken(); // raw token; hash + expiry set on the in-memory doc
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  const { subject, html, text } = buildResetEmail({ name: user.name, resetUrl });

  try {
    await sendEmail({ to: user.email, subject, html, text });
  } catch (err) {
    // A genuine send failure is an infra problem, not a privacy concern —
    // clear the now-useless token so it can't linger, and surface a real
    // error instead of the generic message (nothing left to protect here;
    // the user already knows their own email didn't get anything).
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('Failed to send password reset email:', err.message);
    res.status(500);
    throw new Error('Could not send the reset email — please try again shortly');
  }

  res.json(genericResponse);
});

// @desc    Reset password using the raw token from the emailed link
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400); throw new Error('Password must be at least 6 characters');
  }

  // Hash the INCOMING raw token the same way it was hashed at generation
  // time, then look up by hash — the raw token itself is never stored or
  // searched for directly.
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }, // expired tokens simply don't match — fails securely, no special-casing needed
  }).select('+password +resetPasswordToken +resetPasswordExpire');

  if (!user) {
    res.status(400);
    throw new Error('This reset link is invalid or has expired — request a new one');
  }

  user.password = password; // pre-save hook on the model hashes this
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save(); // full validation runs here, same as any other password change

  res.json({ message: 'Password reset successful — you can now log in with your new password' });
});

module.exports = {
  register, login, getMe, changePassword, checkUsername,
  forgotPassword, resetPassword,
};
