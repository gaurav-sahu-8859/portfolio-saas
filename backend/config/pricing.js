/**
 * The ONE place the Pro plan's base price lives. Both payment methods read
 * from here:
 *   - razorpayController.js charges exactly this amount via Razorpay
 *   - paymentController.js's computeUpiPricing() treats this as the
 *     "original price" that a Manual UPI discount is calculated off of
 *
 * Previously this constant lived only inside razorpayController.js. Moved
 * here when Manual UPI needed the same number, so there's exactly one env
 * var and one default to change, instead of two copies that could drift.
 */
const PRO_PLAN_AMOUNT_PAISE = Number(process.env.RAZORPAY_PRO_PLAN_AMOUNT_PAISE) || 69900; // ₹699.00
const CURRENCY = 'INR';

module.exports = { PRO_PLAN_AMOUNT_PAISE, CURRENCY };
