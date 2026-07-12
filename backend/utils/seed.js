const mongoose = require('mongoose');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Theme = require('../models/Theme');
const IMPLEMENTED_THEMES = require('../config/implementedThemeKeys');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── 1. Seed the theme catalog (idempotent) ──────────────────────────
  const existingThemeCount = await Theme.countDocuments({});
  if (existingThemeCount === 0) {
    const docs = IMPLEMENTED_THEMES.map((t, i) => ({
      ...t,
      order: i,
      isDefault: t.key === 'modern-saas', // platform ships with Modern SaaS as default
    }));
    await Theme.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} themes into catalog (default: modern-saas)`);
  } else {
    console.log(`ℹ️  Theme catalog already has ${existingThemeCount} themes — skipping seed`);
  }

  // ── 2. Create super_admin / owner account ───────────────────────────
  // The owner is the platform's ultimate role (super_admin), not a regular
  // 'admin' — there can be many 'admin' accounts created later via
  // /api/admin/users/:id/promote, but only super_admin can create or
  // remove them. If you're upgrading an existing deployment that already
  // seeded an 'admin' owner under a previous version, that account keeps
  // working as a regular admin; promote it to super_admin manually via a
  // one-time DB update if you want it to hold ultimate ownership instead —
  // there's deliberately no API route that can create a second super_admin.
  const ownerUsername = (process.env.OWNER_USERNAME || 'gauravsahu').toLowerCase();
  const existing = await User.findOne({ email: 'admin@portfolio.dev' });
  if (!existing) {
    const admin = await User.create({
      name: 'Gaurav Sahu',
      username: ownerUsername,
      email: 'admin@portfolio.dev',
      password: 'Admin@123',
      role: 'super_admin'
    });
    const defaultTheme = await Theme.findOne({ isDefault: true });
    await Portfolio.create({
      user: admin._id,
      fullName: 'Gaurav Sahu',
      isPublished: true,
      theme: defaultTheme?.key || 'modern-saas',
    });
    console.log(`✅ Owner created as super_admin: ${ownerUsername} / admin@portfolio.dev / Admin@123`);
  } else {
    if (!existing.username) {
      existing.username = ownerUsername;
      await existing.save({ validateBeforeSave: false });
      console.log(`✅ Added username "${ownerUsername}" to existing admin`);
    } else {
      console.log('ℹ️  Admin already exists:', existing.username);
    }
  }

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
