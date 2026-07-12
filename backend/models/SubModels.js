const mongoose = require('mongoose');

// Skill Schema
const skillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  level: { type: Number, min: 0, max: 100, default: 80 },
  category: {
    type: String,
    enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Mobile', 'Design', 'Other'],
    default: 'Other'
  },
  icon: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

// Experience Schema
const experienceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  location: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

// Education Schema
const educationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  school: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  field: { type: String, default: '' },
  startYear: { type: Number, required: true },
  endYear: { type: Number },
  current: { type: Boolean, default: false },
  grade: { type: String, default: '' },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

// Certificate Schema
const certificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  organization: { type: String, required: true, trim: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date },
  credentialId: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = {
  Skill: mongoose.model('Skill', skillSchema),
  Experience: mongoose.model('Experience', experienceSchema),
  Education: mongoose.model('Education', educationSchema),
  Certificate: mongoose.model('Certificate', certificateSchema)
};
