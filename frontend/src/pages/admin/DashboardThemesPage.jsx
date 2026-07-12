import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { themesAPI, portfolioAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SectionHeader, Spinner, EmptyState, Badge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

// Full-page version of the theme switcher. Unlike the static gallery at
// /themes, this page reads the live, admin-curated catalog via /api/themes —
// it only ever shows themes the admin has enabled, so a normal user
// literally cannot select anything outside admin's control here.
//
// Premium themes are visible to everyone (upsell) but locked for free-plan
// users — the actual gate lives server-side in updateMyTheme, this is just
// the matching UI treatment.
export default function DashboardThemesPage() {
  const { isPro } = useAuth();
  const [themes, setThemes] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    Promise.all([themesAPI.getEnabled(), portfolioAPI.stats()])
      .then(([themesRes, statsRes]) => {
        setThemes(themesRes.data);
        setCurrentTheme(statsRes.data.theme);
        setUsername(statsRes.data.username);
      })
      .catch(() => toast.error('Failed to load themes'))
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (theme) => {
    if (theme.isPremium && !isPro) return; // guarded by disabled state too; no-op as a safety net
    setApplying(theme.key);
    try {
      await themesAPI.setMyTheme(theme.key);
      setCurrentTheme(theme.key);
      toast.success('Theme applied! Your content stays exactly the same.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to apply theme');
    } finally { setApplying(''); }
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  const freeThemes = themes.filter(t => !t.isPremium);
  const premiumThemes = themes.filter(t => t.isPremium);

  const ThemeCard = ({ theme }) => {
    const isActive = currentTheme === theme.key;
    const isLocked = theme.isPremium && !isPro;
    return (
      <div className={`card p-0 overflow-hidden transition-all ${isActive ? 'border-primary-500 ring-1 ring-primary-500/30' : isLocked ? 'opacity-90' : 'hover:border-dark-400'}`}>
        <div className="h-28 relative" style={{ background: '#0a0a12' }}>
          <div className="absolute inset-0 p-3 flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-full" style={{ background: theme.previewAccent, opacity: 0.8 }} />
            <div className="w-2/3 h-1.5 rounded bg-white/30" />
            <div className="w-1/2 h-1.5 rounded" style={{ background: theme.previewAccent, opacity: 0.6 }} />
          </div>
          {isActive && <span className="absolute top-2 right-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full font-medium">Active</span>}
          {theme.isDefault && <span className="absolute top-2 left-2 text-xs bg-dark-900/80 text-gray-300 px-2 py-0.5 rounded-full font-medium">Default</span>}
          {isLocked && (
            <div className="absolute inset-0 bg-dark-900/55 flex items-center justify-center backdrop-blur-[1px]">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-300 bg-dark-900/80 px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3z" /></svg>
                Pro Theme
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white text-sm">{theme.name}</h3>
            {theme.isPremium && <Badge color="purple">Pro</Badge>}
          </div>
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{theme.description}</p>
          <div className="flex gap-2">
            {username && (
              <a href={`/${username}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex-1 justify-center">
                {isActive ? 'View Live' : 'N/A'}
              </a>
            )}
            {isLocked ? (
              <Link to={`/pricing?theme=${encodeURIComponent(theme.key)}&themeName=${encodeURIComponent(theme.name)}`} className="btn-primary text-xs flex-1 justify-center">Unlock with Pro</Link>
            ) : (
              <button onClick={() => handleApply(theme)} disabled={isActive || applying === theme.key}
                className={isActive ? 'btn-secondary text-xs flex-1 justify-center opacity-50' : 'btn-primary text-xs flex-1 justify-center'}>
                {applying === theme.key ? <Spinner size="sm" /> : isActive ? 'Applied' : 'Apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Themes" description="Pick from the themes your admin has made available — your content is never lost"
        action={<Link to="/themes" className="btn-secondary text-xs">Preview Gallery ↗</Link>} />

      {themes.length === 0 ? (
        <EmptyState title="No themes available yet" description="Ask your admin to enable at least one theme in the Theme Manager" />
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Standard Themes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {freeThemes.map(theme => <ThemeCard key={theme._id} theme={theme} />)}
            </div>
          </div>

          {premiumThemes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Premium Themes</h2>
                {!isPro && <Link to="/pricing" className="text-xs text-primary-400 hover:text-primary-300">Unlock all →</Link>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {premiumThemes.map(theme => <ThemeCard key={theme._id} theme={theme} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
