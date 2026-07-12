import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portfolioAPI, authAPI, billingAPI, adminPaymentAPI, adminAPI, uploadAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, SectionHeader, FormField, Toggle, Badge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#00ff41', '#00d4ff', '#d4af37', '#ff3366'
];

export default function SettingsPage() {
  const { isPro, isAdmin, refreshUser } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [upiConfig, setUpiConfig] = useState(null);
  const [upiSaving, setUpiSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    Promise.all([portfolioAPI.get(), portfolioAPI.stats(), billingAPI.getMyBilling()])
      .then(([p, s, b]) => { setPortfolio(p.data); setUsername(s.data.username); setBilling(b.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    adminPaymentAPI.getConfig().then(r => setUpiConfig(r.data)).catch(() => toast.error('Failed to load UPI settings'));
  }, [isAdmin]);

  const handleSaveUpiConfig = async () => {
    setUpiSaving(true);
    try {
      // allowedUsers comes back from GET populated (full {_id,name,email}
      // objects, so the UI can show names) — flatten back to plain ids
      // before saving, which is the shape the schema/backend expects.
      const payload = { ...upiConfig, allowedUsers: (upiConfig.allowedUsers || []).map(u => (typeof u === 'string' ? u : u._id)) };
      const { data } = await adminPaymentAPI.updateConfig(payload);
      setUpiConfig(data);
      toast.success('UPI settings saved');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); } finally { setUpiSaving(false); }
  };

  const handleUserSearch = async () => {
    setSearchingUsers(true);
    try {
      const { data } = await adminAPI.getUsers({ search: userSearch, limit: 8 });
      setUserSearchResults(data.users || []);
    } catch { toast.error('Search failed'); } finally { setSearchingUsers(false); }
  };

  const addAllowedUser = (u) => {
    setUpiConfig(prev => {
      const current = prev.allowedUsers || [];
      if (current.some(existing => (existing._id || existing) === u._id)) return prev; // already added
      return { ...prev, allowedUsers: [...current, u] };
    });
  };

  const removeAllowedUser = (userId) => {
    setUpiConfig(prev => ({ ...prev, allowedUsers: (prev.allowedUsers || []).filter(u => (u._id || u) !== userId) }));
  };

  // Client-side mirror of the backend's computeUpiPricing() — gives an
  // instant preview while the admin is still typing, before they've saved
  // (and before the server has had a chance to recompute pricing off the
  // saved config). The authoritative value always comes back from the
  // server on load/save via upiConfig.pricing; this is preview-only.
  const previewPricing = (() => {
    if (!upiConfig?.pricing) return null;
    const original = upiConfig.pricing.originalAmount || 0;
    let discount = 0;
    if (upiConfig.discountType === 'percentage') discount = Math.round(original * (Math.min(Math.max(upiConfig.discountPercentage || 0, 0), 100) / 100));
    else if (upiConfig.discountType === 'flat') discount = Math.min(Math.max((upiConfig.discountAmount || 0), 0), original);
    return { original, discount, final: Math.max(original - discount, 0) };
  })();

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await uploadAPI.image(form);
      setUpiConfig(prev => ({ ...prev, qrCodeUrl: data.url }));
      toast.success('QR code uploaded — click Save to apply');
    } catch { toast.error('Upload failed'); } finally { setUploadingQr(false); }
  };

  const handleManageSubscription = async () => {
    setBillingLoading(true);
    try {
      const { data } = await billingAPI.createPortalSession();
      window.location.href = data.url;
    } catch (e) { toast.error(e.response?.data?.message || 'Could not open billing portal'); } finally { setBillingLoading(false); }
  };

  const handleDevUpgrade = async () => {
    try {
      await billingAPI.devUpgrade();
      await refreshUser();
      const { data } = await billingAPI.getMyBilling();
      setBilling(data);
      toast.success('Dev upgrade applied');
    } catch (e) { toast.error(e.response?.data?.message || 'Unavailable'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await portfolioAPI.update({
        accentColor: portfolio.accentColor,
        seoTitle: portfolio.seoTitle,
        seoDescription: portfolio.seoDescription,
        isPublished: portfolio.isPublished,
      });
      setPortfolio(data);
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setPwSaving(false); }
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <SectionHeader title="Settings" description="Portfolio visibility, branding, and account settings" />

      {/* Portfolio URL */}
      <div className="card">
        <h3 className="section-title mb-3">Portfolio URL</h3>
        <div className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2 border border-dark-500">
          <span className="text-gray-500 text-sm">{window.location.origin}/</span>
          <span className="text-primary-400 text-sm font-mono font-medium">{username || 'your-username'}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">This is your unique, permanent username — set during registration.</p>
      </div>

      {/* Publish toggle */}
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-medium text-white text-sm">Portfolio Visibility</h3>
          <p className="text-xs text-gray-400 mt-0.5">{portfolio?.isPublished ? 'Your portfolio is public' : 'Your portfolio is private'}</p>
        </div>
        <Toggle checked={portfolio?.isPublished || false} onChange={v => setPortfolio(p => ({ ...p, isPublished: v }))} />
      </div>

      {/* Theme link */}
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-medium text-white text-sm">Theme & Layout</h3>
          <p className="text-xs text-gray-400 mt-0.5">Choose from 8 standard themes, plus 2 exclusive Pro themes</p>
        </div>
        <Link to="/dashboard/themes" className="btn-secondary text-xs">Manage Themes →</Link>
      </div>

      {/* Billing & Plan */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0">Billing & Plan</h3>
          <Badge color={isPro ? 'primary' : 'gray'}>{isPro ? 'Pro' : 'Free'}</Badge>
        </div>
        {isPro ? (
          <>
            <p className="text-xs text-gray-400 mb-4">
              You have access to all premium themes.
              {billing?.currentPeriodEnd && ` Renews ${new Date(billing.currentPeriodEnd).toLocaleDateString()}.`}
              {billing?.subscriptionStatus && billing.subscriptionStatus !== 'active' && ` Status: ${billing.subscriptionStatus}.`}
            </p>
            {billing?.billingConfigured ? (
              <button onClick={handleManageSubscription} disabled={billingLoading} className="btn-secondary text-xs">
                {billingLoading ? <Spinner size="sm" /> : 'Manage Subscription'}
              </button>
            ) : (
              <button onClick={handleDevUpgrade} className="btn-secondary text-xs">Dev: Toggle Plan</button>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">Upgrade to Pro to unlock Executive Suite and Neon Cyber Pro — two exclusive premium themes.</p>
            <div className="flex gap-2 flex-wrap">
              <Link to="/pricing" className="btn-primary text-xs">View Pricing</Link>
              {billing && !billing.billingConfigured && (
                <button onClick={handleDevUpgrade} className="btn-secondary text-xs">Dev: Simulate Upgrade</button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Manual UPI Payment Settings — admin only, platform-wide config.
          Offered ALONGSIDE Razorpay on the Pricing page (not instead of
          it) — see PricingPage.jsx / UpiPaymentCard.jsx. Whether a given
          user actually sees it depends on isEnabled below AND the
          visibility rules further down; see paymentController.isEligibleForUpi
          for the single source of truth those rules are enforced against
          (this form only edits the config, it never decides visibility itself). */}
      {isAdmin && upiConfig && (
        <div className="card border-teal-500/20 bg-teal-500/5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="section-title mb-0">Manual UPI Payment Settings</h3>
              <p className="text-xs text-gray-500 mt-0.5">A second, discount-friendly way to pay — shown alongside Razorpay, only to the users you choose below.</p>
            </div>
            <Toggle checked={upiConfig.isEnabled} onChange={v => setUpiConfig(p => ({ ...p, isEnabled: v }))} label={upiConfig.isEnabled ? 'Enabled' : 'Disabled'} />
          </div>

          <FormField label="UPI ID" hint='e.g. "yourname@upi" or "yourname@paytm"'>
            <input value={upiConfig.upiId} onChange={e => setUpiConfig(p => ({ ...p, upiId: e.target.value }))} className="input-field" placeholder="yourname@upi" />
          </FormField>
          <FormField label="Payee Name">
            <input value={upiConfig.payeeName} onChange={e => setUpiConfig(p => ({ ...p, payeeName: e.target.value }))} className="input-field" placeholder="PortfolioForge" />
          </FormField>
          <FormField label="Payment instructions shown to users">
            <textarea value={upiConfig.note} onChange={e => setUpiConfig(p => ({ ...p, note: e.target.value }))} className="input-field resize-none" rows={2} placeholder="Scan the QR or pay to the UPI ID below, then submit your transaction ID or a screenshot." />
          </FormField>
          <FormField label="Custom QR Code" hint="Optional — if left blank, one is auto-generated from your UPI ID and the current price">
            <div className="flex items-center gap-3">
              {upiConfig.qrCodeUrl && <img src={upiConfig.qrCodeUrl} alt="QR preview" className="w-14 h-14 rounded-lg bg-white p-1" />}
              <label className="btn-secondary cursor-pointer text-xs">
                {uploadingQr ? <Spinner size="sm" /> : 'Upload QR Image'}
                <input type="file" accept="image/*" className="sr-only" onChange={handleQrUpload} disabled={uploadingQr} />
              </label>
            </div>
          </FormField>

          {/* ── Visibility ── */}
          <div className="pt-4 border-t border-dark-600 space-y-3">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Who can see this</h4>
            <div className="flex gap-2">
              <button type="button" onClick={() => setUpiConfig(p => ({ ...p, visibilityMode: 'all' }))}
                className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${upiConfig.visibilityMode === 'all' ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-dark-500 text-gray-400 hover:border-dark-400'}`}>
                All logged-in users
              </button>
              <button type="button" onClick={() => setUpiConfig(p => ({ ...p, visibilityMode: 'allowlist' }))}
                className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${upiConfig.visibilityMode === 'allowlist' ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-dark-500 text-gray-400 hover:border-dark-400'}`}>
                Only selected users
              </button>
            </div>

            {upiConfig.visibilityMode === 'allowlist' && (
              <div className="space-y-2">
                {(upiConfig.allowedUsers || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {upiConfig.allowedUsers.map(u => (
                      <span key={u._id || u} className="inline-flex items-center gap-1.5 text-xs bg-dark-700 border border-dark-500 rounded-full pl-2.5 pr-1.5 py-1">
                        {u.name || u.email || u._id || u}
                        <button type="button" onClick={() => removeAllowedUser(u._id || u)} className="text-gray-500 hover:text-red-400 leading-none">✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUserSearch())}
                    placeholder="Search users by name or email..." className="input-field flex-1 text-xs" />
                  <button type="button" onClick={handleUserSearch} disabled={searchingUsers} className="btn-secondary text-xs px-3">
                    {searchingUsers ? <Spinner size="sm" /> : 'Search'}
                  </button>
                </div>
                {userSearchResults.length > 0 && (
                  <div className="border border-dark-500 rounded-lg divide-y divide-dark-600 max-h-40 overflow-y-auto">
                    {userSearchResults.map(u => (
                      <button key={u._id} type="button" onClick={() => addAllowedUser(u)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-dark-700">
                        <span className="text-gray-300">{u.name} <span className="text-gray-500">({u.email})</span></span>
                        <span className="text-primary-400">+ Add</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Discount ── */}
          <div className="pt-4 border-t border-dark-600 space-y-3">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Discount</h4>
            <div className="flex gap-2">
              {['none', 'percentage', 'flat'].map(t => (
                <button key={t} type="button" onClick={() => setUpiConfig(p => ({ ...p, discountType: t }))}
                  className={`flex-1 text-xs py-2 rounded-lg border capitalize transition-colors ${upiConfig.discountType === t ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-dark-500 text-gray-400 hover:border-dark-400'}`}>
                  {t === 'none' ? 'No discount' : t === 'percentage' ? 'Percentage off' : 'Flat amount off'}
                </button>
              ))}
            </div>

            {upiConfig.discountType === 'percentage' && (
              <FormField label="Discount percentage">
                <div className="relative">
                  <input type="number" min={0} max={100} value={upiConfig.discountPercentage || 0}
                    onChange={e => setUpiConfig(p => ({ ...p, discountPercentage: Number(e.target.value) }))}
                    className="input-field pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                </div>
              </FormField>
            )}
            {upiConfig.discountType === 'flat' && (
              <FormField label="Discount amount">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">₹</span>
                  <input type="number" min={0} value={(upiConfig.discountAmount || 0) / 100}
                    onChange={e => setUpiConfig(p => ({ ...p, discountAmount: Math.round(Number(e.target.value) * 100) }))}
                    className="input-field pl-7" />
                </div>
              </FormField>
            )}

            {previewPricing && (
              <div className="flex items-baseline gap-2 px-3 py-2 rounded-lg bg-dark-700 border border-dark-500">
                <span className="text-xs text-gray-500">Preview:</span>
                {previewPricing.discount > 0 && <span className="text-xs text-gray-500 line-through">₹{(previewPricing.original / 100).toLocaleString('en-IN')}</span>}
                <span className="text-sm font-semibold text-white">₹{(previewPricing.final / 100).toLocaleString('en-IN')}</span>
                {previewPricing.discount > 0 && <span className="text-xs text-green-400">save ₹{(previewPricing.discount / 100).toLocaleString('en-IN')}</span>}
                <span className="text-xs text-gray-600 ml-auto">Original price mirrors the Razorpay Pro price automatically</span>
              </div>
            )}
          </div>

          {/* ── Eligible plans (optional) ── */}
          <div className="pt-4 border-t border-dark-600">
            <FormField label="Eligible plans / themes" hint='Optional. Comma-separated keys (e.g. "pro-plan, neon-cyber-pro"). Leave blank to allow all.'>
              <input
                value={(upiConfig.eligiblePlans || []).join(', ')}
                onChange={e => setUpiConfig(p => ({ ...p, eligiblePlans: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                className="input-field" placeholder="Leave blank for all" />
            </FormField>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-dark-600">
            <Link to="/dashboard/admin/payment-verifications" className="text-xs text-teal-400 hover:text-teal-300">Review pending UPI claims →</Link>
            <button onClick={handleSaveUpiConfig} disabled={upiSaving} className="btn-primary text-xs">
              {upiSaving ? <Spinner size="sm" /> : 'Save UPI Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Accent color */}
      <div className="card">
        <h3 className="section-title mb-3">Accent Color</h3>
        <p className="text-xs text-gray-500 mb-3">Applies across whichever theme you choose</p>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_COLORS.map(color => (
            <button key={color} onClick={() => setPortfolio(p => ({ ...p, accentColor: color }))}
              className={`w-9 h-9 rounded-full transition-all ${portfolio?.accentColor === color ? 'ring-2 ring-offset-2 ring-offset-dark-800 ring-white scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="card space-y-4">
        <h3 className="section-title">SEO Settings</h3>
        <FormField label="SEO Title" hint="Shown in browser tab and search results">
          <input value={portfolio?.seoTitle || ''} onChange={e => setPortfolio(p => ({ ...p, seoTitle: e.target.value }))}
            className="input-field" placeholder="John Doe – Full Stack Developer" />
        </FormField>
        <FormField label="SEO Description">
          <textarea value={portfolio?.seoDescription || ''} onChange={e => setPortfolio(p => ({ ...p, seoDescription: e.target.value }))}
            className="input-field resize-none" rows={3} placeholder="A brief description for search engines..." />
        </FormField>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
          {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Settings'}
        </button>
      </div>

      {/* Change password */}
      <div className="card">
        <h3 className="section-title mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <FormField label="Current Password">
            <input type="password" value={pwForm.currentPassword}
              onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="input-field" placeholder="••••••••" required />
          </FormField>
          <FormField label="New Password">
            <input type="password" value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              className="input-field" placeholder="••••••••" required />
          </FormField>
          <FormField label="Confirm New Password">
            <input type="password" value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              className="input-field" placeholder="••••••••" required />
          </FormField>
          <div className="flex justify-end">
            <button type="submit" disabled={pwSaving} className="btn-primary">
              {pwSaving ? <Spinner size="sm" /> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
