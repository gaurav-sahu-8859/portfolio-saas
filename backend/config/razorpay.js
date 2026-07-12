/**
 * Razorpay client — lazily created so the rest of the app (and `npm run dev`)
 * works fine even if Razorpay hasn't been configured yet. Mirrors the
 * existing config/stripe.js pattern: only the payments routes ever touch
 * this, everything else in the app is unaffected by whether Razorpay keys
 * are present.
 */
let razorpayClient = null;

const isConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpay = () => {
  if (!isConfigured()) return null;
  if (!razorpayClient) {
    // eslint-disable-next-line global-require
    const Razorpay = require('razorpay');
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

module.exports = { getRazorpay, isConfigured };
