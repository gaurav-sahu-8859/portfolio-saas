import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { THEMES } from '../themes/themeConfig';
import { getThemeComponent } from '../themes';
import { useAuth } from '../context/AuthContext';
import { themesAPI } from '../services/api';
import toast from 'react-hot-toast';

// Sample data used to preview themes before the user has filled their own content
const SAMPLE_DATA = {
  // resumeViewUrl lives at the top level (not inside `portfolio`) because
  // every theme reads it via getResumeLink(data) — this mirrors exactly
  // what OwnerPortfolioPage / PublicPortfolioPage inject for real
  // portfolios, so the gallery preview shows the resume CTA the same way
  // it'll actually look once a real resume is uploaded.
  resumeViewUrl: '#sample-resume',
  portfolio: {
    fullName: 'Alex Rivera',
    tagline: 'Open to new opportunities',
    title: 'Full Stack Developer',
    bio: 'I build fast, accessible web applications with React, Node.js, and a relentless focus on user experience.',
    profilePicture: '',
    resumeUrl: '#sample-resume',
    contact: { email: 'alex@example.com', location: 'San Francisco, CA' },
    socialLinks: { github: '#', linkedin: '#', twitter: '#' },
  },
  user: { name: 'Alex Rivera', username: 'alexrivera' },
  projects: [
    { _id: '1', name: 'TaskFlow', description: 'A collaborative project management tool with real-time sync.', technologies: ['React', 'Node.js', 'Socket.io'], githubLink: '#', liveLink: '#', featured: true },
    { _id: '2', name: 'DevMetrics', description: 'Analytics dashboard for tracking developer productivity.', technologies: ['Vue', 'Express', 'PostgreSQL'], githubLink: '#', liveLink: '#' },
  ],
  skills: [
    { _id: '1', name: 'React', level: 92, category: 'Frontend' },
    { _id: '2', name: 'Node.js', level: 88, category: 'Backend' },
    { _id: '3', name: 'MongoDB', level: 80, category: 'Database' },
  ],
  experience: [
    { _id: '1', company: 'TechCorp', position: 'Senior Developer', startDate: '2022-01-01', current: true, description: 'Leading frontend architecture for the core product team.' },
  ],
  education: [
    { _id: '1', school: 'State University', degree: 'B.Tech', field: 'Computer Science', startYear: 2017, endYear: 2021, grade: '8.4 CGPA' },
  ],
  certificates: [
    { _id: '1', name: 'AWS Certified Developer', organization: 'Amazon Web Services', issueDate: '2023-06-01' },
  ],
};

const DEVICE_SIZES = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '390px', label: 'Mobile' },
};

export default function ThemeGalleryPage() {
  const { user, isPro } = useAuth();
  const [previewTheme, setPreviewTheme] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [fullscreen, setFullscreen] = useState(false);
  const [applying, setApplying] = useState(false);

  const navigate = useNavigate();

  const handleApply = async (theme) => {
    if (!user) { toast.error('Sign in to apply a theme'); return; }
    if (theme.isPremium && !isPro) {
      toast.error('That theme requires the Pro plan');
      navigate('/pricing');
      return;
    }
    setApplying(true);
    try {
      // This goes through /api/portfolio/theme, which checks the theme is
      // currently enabled in the admin-curated catalog (and, for premium
      // themes, that the user's plan is 'pro') before saving — so this
      // gallery (a static showcase of all implemented themes) can still
      // correctly reject anything the user isn't allowed to select.
      await themesAPI.setMyTheme(theme.id);
      toast.success('Theme applied! Your portfolio data is unchanged.');
      setPreviewTheme(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to apply theme');
    } finally { setApplying(false); }
  };

  const PreviewComponent = previewTheme ? getThemeComponent(previewTheme.id) : null;

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-dark-600 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/builder" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">PF</span>
            </div>
            <span className="font-bold text-white">PortfolioForge</span>
          </Link>
          {user ? <Link to="/dashboard" className="btn-secondary text-sm">Dashboard</Link> : <Link to="/register" className="btn-primary text-sm">Get Started</Link>}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Choose Your Theme</h1>
          <p className="text-gray-400 max-w-xl mx-auto">10 fully different layouts, including 2 exclusive Pro designs. Preview live, switch anytime, never lose your data.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEMES.map(theme => {
            const isLocked = theme.isPremium && !isPro;
            return (
              <div key={theme.id} className="card hover:border-primary-500/40 transition-all group overflow-hidden p-0">
                {/* Mini preview swatch */}
                <div className="h-36 relative overflow-hidden" style={{ background: theme.preview.bg }}>
                  <div className="absolute inset-0 p-4 flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-full" style={{ background: theme.preview.accent, opacity: 0.8 }} />
                    <div className="w-2/3 h-2 rounded" style={{ background: theme.preview.text, opacity: 0.7 }} />
                    <div className="w-1/2 h-2 rounded" style={{ background: theme.preview.accent, opacity: 0.6 }} />
                    <div className="mt-auto flex gap-2">
                      <div className="flex-1 h-8 rounded" style={{ background: theme.preview.card, border: `1px solid ${theme.preview.accent}33` }} />
                      <div className="flex-1 h-8 rounded" style={{ background: theme.preview.card, border: `1px solid ${theme.preview.accent}33` }} />
                    </div>
                  </div>
                  {theme.isPremium && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-dark-900/85 text-orange-300">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3z" /></svg>
                      Pro
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-white text-sm mb-1">{theme.name}</h3>
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">{theme.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {theme.tags.map(t => <span key={t} className="px-2 py-0.5 bg-dark-700 text-gray-400 text-xs rounded-md">{t}</span>)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setPreviewTheme(theme); setDevice('desktop'); }} className="btn-secondary text-xs flex-1 justify-center">Live Preview</button>
                    {isLocked ? (
                      <Link to="/pricing" className="btn-primary text-xs flex-1 justify-center">Unlock</Link>
                    ) : (
                      <button onClick={() => handleApply(theme)} disabled={applying} className="btn-primary text-xs flex-1 justify-center">Apply</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview modal */}
      {previewTheme && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 bg-dark-800 border-b border-dark-600 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">{previewTheme.name}</span>
              {previewTheme.isPremium && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300">Pro</span>}
              <span className="text-xs text-gray-500">Live Preview</span>
            </div>
            <div className="flex items-center gap-2">
              {Object.entries(DEVICE_SIZES).map(([key, val]) => (
                <button key={key} onClick={() => setDevice(key)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${device === key ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-600'}`}>
                  {val.label}
                </button>
              ))}
              <button onClick={() => setFullscreen(f => !f)} className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600">
                {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
              {previewTheme.isPremium && !isPro ? (
                <Link to="/pricing" className="btn-primary text-xs">Upgrade to Apply</Link>
              ) : (
                <button onClick={() => handleApply(previewTheme)} disabled={applying} className="btn-primary text-xs">Apply This Theme</button>
              )}
              <button onClick={() => setPreviewTheme(null)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 flex items-center justify-center">✕</button>
            </div>
          </div>
          {/* Preview frame */}
          <div className="flex-1 overflow-auto flex justify-center bg-[#050505] py-6">
            <div style={{ width: fullscreen ? '100%' : DEVICE_SIZES[device].width, height: fullscreen ? '100%' : 'fit-content', transition: 'width 0.3s', boxShadow: device !== 'desktop' && !fullscreen ? '0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)' : 'none', borderRadius: device !== 'desktop' && !fullscreen ? 16 : 0, overflow: 'hidden' }}>
              {PreviewComponent && <PreviewComponent data={SAMPLE_DATA} accent={previewTheme.preview.accent} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
