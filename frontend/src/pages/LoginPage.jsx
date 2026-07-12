import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Spinner } from '../components/shared/UI';
import toast from 'react-hot-toast';

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
    </div>
    <div className="w-full max-w-sm relative">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-lg">PF</span>
        </div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
      <div className="card">{children}</div>
      <div className="text-center mt-4 text-sm text-gray-500">{footer}</div>
    </div>
  </div>
);

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account"
      footer={<>Don't have an account? <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Sign up free</Link></>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" value={form.email} onChange={handle}
            className="input-field" placeholder="you@example.com" autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label" style={{ marginBottom: 0 }}>Password</label>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300">Forgot password?</Link>
          </div>
          <input name="password" type="password" value={form.password} onChange={handle}
            className="input-field" placeholder="••••••••" autoComplete="current-password" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
          {loading ? <><Spinner size="sm" /> Signing in...</> : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const debounceRef = useRef(null);

  const handle = e => {
    const { name, value } = e.target;
    if (name === 'username') {
      const clean = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      setForm(p => ({ ...p, username: clean }));
      checkUsername(clean);
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const checkUsername = (value) => {
    clearTimeout(debounceRef.current);
    if (!value || value.length < 3) { setUsernameStatus(value ? 'invalid' : null); return; }
    setUsernameStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await authAPI.checkUsername(value);
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setUsernameStatus(null); }
    }, 450);
  };

  // Auto-suggest username from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm(p => {
      const shouldAutofill = !p.username || p.username === p.name?.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newUsername = shouldAutofill ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : p.username;
      if (shouldAutofill && newUsername) checkUsername(newUsername);
      return { ...p, name, username: newUsername };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.email || !form.password) { toast.error('Fill in all fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    if (usernameStatus === 'taken') { toast.error('That username is taken'); return; }
    if (usernameStatus === 'invalid' || form.username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.username, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const statusColor = { checking: 'text-gray-500', available: 'text-green-400', taken: 'text-red-400', invalid: 'text-yellow-400' };
  const statusText = { checking: 'Checking...', available: '✓ Available', taken: '✕ Already taken', invalid: 'Min 3 characters' };

  return (
    <AuthLayout title="Create your portfolio" subtitle="Free forever, no credit card needed"
      footer={<>Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link></>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input name="name" value={form.name} onChange={handleNameChange}
            className="input-field" placeholder="John Doe" autoComplete="name" />
        </div>
        <div>
          <label className="label">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">@</span>
            <input name="username" value={form.username} onChange={handle}
              className="input-field pl-7" placeholder="johndoe" autoComplete="off" />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-gray-500 font-mono">{window.location.host}/{form.username || 'username'}</p>
            {usernameStatus && <p className={`text-xs ${statusColor[usernameStatus]}`}>{statusText[usernameStatus]}</p>}
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" value={form.email} onChange={handle}
            className="input-field" placeholder="you@example.com" autoComplete="email" />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" value={form.password} onChange={handle}
            className="input-field" placeholder="Min 6 characters" autoComplete="new-password" />
        </div>
        <button type="submit" disabled={loading || usernameStatus === 'taken'} className="btn-primary w-full justify-center py-2.5">
          {loading ? <><Spinner size="sm" /> Creating account...</> : 'Create Account'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      // The backend always returns the same generic message whether or not
      // the email is registered — so the UI shows the same success state
      // either way too. There's nothing for this component to branch on.
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong — please try again');
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="If that email is registered, a reset link is on its way"
        footer={<Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">← Back to sign in</Link>}>
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-primary-500/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            The link is valid for 20 minutes. Didn't get it? Check spam, or{' '}
            <button onClick={() => setSent(false)} className="text-primary-400 hover:text-primary-300 font-medium">try again</button>.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="We'll email you a link to reset it"
      footer={<Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">← Back to sign in</Link>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="input-field" placeholder="you@example.com" autoComplete="email" autoFocus />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
          {loading ? <><Spinner size="sm" /> Sending...</> : 'Send Reset Link'}
        </button>
      </form>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || !form.confirm) { toast.error('Fill in both fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, form.password, form.confirm);
      setSuccess(true);
      toast.success('Password reset! You can now sign in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // Covers both "passwords don't match" (caught client-side in api.js)
      // and the backend's "invalid or expired token" — same toast path,
      // the message just comes from wherever it actually failed.
      toast.error(err.response?.data?.message || err.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <AuthLayout title="Password reset" subtitle="Redirecting you to sign in...">
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm font-medium">Go to sign in now →</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Make it something you'll remember"
      footer={<Link to="/forgot-password" className="text-primary-400 hover:text-primary-300 font-medium">Request a new link</Link>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New Password</label>
          <input name="password" type="password" value={form.password} onChange={handle}
            className="input-field" placeholder="Min 6 characters" autoComplete="new-password" autoFocus />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input name="confirm" type="password" value={form.confirm} onChange={handle}
            className="input-field" placeholder="••••••••" autoComplete="new-password" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
          {loading ? <><Spinner size="sm" /> Resetting...</> : 'Reset Password'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          This link expires 20 minutes after it was requested.
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
