import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const API = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// Handle 401 globally
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  changePassword: (data) => API.put('/auth/change-password', data),
  checkUsername: (username) => API.get(`/auth/check-username/${username}`),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  // Matches the confirm-password check at the call site (defense in depth —
  // the page itself also validates before ever calling this) and only ever
  // sends the single final password to the backend; confirmPassword exists
  // purely to catch typos client-side, the server never needs to see it twice.
  resetPassword: (token, newPassword, confirmPassword) => {
    if (newPassword !== confirmPassword) {
      return Promise.reject(new Error('Passwords do not match'));
    }
    return API.put(`/auth/reset-password/${token}`, { password: newPassword });
  },
};

// Portfolio
export const portfolioAPI = {
  get: () => API.get('/portfolio'),
  update: (data) => API.put('/portfolio', data),
  togglePublish: () => API.put('/portfolio/publish'),
  stats: () => API.get('/portfolio/stats'),
  // // Fetched as a blob (not a plain <a href>) because this route requires
  // // auth — a plain anchor click can't carry an Authorization header, but
  // // axios can. The caller turns the blob into a local object URL and
  // // opens THAT in a new tab; see ProfilePage's handleViewResume.
  // viewResume: () => API.get('/portfolio/resume', { responseType: 'blob' }),

  // `v` is a cache-busting timestamp: this route's URL never changes
  // between resume uploads, and axios GETs are still subject to the
  // browser's normal HTTP cache, so without a changing query param a
  // browser that had already cached one response could keep returning it
  // after a re-upload regardless of what the server's Cache-Control says.
  viewResume: () => API.get(`/portfolio/resume?v=${Date.now()}`, { responseType: 'blob' }),
};

// Projects
export const projectsAPI = {
  getAll: () => API.get('/projects'),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  remove: (id) => API.delete(`/projects/${id}`),
  reorder: (orderedIds) => API.put('/projects/reorder', { orderedIds }),
};

// Skills
export const skillsAPI = {
  getAll: () => API.get('/skills'),
  create: (data) => API.post('/skills', data),
  update: (id, data) => API.put(`/skills/${id}`, data),
  remove: (id) => API.delete(`/skills/${id}`),
};

// Experience
export const experienceAPI = {
  getAll: () => API.get('/experience'),
  create: (data) => API.post('/experience', data),
  update: (id, data) => API.put(`/experience/${id}`, data),
  remove: (id) => API.delete(`/experience/${id}`),
};

// Education
export const educationAPI = {
  getAll: () => API.get('/education'),
  create: (data) => API.post('/education', data),
  update: (id, data) => API.put(`/education/${id}`, data),
  remove: (id) => API.delete(`/education/${id}`),
};

// Certificates
export const certificatesAPI = {
  getAll: () => API.get('/certificates'),
  create: (data) => API.post('/certificates', data),
  update: (id, data) => API.put(`/certificates/${id}`, data),
  remove: (id) => API.delete(`/certificates/${id}`),
};

// Themes — user-facing catalog (read-only, any authenticated user)
export const themesAPI = {
  getEnabled: () => API.get('/themes'),
  setMyTheme: (key) => API.put('/portfolio/theme', { theme: key }),
};

// Themes — admin management (create/update/delete/set-default)
// Every call here hits a route guarded by protect+admin server-side;
// a normal user's token gets a 403 even if they call these directly.
export const adminThemesAPI = {
  getAll: () => API.get('/admin/themes'),
  create: (data) => API.post('/admin/themes', data),
  update: (id, data) => API.put(`/admin/themes/${id}`, data),
  remove: (id) => API.delete(`/admin/themes/${id}`),
  setDefault: (id) => API.put(`/admin/themes/${id}/set-default`),
};

// Billing — Stripe Checkout / Customer Portal / plan status
export const billingAPI = {
  getMyBilling: () => API.get('/billing/me'),
  createCheckoutSession: () => API.post('/billing/create-checkout-session'),
  createPortalSession: () => API.post('/billing/create-portal-session'),
  verifySession: (sessionId) => API.get('/billing/verify-session', { params: { session_id: sessionId } }),
  // Dev-only — the server 404s these outside development, this is just a convenience wrapper.
  devUpgrade: () => API.post('/billing/dev-upgrade'),
  devDowngrade: () => API.post('/billing/dev-downgrade'),
};

// Family groups — self-service for family_admin, scoped to their own group
// server-side. Works the same way whether called by a family_admin (their
// own group) or by an admin/super_admin acting on any group.
export const familyAPI = {
  getMyGroup: () => API.get('/family/groups/my'),
  getGroup: (groupId) => API.get(`/family/groups/${groupId}`),
  getUsage: (groupId) => API.get(`/family/groups/${groupId}/usage`),
  inviteMember: (groupId, email) => API.post(`/family/groups/${groupId}/members`, { email }),
  removeMember: (groupId, memberId) => API.delete(`/family/groups/${groupId}/members/${memberId}`),
  grantPremium: (groupId, memberId) => API.put(`/family/groups/${groupId}/members/${memberId}/grant-premium`),
  revokePremium: (groupId, memberId) => API.put(`/family/groups/${groupId}/members/${memberId}/revoke-premium`),
};

