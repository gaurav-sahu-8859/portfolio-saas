/**
 * Stripe client — lazily created so the rest of the app (and `npm run dev`)
 * works fine even if billing hasn't been configured yet. Only the billing
 * routes themselves ever touch this; everything else in the app is
 * unaffected by whether Stripe keys are present.
 */
let stripeClient = null;

const isConfigured = () => !!process.env.STRIPE_SECRET_KEY;

const getStripe = () => {
  if (!isConfigured()) return null;
  if (!stripeClient) {
    // eslint-disable-next-line global-require
    const Stripe = require('stripe');
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  }
  return stripeClient;
};

module.exports = { getStripe, isConfigured };
