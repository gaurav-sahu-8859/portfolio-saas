/**
 * Single source of truth for "does this portfolio have a resume, and what
 * URL should every theme's CTA point to". Every theme component calls this
 * instead of reading `portfolio.resumeUrl` directly.
 *
 * `data.resumeViewUrl` is computed ONCE, at the page level, by
 * OwnerPortfolioPage / PublicPortfolioPage — it's the plain Cloudinary
 * secure_url, opened directly in a new tab. No backend proxy is involved.
 * Keeping this field name (and this function) as the one thing every theme
 * reads is what makes "a theme is missing the resume button" impossible to
 * reintroduce by accident — adding theme #14 just means calling this once,
 * and it's also what made swapping the underlying URL source (away from a
 * proxy, back to the plain Cloudinary link) a two-file change instead of a
 * thirteen-file one.
  
  
 * OwnerPortfolioPage / PublicPortfolioPage — it already points at the
 * backend's resume proxy (GET /api/public/owner/resume or
 * GET /api/public/:username/resume), never at the raw Cloudinary URL.
 * That's what makes the Cloudinary fix apply to every theme automatically,
 * and what makes "a theme is missing the resume button" impossible to
 * reintroduce by accident — adding theme #11 just means calling this once.
 
 */
export const getResumeLink = (data) => {
  const url = data?.resumeViewUrl;
  return {
    hasResume: !!url,
    href: url || undefined,
    // Spread directly onto a theme's own <a>, e.g. <a {...linkProps} className="ms-btn">Resume</a>
    linkProps: {
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  };
};
