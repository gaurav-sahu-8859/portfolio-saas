import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { themesAPI, portfolioAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from './UI';
import toast from 'react-hot-toast';

/**
 * Theme Switcher Bar
 * ──────────────────
 * Mounted once in DashboardLayout, directly after the navigation bar and
 * before the page <Outlet/>. Visible to EVERY authenticated user (normal
 * users and admins alike) — this is rule #2/#6/#7's UI: pick from the
 * admin-curated catalog, persisted to YOUR OWN portfolio only.
 *
 * Premium (Pro-only) themes are shown to everyone with a lock + "Pro" badge
 * so free users can see what they're missing, but clicking one without an
 * active Pro plan shows an upgrade prompt instead of switching — the actual
 * enforcement happens server-side in portfolioController.updateMyTheme,
 * this is just the matching UX.
 *
 * The "Manage Themes" shortcut on the right is the only piece of this bar
 * that's admin-only, conditionally rendered from `isAdmin`. It links to the
 * separate, fully-guarded /dashboard/admin/themes page — it does not expose
 * any create/update/delete affordance here.
 */
export default function ThemeSwitcherBar() {
  const { isAdmin, isPro } = useAuth();
  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState('');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const load = async () => {
    try {
      const [themesRes, statsRes] = await Promise.all([
        themesAPI.getEnabled(),
        portfolioAPI.stats(),
      ]);
      setThemes(themesRes.data);
      setActiveTheme(statsRes.data.theme);
    } catch {
      // Silently degrade — a failed theme load shouldn't block the dashboard.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSwitch = async (t) => {
    if (t.key === activeTheme || switching) return;

    if (t.isPremium && !isPro) {
      toast((to) => (
        <span className="text-sm">
          "{t.name}" is a Pro theme.{' '}
          <Link to={`/pricing?theme=${encodeURIComponent(t.key)}&themeName=${encodeURIComponent(t.name)}`} onClick={() => toast.dismiss(to.id)} className="text-primary-400 underline font-medium">
            Upgrade to unlock it →
          </Link>
        </span>
      ), { duration: 5000 });
      return;
    }

    setSwitching(t.key);
    try {
      await themesAPI.setMyTheme(t.key);
      setActiveTheme(t.key);
      toast.success('Theme applied to your portfolio');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to switch theme');
    } finally {
      setSwitching('');
    }
  };

  if (loading) {
    return (
      <div className="border-b border-dark-600 bg-dark-800/50 px-4 lg:px-6 py-3 flex items-center justify-center">
        <Spinner size="sm" />
      </div>
    );
  }

  if (themes.length === 0) {
    // Catalog empty (fresh install, not seeded yet) — degrade gracefully, no crash.
    return null;
  }

  return (
    <div className="border-b border-dark-600 bg-dark-800/50">
      <div className="flex items-center gap-3 px-4 lg:px-6 py-2.5">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${collapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Theme
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-none">
            {themes.map(t => {
              const isActive = t.key === activeTheme;
              const isLocked = t.isPremium && !isPro;
              return (
                <button
                  key={t._id}
                  onClick={() => handleSwitch(t)}
                  disabled={!!switching}
                  title={isLocked ? `${t.name} — Pro plan required` : t.description}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
                    isActive
                      ? 'bg-primary-600/15 border-primary-500 text-primary-300'
                      : isLocked
                      ? 'bg-dark-700/50 border-dark-600 text-gray-500 hover:border-orange-500/40'
                      : 'bg-dark-700 border-dark-500 text-gray-400 hover:text-gray-200 hover:border-dark-400'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.previewAccent }} />
                  {t.name}
                  {t.isPremium && (
                    isLocked ? (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3z" /></svg>
                        Pro
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/15 text-primary-300">Pro</span>
                    )
                  )}
                  {t.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dark-600 text-gray-500">Default</span>
                  )}
                  {switching === t.key && <Spinner size="sm" />}
                  {isActive && !switching && (
                    <svg className="w-3 h-3 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!isPro && !isAdmin && (
          <Link
            to="/pricing"
            className="flex items-center gap-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 flex-shrink-0 ml-auto pl-3 border-l border-dark-600"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3z" /></svg>
            Go Pro
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/dashboard/admin/themes"
            className={`flex items-center gap-1.5 text-xs font-medium text-orange-400 hover:text-orange-300 flex-shrink-0 ${isPro ? 'ml-auto' : ''} pl-3 border-l border-dark-600`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Themes
          </Link>
        )}
      </div>
    </div>
  );
}
