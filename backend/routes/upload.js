const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const { upload, cloudinary } = require('../config/cloudinary');
const Portfolio = require('../models/Portfolio');

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
router.post('/image', protect, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }
  res.json({ url: req.file.path, publicId: req.file.filename });
}));

// @desc    Upload profile picture
// @route   POST /api/upload/avatar
// @access  Private
router.post('/avatar', protect, upload.single('profilePicture'), asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }
  res.json({ url: req.file.path, publicId: req.file.filename });
}));

// @desc    Upload resume
// @route   POST /api/upload/resume
// @access  Private
router.post('/resume', protect, upload.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }
  await Portfolio.findOneAndUpdate(
    { user: req.user._id },
    { $set: { resumeUrl: req.file.path } },
    { upsert: true }
  );
  res.json({ url: req.file.path, publicId: req.file.filename });
}));

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:publicId?resourceType=raw
// @access  Private
router.delete('/:publicId', protect, asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  // Cloudinary's destroy call must match the resource_type the asset was
  // uploaded with, or it silently no-ops. Resumes are uploaded as `raw`
  // (see config/cloudinary.js) — defaults to `image` for backward
  // compatibility with avatar/project-image deletes.
  const resourceType = req.query.resourceType === 'raw' ? 'raw' : 'image';
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  res.json({ message: 'File deleted' });
}));

module.exports = router;
