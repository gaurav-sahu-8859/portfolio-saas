import { useState } from 'react';
import { Link } from 'react-router-dom';
import { razorpayAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from './UI';

const CHECKOUT_SCRIPT_ID = 'razorpay-checkout-js';
const CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

// Loads the Razorpay Checkout script exactly once, no matter how many times
// this component mounts (e.g. re-visiting /pricing) — cached on
// `window.Razorpay` after the first successful load, and the in-flight
// promise is reused if a second mount asks again before it finishes.
let scriptLoadPromise = null;
function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve) => {
    const existing = document.getElementById(CHECKOUT_SCRIPT_ID);
    if (existing) { existing.addEventListener('load', () => resolve(true)); return; }
    const script = document.createElement('script');
    script.id = CHECKOUT_SCRIPT_ID;
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => { scriptLoadPromise = null; resolve(false); };
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

const formatAmount = (paise, currency) => {
  const amount = paise / 100;
  return currency === 'INR'
    ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: amount % 1 ? 2 : 0 })}`
    : `${amount.toFixed(2)} ${currency}`;
};

/**
 * The "recommended" payment option on the pricing page, shown alongside
 * (not instead of) <UpiPaymentCard/> — see PricingPage.jsx for how the two
 * are laid out together.
 * Handles the full lifecycle in place, no page redirect (unlike the Stripe
 * button elsewhere on this page, which does redirect — Razorpay Checkout is
 * a JS modal, so success/failure can be shown right here instead):
 *
 *   idle → creating order → Razorpay modal open → verifying signature
 *        → success | failed (with Retry, which just re-runs the whole flow)
 *
 * `themeKey` / `themeName` are optional — set when the user clicked
 * "Unlock with Pro" on one specific locked theme (see DashboardThemesPage /
 * ThemeSwitcherBar) rather than the generic "Upgrade to Pro" button. Either
 * way, a successful payment grants the whole Pro plan (see
 * utils/entitlements.js) — this only changes what gets recorded on the
 * Payment document and the wording shown here.
 */
export default function RazorpayCheckoutButton({ themeKey, themeName, config, className = '' }) {
  const { refreshUser } = useAuth();
  const [state, setState] = useState('idle'); // idle | creating | verifying | success | failed
  const [errorMsg, setErrorMsg] = useState('');

  const startCheckout = async () => {
    setState('creating');
    setErrorMsg('');
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error('Could not load Razorpay Checkout — check your connection and try again');
      }

      const { data: order } = await razorpayAPI.createOrder(themeKey);

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          setState('verifying');
          try {
            await razorpayAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refreshUser();
            setState('success');
          } catch (e) {
            setErrorMsg(e.response?.data?.message || 'Payment verification failed — if any amount was deducted, it will be auto-refunded by Razorpay.');
            setState('failed');
          }
        },
        modal: {
          // User closed the Checkout modal without paying — not an error,
          // just back to idle so "Upgrade to Pro" is clickable again.
          ondismiss: () => setState((s) => (s === 'creating' ? 'idle' : s)),
        },
      });

      rzp.on('payment.failed', (response) => {
        razorpayAPI.recordFailure({
          razorpay_order_id: response.error?.metadata?.order_id || order.orderId,
          reason: response.error?.description || 'Payment failed',
        }).catch(() => {});
        setErrorMsg(response.error?.description || 'Payment failed — no charge was made.');
        setState('failed');
      });

      rzp.open();
      // Checkout modal is now driving the UI; leave `state` as 'creating'
      // (renders the button's spinner) until handler/on-failed/ondismiss
      // above resolves it — there's no separate "open" state to track.
    } catch (e) {
      setErrorMsg(e.response?.data?.message || e.message || 'Could not start checkout');
      setState('failed');
    }
  };

  if (state === 'success') {
    return (
      <div className={`card border-green-500/30 bg-green-500/5 text-center ${className}`}>
        <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="font-semibold text-white text-sm mb-1">You're on Pro!</h3>
        <p className="text-xs text-gray-400 mb-4">{themeName ? `"${themeName}" is unlocked, along with every premium theme.` : 'Premium themes are unlocked.'}</p>
        <Link to="/dashboard/themes" className="btn-primary w-full justify-center text-sm">Browse Premium Themes</Link>
      </div>
    );
  }

  if (state === 'failed') {
    return (
      <div className={`card border-red-500/30 bg-red-500/5 text-center ${className}`}>
        <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h3 className="font-semibold text-white text-sm mb-1">Payment didn't go through</h3>
        <p className="text-xs text-gray-400 mb-4">{errorMsg}</p>
        <button onClick={startCheckout} className="btn-primary w-full justify-center text-sm">Retry Payment</button>
      </div>
    );
  }

  const isBusy = state === 'creating' || state === 'verifying';
  return (
    <button onClick={startCheckout} disabled={isBusy || !config?.isConfigured} className={`btn-primary w-full justify-center ${className}`}>
      {state === 'verifying' ? <><Spinner size="sm" /> Verifying payment...</>
        : state === 'creating' ? <><Spinner size="sm" /> Opening checkout...</>
        : themeName ? `Unlock "${themeName}" — ${config ? formatAmount(config.amount, config.currency) : ''}`
        : `Upgrade to Pro${config ? ` — ${formatAmount(config.amount, config.currency)}/mo` : ''}`}
    </button>
  );
}
