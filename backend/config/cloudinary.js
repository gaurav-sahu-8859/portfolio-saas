const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'portfolio-saas/general';
    if (file.fieldname === 'profilePicture') folder = 'portfolio-saas/avatars';
    if (file.fieldname === 'projectImage') folder = 'portfolio-saas/projects';
    if (file.fieldname === 'resume') folder = 'portfolio-saas/resumes';
    if (file.fieldname === 'certificate') folder = 'portfolio-saas/certificates';

    const isResume = file.fieldname === 'resume';

    return {
      folder,
      // PDFs upload as `raw` (not `image`/`auto`) so Cloudinary's image
      // pipeline never touches them and they keep a correct PDF
      // content-type on delivery. Delivery type is left as the default
      // `upload` — NOT `private` — so the resulting secure_url is a
      // plain, directly-fetchable link with no signing/regeneration
      // required on every view. See README for why this is simpler and
      // more reliable than the private-delivery approach tried earlier.
      resource_type: isResume ? 'raw' : 'image',
      // type: isResume ? 'private' : 'upload',
      // For `raw` assets, Cloudinary uses whatever you give it as the
      // delivery path verbatim — baking `.pdf` into the public_id itself
      // is the documented way to guarantee the resulting URL actually
      // ends in .pdf (the `format` option isn't meaningful for raw uploads).
      public_id: isResume ? `resume-${Date.now()}-${Math.round(Math.random() * 1e6)}.pdf` : undefined,
      allowed_formats: isResume
        ? ['pdf']
        : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: file.fieldname === 'profilePicture'
        ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
        : undefined
    };
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  }
});

module.exports = { cloudinary, upload };
