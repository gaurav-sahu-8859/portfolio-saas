const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Personal Info
  fullName: { type: String, trim: true, default: '' },
  tagline: { type: String, trim: true, default: '' },
  title: { type: String, trim: true, default: '' },
  bio: { type: String, trim: true, default: '' },
  profilePicture: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  // Cloudinary public_id for the resume, only present for resumes uploaded
  // with the private delivery type (see config/cloudinary.js +
  // utils/resolveResumeUrl.js). Needed to regenerate a fresh signed
  // download URL on every view — empty for legacy resumes uploaded before
  // this field existed, which fall back to resumeUrl directly.
  resumePublicId: { type: String, default: '' },
  // Contact
  contact: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  // Social Links
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },
  // Settings
  isPublished: { type: Boolean, default: false },
  // NOTE: no `enum` here on purpose. The set of valid values is the admin-
  // curated Theme catalog (see models/Theme.js), which can change without a
  // code deploy. Validity is enforced in portfolioController.updateMyTheme,
  // not at the schema level.
  theme: {
    type: String,
    default: 'modern-saas',
    trim: true,
    lowercase: true,
  },
  accentColor: { type: String, default: '#6366f1' },
  // Section ordering & visibility
  sections: {
    type: [String],
    default: ['hero', 'about', 'skills', 'projects', 'experience', 'education', 'certificates', 'contact']
  },
  // SEO
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  // Stats
  views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
