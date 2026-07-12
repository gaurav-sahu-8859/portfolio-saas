import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '⚡', title: 'Instant Setup', desc: 'Create your portfolio in minutes, not hours.' },
  { icon: '🎨', title: '8 Premium Themes', desc: 'Pick a layout and switch anytime without losing data.' },
  { icon: '🔗', title: 'Custom Username URL', desc: 'Get a clean public link like domain.com/yourname.' },
  { icon: '📱', title: 'Fully Responsive', desc: 'Looks great on mobile, tablet, laptop, and ultrawide.' },
  { icon: '📊', title: 'View Analytics', desc: 'See how many people are visiting your portfolio.' },
  { icon: '🛡️', title: 'Secure & Private', desc: 'Publish when ready, stay hidden until then.' },
];

export default function BuilderHomePage() {
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-dark-600 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">PF</span>
            </div>
            <span className="font-bold text-white">PortfolioForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/features" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:inline">Features</Link>
            <Link to="/themes" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:inline">Themes</Link>
            <Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:inline">Pricing</Link>
            <Link to="/explore" className="text-sm text-gray-400 hover:text-white transition-colors">Explore</Link>
            <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary-600/10 blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            Free to use — no credit card required
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Build a portfolio<br />
            <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">that gets you hired</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Create a stunning developer portfolio in minutes. Choose from 8 premium themes, showcase your work, and publish on a unique username URL.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-8 py-3">Create Your Portfolio →</Link>
            <Link to="/themes" className="btn-secondary text-base px-6 py-3">Browse Themes</Link>
          </div>
          <p className="text-xs text-gray-600 mt-4">Join thousands of developers showcasing their work</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-dark-600">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="card hover:border-dark-400 transition-all">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sections supported */}
      <section className="py-20 px-6 border-t border-dark-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">All sections. One place.</h2>
          <p className="text-gray-400 text-sm mb-10">Manage every aspect of your professional identity from a single dashboard.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Personal Info', 'Projects', 'Skills', 'Work Experience', 'Education', 'Certificates', 'Social Links', 'Resume Upload', 'Contact Info'].map(s => (
              <span key={s} className="px-3 py-1.5 bg-dark-700 border border-dark-500 rounded-full text-sm text-gray-300">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-dark-600">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to stand out?</h2>
          <p className="text-gray-400 mb-8">Your portfolio is one sign-up away. Free, fast, and yours forever.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-3">Get Started Free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 py-6 px-6 text-center">
        <p className="text-xs text-gray-600">© 2026 PortfolioForge. Built with React, Node.js & MongoDB.</p>
      </footer>
    </div>
  );
}
