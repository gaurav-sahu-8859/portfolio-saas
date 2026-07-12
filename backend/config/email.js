/**
 * Nodemailer transporter — lazily created, same pattern as config/stripe.js
 * and config/cloudinary.js. The rest of the app (and `npm run dev`) works
 * fine even if SMTP hasn't been configured yet; only utils/sendEmail.js
 * ever touches this, and it degrades to a console log instead of crashing
 * when isConfigured() is false.
 */
let transporter = null;

const isConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!transporter) {
    // eslint-disable-next-line global-require
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587/25 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

module.exports = { getTransporter, isConfigured };
