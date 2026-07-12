import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { billingAPI, razorpayAPI, paymentAPI } from '../services/api';
import { Spinner, Badge } from '../components/shared/UI';
import RazorpayCheckoutButton from '../components/shared/RazorpayCheckoutButton';
import UpiPaymentCard from '../components/shared/UpiPaymentCard';
import toast from 'react-hot-toast';

const FREE_FEATURES = ['1 portfolio', '8 standard themes', 'Username URL', 'Resume upload', 'Basic analytics'];
const PRO_FEATURES = ['Everything in Free', '2 exclusive premium themes', 'Executive Suite & Neon Cyber Pro layouts', 'Priority support', 'Cancel anytime'];
const TEAM_FEATURES = ['Everything in Pro', 'Multiple portfolios', 'Team management', 'SSO', 'Dedicated support'];

export default function PricingPage() {
  const { user, isPro, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [billingConfigured, setBillingConfigured] = useState(true); // Stripe — now a secondary/optional path, see razorpayConfig below
  const [razorpayConfig, setRazorpayConfig] = useState(null);
  const [upiConfig, setUpiConfig] = useState(null);

  // Set when the user arrived here via "Unlock with Pro" on one specific
  // locked theme (DashboardThemesPage / ThemeSwitcherBar) rather than the
  // generic "Upgrade to Pro" button — threaded through to Razorpay so the
  // resulting Payment record shows which theme prompted the purchase.
  const themeKey = searchParams.get('theme') || undefined;
  const themeName = searchParams.get('themeName') || undefined;

  useEffect(() => {
    if (!user) return;
    billingAPI.getMyBilling().then(r => setBillingConfigured(r.data.billingConfigured)).catch(() => {});
  }, [user]);

  useEffect(() => {
    razorpayAPI.getConfig()
      .then(r => setRazorpayConfig(r.data))
      .catch((e) => {
        console.error('[PricingPage] Failed to load Razorpay config:', e.response?.data?.message || e.message);
        setRazorpayConfig({ isConfigured: false, keyId: '', amount: 0, currency: 'INR' });
      });
  }, []);

  useEffect(() => {
    if (!user) { setUpiConfig(null); return; }
    paymentAPI.getConfig(themeKey)
      .then(r => setUpiConfig(r.data))
      .catch(() => setUpiConfig(null));
  }, [user, themeKey]);

  const handleStripeUpgrade = async () => {
    if (!user) { navigate('/register'); return; }
    try {
      const { data } = await billingAPI.createCheckoutSession();
      window.location.href = data.url; // redirect to Stripe Checkout
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not start checkout');
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data } = await billingAPI.createPortalSession();
      window.location.href = data.url;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not open billing portal');
    } finally { setLoadingPortal(false); }
  };

  // Local dev convenience — only renders when the backend confirms it's not production.
  const handleDevUpgrade = async () => {
    try {
      await billingAPI.devUpgrade();
      await refreshUser();
      toast.success('Dev upgrade applied — you now have Pro access');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Dev upgrade unavailable');
    }
  };

  const neitherConfigured = razorpayConfig && !razorpayConfig.isConfigured && !billingConfigured;

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      <nav className="border-b border-dark-600 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/builder" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">PF</span>
            </div>
            <span className="font-bold text-white">PortfolioForge</span>
          </Link>
          {user ? <Link to="/dashboard" className="btn-secondary text-sm">Dashboard</Link> : <Link to="/register" className="btn-primary text-sm">Get Started</Link>}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold text-white mb-3">Simple, transparent pricing</h1>
          <p className="text-gray-400">
            {themeName ? <>Unlock <span className="text-primary-400 font-medium">{themeName}</span> — and every premium theme — with Pro.</> : 'Start free. Upgrade for 2 exclusive premium themes.'}
          </p>
          {isPro && <Badge color="primary">You're on the Pro plan</Badge>}
        </div>

        {neitherConfigured && user && (
          <div className="card border-orange-500/30 bg-orange-500/5 mb-8 max-w-2xl mx-auto text-center">
            <p className="text-xs text-orange-300">
              Payments aren't configured on this server yet (no Razorpay or Stripe keys). In development, you can use the test upgrade button below instead of going through real checkout.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-1">Free</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-extrabold text-white">$0</span>
              <span className="text-sm text-gray-500">forever</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            {!user ? <Link to="/register" className="btn-secondary w-full justify-center">Get Started</Link>
              : !isPro ? <button disabled className="btn-secondary w-full justify-center opacity-60">Current Plan</button>
              : <button onClick={handleManageSubscription} disabled={loadingPortal} className="btn-secondary w-full justify-center">{loadingPortal ? <Spinner size="sm" /> : 'Downgrade via Portal'}</button>}
          </div>

          {/* Pro */}
          <div className="card border-primary-500 ring-1 ring-primary-500/30 relative">
            <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full mb-3 inline-block">Most Popular</span>
            <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-extrabold text-white">{razorpayConfig ? `₹${(razorpayConfig.amount / 100).toLocaleString('en-IN')}` : '$9'}</span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              billingConfigured ? (
                <button onClick={handleManageSubscription} disabled={loadingPortal} className="btn-primary w-full justify-center">
                  {loadingPortal ? <Spinner size="sm" /> : 'Manage Subscription'}
                </button>
              ) : (
                <button disabled className="btn-secondary w-full justify-center opacity-60">Current Plan</button>
              )
            ) : !user ? (
              <button onClick={() => navigate('/register')} className="btn-primary w-full justify-center">Sign up to upgrade</button>
            ) : (
              <>
                <RazorpayCheckoutButton themeKey={themeKey} themeName={themeName} config={razorpayConfig} />
                <p className="text-center text-[11px] text-gray-600 mt-1.5">Recommended — instant activation</p>
                {billingConfigured && (
                  <button onClick={handleStripeUpgrade} className="btn-secondary w-full justify-center mt-2 text-xs">
                    Prefer an international card? Pay via Stripe
                  </button>
                )}
                {!razorpayConfig?.isConfigured && !billingConfigured && (
                  <button onClick={handleDevUpgrade} className="btn-secondary w-full justify-center mt-2 text-xs">
                    Dev: Simulate Upgrade (no payment gateway)
                  </button>
                )}
              </>
            )}
          </div>

          {/* Team */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-1">Team</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-extrabold text-white">Custom</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {TEAM_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <a href="mailto:hello@portfolioforge.dev" className="btn-secondary w-full justify-center">Contact Us</a>
          </div>
        </div>

        {/* Manual UPI — a full card (QR, UPI ID, screenshot upload) doesn't
            fit gracefully inside the compact 3-column pricing grid above,
            so it gets its own section instead, directly below Razorpay's
            "recommended" primary CTA. `upiConfig` is null/isEnabled=false
            for anyone the admin hasn't made this visible to — see
            paymentController.isEligibleForUpi — so this section simply
            doesn't render for most users, no separate frontend check needed. */}
        {user && !isPro && upiConfig?.isEnabled && (
          <div className="max-w-md mx-auto mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-dark-600" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Or pay via UPI</span>
              <div className="flex-1 h-px bg-dark-600" />
            </div>
            <UpiPaymentCard config={upiConfig} themeKey={themeKey} themeName={themeName} loggedIn={!!user} onSuccess={refreshUser} />
          </div>
        )}

        <p className="text-center text-xs text-gray-600 mt-10">
          Payments are processed securely via Razorpay — card, UPI, netbanking, and wallets all work from the same checkout. Premium themes (Executive Suite, Neon Cyber Pro) require an active Pro subscription to select, enforced server-side, not just hidden in the UI.
        </p>
      </div>
    </div>
  );
}
