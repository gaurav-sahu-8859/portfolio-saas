import ModernSaas from '../pages/portfolio/themes/ModernSaas';
import DeveloperTerminal from '../pages/portfolio/themes/DeveloperTerminal';
import CreativeDesigner from '../pages/portfolio/themes/CreativeDesigner';
import MinimalProfessional from '../pages/portfolio/themes/MinimalProfessional';
import FuturisticAI from '../pages/portfolio/themes/FuturisticAI';
import StartupFounder from '../pages/portfolio/themes/StartupFounder';
import Glassmorphism from '../pages/portfolio/themes/Glassmorphism';
import PremiumDark from '../pages/portfolio/themes/PremiumDark';
import ExecutiveSuite from '../pages/portfolio/themes/ExecutiveSuite';
import NeonCyberPro from '../pages/portfolio/themes/NeonCyberPro';
import EditorialMagazine from '../pages/portfolio/themes/EditorialMagazine';
import ArchitectBlueprint from '../pages/portfolio/themes/ArchitectBlueprint';
import VelvetNoir from '../pages/portfolio/themes/VelvetNoir';

export const THEME_COMPONENTS = {
  'modern-saas': ModernSaas,
  'developer-terminal': DeveloperTerminal,
  'creative-designer': CreativeDesigner,
  'minimal-professional': MinimalProfessional,
  'futuristic-ai': FuturisticAI,
  'startup-founder': StartupFounder,
  'glassmorphism': Glassmorphism,
  'premium-dark': PremiumDark,
  // ── Premium (Pro plan required to select) ──
  'executive-suite': ExecutiveSuite,
  'neon-cyber-pro': NeonCyberPro,
  'editorial-magazine': EditorialMagazine,
  'architect-blueprint': ArchitectBlueprint,
  'velvet-noir': VelvetNoir,
};

export const getThemeComponent = (id) => THEME_COMPONENTS[id] || ModernSaas;
