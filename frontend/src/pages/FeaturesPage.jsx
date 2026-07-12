import React from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  { title: 'Theme Engine', items: ['8 fully distinct layouts', 'Live preview before applying', 'Desktop/Tablet/Mobile preview', 'Switch anytime, data persists'] },
  { title: 'Content Management', items: ['Profile & cover image', 'Unlimited projects, skills, experience', 'Education & certificates', 'Resume PDF upload'] },
  { title: 'Publishing', items: ['Unique username URL', 'Publish/unpublish anytime', 'SEO title & description per portfolio', 'View analytics'] },
  { title: 'Built for Scale', items: ['Multi-user isolated data', 'JWT authentication', 'Responsive on every device', 'Admin moderation tools'] },
];

export default function FeaturesPage() {
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
          <Link to="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold text-white mb-3">Everything you need to stand out</h1>
          <p className="text-gray-400">A complete portfolio builder platform, not just a template.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SECTIONS.map(s => (
            <div key={s.title} className="card">
              <h3 className="font-bold text-white mb-4">{s.title}</h3>
              <ul className="space-y-2.5">
                {s.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <Link to="/register" className="btn-primary px-8 py-3">Start Building Free →</Link>
        </div>
      </div>
    </div>
  );
}