// Admin oversight of family groups (create new groups, list all)
export const adminFamilyAPI = {
  create: (data) => API.post('/admin/family-groups', data),
  listAll: () => API.get('/admin/family-groups'),
};

// Super-admin-exclusive: creating/removing peer admin accounts
export const superAdminAPI = {
  listAdmins: () => API.get('/admin/admins'),
  promote: (userId) => API.put(`/admin/users/${userId}/promote`),
  demote: (userId) => API.put(`/admin/users/${userId}/demote`),
};

// Admin
export const adminAPI = {
  overview: () => API.get('/admin/overview'),
  getUsers: (params) => API.get('/admin/users', { params }),
  getUser: (id) => API.get(`/admin/users/${id}`),
  toggleUserStatus: (id) => API.put(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getPortfolios: (params) => API.get('/admin/portfolios', { params }),
};

// Public
export const publicAPI = {
  getPortfolio: (username) => API.get(`/public/${username}`),
  search: (params) => API.get('/public/search', { params }),
  getOwnerPortfolio: () => API.get('/public/owner'),
  // // These two are PUBLIC, no-auth endpoints (unlike portfolioAPI.viewResume
  // // above) — so unlike that one, theme components use these as plain
  // // <a href> strings directly, no blob/axios dance needed.
  // resumeUrlFor: (username) => `${API_BASE}/public/${username}/resume`,
  // ownerResumeUrl: () => `${API_BASE}/public/owner/resume`,

  // `version` should be the portfolio's `updatedAt` (or any value that
  // changes whenever the resume is replaced). These routes always point at
  // the same path no matter how many times the resume is re-uploaded, so
  // without a value like this baked into the URL, browsers — and any CDN
  // sitting in front of the API — have no way to tell "give me the current
  // file" apart from "give me whatever you gave me last time for this
  // exact URL". This is what actually varies the URL per upload; the
  // server's Cache-Control header (see streamRemoteFile.js) is the second,
  // belt-and-suspenders layer of the same fix.
  resumeUrlFor: (username, version) => `${API_BASE}/public/${username}/resume${version ? `?v=${version}` : ''}`,
  ownerResumeUrl: (version) => `${API_BASE}/public/owner/resume${version ? `?v=${version}` : ''}`,
};

// Upload
export const uploadAPI = {
  avatar: (formData) => API.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  image: (formData) => API.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  resume: (formData) => API.post('/upload/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Razorpay — replaces the old manual-UPI purchase flow below. Creates a
// real server-side order with a fixed amount and verifies the payment
// cryptographically, instead of trusting a self-reported UTR number.
export const razorpayAPI = {
  getConfig: () => API.get('/payments/config'),
  createOrder: (themeKey) => API.post('/payments/create-order', themeKey ? { themeKey } : {}),
  verify: (data) => API.post('/payments/verify', data),
  recordFailure: (data) => API.post('/payments/failure', data),
  myPayments: () => API.get('/payments/me'),
};

// Manual UPI — a first-class payment method offered ALONGSIDE Razorpay
// (not a fallback/legacy path). Visibility is admin-controlled per-user,
// globally, and optionally per-plan; pricing can carry its own discount.
// See paymentController.js (isEligibleForUpi / computeUpiPricing) for
// where those rules actually live — this file just calls the endpoints.
export const paymentAPI = {
  // `themeKey` is optional — when set, the backend also checks
  // config.eligiblePlans for that specific key (per-plan visibility scoping).
  getConfig: (themeKey) => API.get('/payment/config', { params: themeKey ? { theme: themeKey } : {} }),
  submitVerification: (data) => API.post('/payment/verify', data),
};

// Admin side of the Manual UPI flow — config (visibility/discount/UPI
// details) plus claim review. Used by SettingsPage.jsx and
// AdminPaymentVerificationsPage.jsx respectively.
export const adminPaymentAPI = {
  getConfig: () => API.get('/admin/payment/config'),
  updateConfig: (data) => API.put('/admin/payment/config', data),
  listVerifications: (status) => API.get('/admin/payment/verifications', { params: { status } }),
  approve: (id, adminNote) => API.put(`/admin/payment/verifications/${id}/approve`, { adminNote }),
  reject: (id, adminNote) => API.put(`/admin/payment/verifications/${id}/reject`, { adminNote }),
  // Unified history across BOTH payment methods (Razorpay + Manual UPI).
  getHistory: (limit) => API.get('/admin/payment/history', { params: limit ? { limit } : {} }),
};

export default API;
