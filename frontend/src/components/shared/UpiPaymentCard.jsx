import { useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentAPI, uploadAPI } from '../../services/api';
import { Spinner } from './UI';
import toast from 'react-hot-toast';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

const formatRupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: (paise / 100) % 1 ? 2 : 0 })}`;

// A plain `upi://pay` link is handled by EVERY UPI app on Android (the OS
// shows an app picker, or opens the only one installed) — that's how UPI
// deep-linking works by design, no per-app integration needed for the
// core flow. The app-specific schemes below (tez/phonepe/paytmmp) exist
// only as a convenience fallback for browsers/WebViews where the generic
// intent doesn't reliably trigger a picker.
const buildUpiUri = (scheme, { upiId, payeeName, amount, note }) => {
  const params = new URLSearchParams();
  params.set('pa', upiId);
  if (payeeName) params.set('pn', payeeName);
  if (amount) params.set('am', String(amount));
  params.set('cu', 'INR');
  if (note) params.set('tn', note);
  return `${scheme}?${params.toString()}`;
};

/**
 * `config` is what paymentAPI.getConfig(themeKey) returned — already
 * fully resolved server-side (see paymentController.getPublicConfig /
 * isEligibleForUpi): if the current user isn't allowed to see Manual UPI
 * right now (globally disabled, not on the allowlist, wrong plan scope),
 * `config.isEnabled` is simply false and this component renders nothing.
 * There's no client-side eligibility logic to duplicate or get out of
 * sync with the server here — one guard, right below.
 */
export default function UpiPaymentCard({ config, themeKey, themeName, loggedIn = false, onSuccess }) {
  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null); // { url, publicId, previewUrl }
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!config?.isEnabled || !config?.upiId) return null;

  const pricing = config.pricing || {};
  const hasDiscount = (pricing.discountAmount || 0) > 0;
  const payAmountRupees = pricing.finalAmount ? pricing.finalAmount / 100 : undefined;

  const upiDetails = { upiId: config.upiId, payeeName: config.payeeName, amount: payAmountRupees, note: themeName ? `PortfolioForge — ${themeName}` : 'PortfolioForge Pro' };
  const genericUri = buildUpiUri('upi://pay', upiDetails);
  // No payment gateway involved — this is a free, no-API-key public QR
  // rendering service, used purely to draw a scannable code for the UPI
  // string (now including the discounted amount, so scanning prefills the
  // right figure instead of leaving it blank). Admin-uploaded QR
  // (config.qrCodeUrl) always takes priority.
  const qrImage = config.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(genericUri)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.upiId);
      setCopied(true);
      toast.success('UPI ID copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — long-press the UPI ID to copy manually');
    }
  };

  const handlePayNow = (scheme) => {
    window.location.href = buildUpiUri(scheme, upiDetails);
  };

  const handleScreenshotPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Screenshot must be under 5MB'); return; }

    setUploadingScreenshot(true);
    const previewUrl = URL.createObjectURL(file);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await uploadAPI.image(formData);
      setScreenshot({ url: data.url, publicId: data.publicId, previewUrl });
      toast.success('Screenshot uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Screenshot upload failed');
      setScreenshot(null);
    } finally { setUploadingScreenshot(false); }
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!utr.trim() && !screenshot) {
      toast.error('Add your UTR / transaction ID, or upload a payment screenshot');
      return;
    }
    setSubmitting(true);
    try {
      await paymentAPI.submitVerification({
        utr: utr.trim(),
        screenshotUrl: screenshot?.url || '',
        themeKey,
      });
      setSubmitted(true);
      toast.success('Submitted for verification!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-semibold text-white text-sm">Pay via UPI</h3>
        {hasDiscount && <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full flex-shrink-0">Discount applied</span>}
      </div>
      {config.note && <p className="text-xs text-gray-400 mb-2">{config.note}</p>}

      {pricing.finalAmount != null && (
        <div className="flex items-baseline gap-2 mb-4">
          {hasDiscount && <span className="text-sm text-gray-500 line-through">{formatRupees(pricing.originalAmount)}</span>}
          <span className="text-2xl font-extrabold text-white">{formatRupees(pricing.finalAmount)}</span>
          {hasDiscount && <span className="text-xs text-green-400">you save {formatRupees(pricing.discountAmount)}</span>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start mb-5">
        <img src={qrImage} alt="UPI QR code" className="w-36 h-36 rounded-lg bg-white p-1.5 flex-shrink-0" />
        <div className="flex-1 w-full">
          <p className="label">UPI ID</p>
          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 bg-dark-700 px-3 py-2 rounded-lg text-sm text-gray-200 font-mono truncate">{config.upiId}</code>
            <button onClick={handleCopy} className="btn-secondary text-xs px-3 py-2 flex-shrink-0">{copied ? 'Copied!' : 'Copy'}</button>
          </div>

          {isMobile() ? (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handlePayNow('upi://pay')} className="btn-primary text-xs">Open UPI App</button>
              <button onClick={() => handlePayNow('tez://upi/pay')} className="btn-secondary text-xs">Google Pay</button>
              <button onClick={() => handlePayNow('phonepe://pay')} className="btn-secondary text-xs">PhonePe</button>
              <button onClick={() => handlePayNow('paytmmp://pay')} className="btn-secondary text-xs">Paytm</button>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Scan the QR code with any UPI app — Google Pay, PhonePe, Paytm, or BHIM — to pay from your phone.</p>
          )}
        </div>
      </div>

      {!loggedIn ? (
        <div className="border-t border-dark-600 pt-4">
          <p className="text-xs text-gray-400">
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link> to submit your payment for verification once you've paid.
          </p>
        </div>
      ) : submitted ? (
        <div className="border-t border-dark-600 pt-4">
          <p className="text-xs text-green-400">✓ Submitted — an admin will review and activate your Pro plan shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmitVerification} className="border-t border-dark-600 pt-4 space-y-3">
          <p className="text-xs text-gray-400">Already paid? Submit your UTR / transaction ID, a screenshot, or both, so an admin can verify it.</p>
          <input value={utr} onChange={e => setUtr(e.target.value)} placeholder="UPI transaction ID / UTR" className="input-field w-full" />

          <div>
            <label className="btn-secondary text-xs inline-flex cursor-pointer">
              {uploadingScreenshot ? <><Spinner size="sm" /> Uploading...</> : screenshot ? 'Replace screenshot' : 'Upload payment screenshot'}
              <input type="file" accept="image/*" onChange={handleScreenshotPick} disabled={uploadingScreenshot} className="hidden" />
            </label>
            {screenshot && (
              <div className="mt-2 flex items-center gap-2">
                <img src={screenshot.previewUrl} alt="Payment screenshot preview" className="w-14 h-14 rounded-lg object-cover border border-dark-500" />
                <span className="text-xs text-green-400">Screenshot ready</span>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting || uploadingScreenshot} className="btn-primary text-xs w-full justify-center">
            {submitting ? <Spinner size="sm" /> : 'Submit for Review'}
          </button>
        </form>
      )}
    </div>
  );
}
