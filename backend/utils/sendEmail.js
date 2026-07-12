const { getTransporter, isConfigured } = require('../config/email');

/**
 * Sends an email, or — if SMTP isn't configured — logs what WOULD have
 * been sent to the server console instead of crashing. This is exactly the
 * same graceful-degradation pattern as billingController's Stripe checks:
 * local development and CI never need real credentials to exercise the
 * flow end-to-end.
 *
 * IMPORTANT: this only ever logs to the SERVER console, never back to the
 * HTTP response — that distinction is what keeps forgotPassword's "don't
 * reveal whether an email exists" guarantee intact even when SMTP is off.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isConfigured()) {
    console.log('\n📧 [DEV] SMTP not configured — email was not actually sent. Contents:');
    console.log(`To: ${to}\nSubject: ${subject}\n${text || html}\n`);
    return { simulated: true };
  }

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || '"PortfolioForge" <no-reply@portfolioforge.dev>';

  await transporter.sendMail({ from, to, subject, html, text });
  return { simulated: false };
};

module.exports = sendEmail;
