/**
 * The set of theme keys that have a real, implemented React component in
 * frontend/src/pages/portfolio/themes/ (registered in frontend/src/themes/index.js).
 *
 * Admins can only add a catalog entry (Theme document) whose `key` appears
 * here — this prevents creating a theme in the database that has no
 * matching frontend component, which would silently fall back to the
 * default renderer and confuse everyone.
 *
 * `isPremium: true` themes can be viewed by anyone but only SELECTED by
 * users on the 'pro' plan — enforced server-side in
 * portfolioController.updateMyTheme, not just hidden in the UI.
 *
 * Adding a new theme is a two-step process:
 *   1. Ship the new React component + register it in themes/index.js (code)
 *   2. Add its entry here, then an admin can add it to the live catalog (data)
 *
 * Keep this list and frontend/src/themes/themeConfig.js in sync — they
 * describe the same compiled set of components from two different runtimes.
 */
module.exports = [
  { key: 'modern-saas', name: 'Modern SaaS', description: 'Clean, professional SaaS-style with gradient accents and cards', previewAccent: '#6366f1', isPremium: false },
  { key: 'developer-terminal', name: 'Developer Terminal', description: 'Hacker aesthetic with terminal green, monospace fonts, and CLI feel', previewAccent: '#00ff41', isPremium: false },
  { key: 'creative-designer', name: 'Creative Designer', description: 'Bold typography, vibrant colors, asymmetric layouts for creatives', previewAccent: '#ff3366', isPremium: false },
  { key: 'minimal-professional', name: 'Minimal Professional', description: 'Ultra-clean whitespace, serif typography, sophisticated and timeless', previewAccent: '#1a1a2e', isPremium: false },
  { key: 'futuristic-ai', name: 'Futuristic AI', description: 'Cyberpunk neon on dark canvas with glowing borders and sci-fi vibes', previewAccent: '#00d4ff', isPremium: false },
  { key: 'startup-founder', name: 'Startup Founder', description: 'Orange energy, bold sections, and startup pitch-deck aesthetics', previewAccent: '#ff6b00', isPremium: false },
  { key: 'glassmorphism', name: 'Glassmorphism', description: 'Frosted glass cards, blur effects, and aurora gradient backgrounds', previewAccent: '#a855f7', isPremium: false },
  { key: 'premium-dark', name: 'Premium Dark', description: 'Luxury gold accents, rich dark surfaces, and editorial typography', previewAccent: '#d4af37', isPremium: true },

  // ── Premium-only themes (Pro plan required to select) ──────────────────
  { key: 'executive-suite', name: 'Executive Suite', description: 'Navy and gold corporate layout with a commanding hero and refined data presentation — built for C-suite and consulting portfolios', previewAccent: '#c9a227', isPremium: true },
  { key: 'neon-cyber-pro', name: 'Neon Cyber Pro', description: 'Animated particle field, holographic cards, and layered glow effects — the most elaborate cyberpunk layout in the catalog', previewAccent: '#ff2bd6', isPremium: true },
  { key: 'editorial-magazine', name: 'Editorial Magazine', description: 'Print-magazine layout with a masthead header, drop-cap intro, and feature-article styling for experience and projects', previewAccent: '#a3271f', isPremium: true },
  { key: 'architect-blueprint', name: 'Architect Blueprint', description: 'Technical drafting aesthetic with blueprint grid lines, corner brackets, and dimension-line styling for a precise, engineered feel', previewAccent: '#5ec8e8', isPremium: true },
  { key: 'velvet-noir', name: 'Velvet Noir', description: 'Cinematic, moody dark layout with dramatic italic type, spotlight gradients, and a film-credits-inspired experience section', previewAccent: '#8a1538', isPremium: true },
];
