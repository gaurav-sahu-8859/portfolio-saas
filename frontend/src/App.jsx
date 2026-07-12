import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import BuilderHomePage from './pages/BuilderHomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ThemeGalleryPage from './pages/ThemeGalleryPage';
import ExplorePage from './pages/ExplorePage';
import PricingPage from './pages/PricingPage';
import BillingSuccessPage from './pages/BillingSuccessPage';
import BillingCancelPage from './pages/BillingCancelPage';
import FeaturesPage from './pages/FeaturesPage';
import DashboardLayout from './pages/admin/DashboardLayout';
import DashboardHome from './pages/admin/DashboardHome';
import ProfilePage from './pages/admin/ProfilePage';
import ProjectsPage from './pages/admin/ProjectsPage';
import SkillsPage from './pages/admin/SkillsPage';
import ExperiencePage from './pages/admin/ExperiencePage';
import EducationPage from './pages/admin/EducationPage';
import CertificatesPage from './pages/admin/CertificatesPage';
import SettingsPage from './pages/admin/SettingsPage';
import DashboardThemesPage from './pages/admin/DashboardThemesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPortfoliosPage from './pages/admin/AdminPortfoliosPage';
import AdminThemeManagerPage from './pages/admin/AdminThemeManagerPage';
import AdminFamilyGroupsPage from './pages/admin/AdminFamilyGroupsPage';
import AdminPaymentVerificationsPage from './pages/admin/AdminPaymentVerificationsPage';
import AdminManagementPage from './pages/admin/AdminManagementPage';
import FamilyAdminDashboardPage from './pages/family/FamilyAdminDashboardPage';
import PublicPortfolioPage from './pages/portfolio/PublicPortfolioPage';
import OwnerPortfolioPage from './pages/portfolio/OwnerPortfolioPage';
import NotFoundPage from './pages/NotFoundPage';

const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false, familyAdminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  // adminOnly means admin-tier: admin OR super_admin. Checking the literal
  // string 'admin' here would incorrectly lock super_admin out of every
  // existing admin-only page — this is the one place that has to know both
  // values belong to the same tier.
  if (adminOnly && !['admin', 'super_admin'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  if (superAdminOnly && user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  if (familyAdminOnly && user.role !== 'family_admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* "/" now shows YOUR (the owner's) portfolio directly */}
      <Route path="/" element={<OwnerPortfolioPage />} />

      {/* SaaS marketing / builder pages moved off root */}
      <Route path="/builder" element={<BuilderHomePage />} />
      <Route path="/themes" element={<ThemeGalleryPage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/billing/success" element={<ProtectedRoute><BillingSuccessPage /></ProtectedRoute>} />
      <Route path="/billing/cancel" element={<ProtectedRoute><BillingCancelPage /></ProtectedRoute>} />
      <Route path="/features" element={<FeaturesPage />} />

      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="/reset-password/:token" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="experience" element={<ExperiencePage />} />
        <Route path="education" element={<EducationPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="themes" element={<DashboardThemesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Admin only (admin-tier: admin OR super_admin) */}
        <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
        <Route path="admin/portfolios" element={<ProtectedRoute adminOnly><AdminPortfoliosPage /></ProtectedRoute>} />
        <Route path="admin/themes" element={<ProtectedRoute adminOnly><AdminThemeManagerPage /></ProtectedRoute>} />
        <Route path="admin/family-groups" element={<ProtectedRoute adminOnly><AdminFamilyGroupsPage /></ProtectedRoute>} />
        <Route path="admin/payment-verifications" element={<ProtectedRoute adminOnly><AdminPaymentVerificationsPage /></ProtectedRoute>} />

        {/* Super admin only — creating/removing peer admins */}
        <Route path="super-admin/admins" element={<ProtectedRoute superAdminOnly><AdminManagementPage /></ProtectedRoute>} />

        {/* Family admin only — their own group, nothing global */}
        <Route path="family" element={<ProtectedRoute familyAdminOnly><FamilyAdminDashboardPage /></ProtectedRoute>} />
      </Route>

      {/* Public portfolio pages by username */}
      <Route path="/:username" element={<PublicPortfolioPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e1e28', color: '#f1f5f9', border: '1px solid #26263a' },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}
