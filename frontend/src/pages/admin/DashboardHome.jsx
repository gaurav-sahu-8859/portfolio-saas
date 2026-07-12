import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portfolioAPI } from '../../services/api';
import { StatCard, Spinner, Badge } from '../../components/shared/UI';
import toast from 'react-hot-toast';
import {
  FolderOpenIcon, BoltIcon, BriefcaseIcon,
  AcademicCapIcon, EyeIcon, GlobeAltIcon
} from '@heroicons/react/24/outline';

// Heroicons v1 fallback icons as SVG inline
const Icon = ({ path, className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
  </svg>
);

const ICONS = {
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  briefcase: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  academic: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  globe: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  cert: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
};

const quickActions = [
  { label: 'Edit Profile', to: '/dashboard/profile', icon: ICONS.briefcase, color: 'bg-primary-500/10 text-primary-400' },
  { label: 'Add Project', to: '/dashboard/projects', icon: ICONS.folder, color: 'bg-blue-500/10 text-blue-400' },
  { label: 'Add Skill', to: '/dashboard/skills', icon: ICONS.bolt, color: 'bg-green-500/10 text-green-400' },
  { label: 'Settings', to: '/dashboard/settings', icon: ICONS.globe, color: 'bg-purple-500/10 text-purple-400' },
];

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await portfolioAPI.stats();
      setStats(data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleTogglePublish = async () => {
    setPublishing(true);
    try {
      const { data } = await portfolioAPI.togglePublish();
      setStats(prev => ({ ...prev, isPublished: data.isPublished }));
      toast.success(data.message);
    } catch {
      toast.error('Failed to update publish status');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your portfolio content</p>
        </div>
        <div className="flex items-center gap-3">
          {stats?.isPublished && (
            <a href={`/${stats.username}`} target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-xs">
              <Icon path={ICONS.globe} className="w-4 h-4" />
              View Live
            </a>
          )}
          <button onClick={handleTogglePublish} disabled={publishing}
            className={stats?.isPublished ? 'btn-secondary' : 'btn-primary'}>
            {publishing ? <Spinner size="sm" /> : <Icon path={ICONS.globe} className="w-4 h-4" />}
            {stats?.isPublished ? 'Unpublish' : 'Publish Portfolio'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {stats?.isPublished && stats?.username && (
        <div className="card border-primary-500/30 bg-primary-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <div>
              <p className="text-sm font-medium text-white">Portfolio is live</p>
              <p className="text-xs text-gray-400 font-mono">{window.location.origin}/{stats.username}</p>
            </div>
          </div>
          <a href={`/${stats.username}`} target="_blank" rel="noopener noreferrer"
            className="text-primary-400 text-xs hover:text-primary-300 font-medium">Open →</a>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={() => <Icon path={ICONS.eye} className="w-6 h-6" />} label="Portfolio Views" value={stats?.views ?? 0} color="primary" />
        <StatCard icon={() => <Icon path={ICONS.folder} className="w-6 h-6" />} label="Projects" value={stats?.projects ?? 0} color="blue" />
        <StatCard icon={() => <Icon path={ICONS.bolt} className="w-6 h-6" />} label="Skills" value={stats?.skills ?? 0} color="green" />
        <StatCard icon={() => <Icon path={ICONS.briefcase} className="w-6 h-6" />} label="Experience" value={stats?.experience ?? 0} color="orange" />
        <StatCard icon={() => <Icon path={ICONS.academic} className="w-6 h-6" />} label="Education" value={stats?.education ?? 0} color="purple" />
        <StatCard icon={() => <Icon path={ICONS.cert} className="w-6 h-6" />} label="Certificates" value={stats?.certificates ?? 0} color="red" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <Link key={action.to} to={action.to}
              className="card hover:border-dark-400 transition-all duration-200 flex items-center gap-3 cursor-pointer group">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                <Icon path={action.icon} className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Completion checklist */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Portfolio Completion</h2>
        <div className="space-y-2">
          {[
            { label: 'Add profile info', done: true, to: '/dashboard/profile' },
            { label: 'Add at least one project', done: (stats?.projects ?? 0) > 0, to: '/dashboard/projects' },
            { label: 'Add your skills', done: (stats?.skills ?? 0) > 0, to: '/dashboard/skills' },
            { label: 'Add work experience', done: (stats?.experience ?? 0) > 0, to: '/dashboard/experience' },
            { label: 'Publish your portfolio', done: stats?.isPublished, to: null },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                item.done ? 'bg-green-500 border-green-500' : 'border-dark-500'
              }`}>
                {item.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              {item.to ? (
                <Link to={item.to} className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-300 hover:text-primary-400'} transition-colors`}>{item.label}</Link>
              ) : (
                <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
