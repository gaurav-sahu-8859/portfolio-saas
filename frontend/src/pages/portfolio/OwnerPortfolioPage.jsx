import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { Spinner } from '../../components/shared/UI';
import { getThemeComponent } from '../../themes';

// Renders the site OWNER's portfolio directly at "/"
export default function OwnerPortfolioPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    publicAPI.getOwnerPortfolio()
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Portfolio not configured'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="xl" />
    </div>
  );

  // If owner portfolio isn't set up yet, fall back to the SaaS landing page
  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Portfolio not set up yet</h1>
        <p style={{ color: '#94a3b8', marginBottom: 24, maxWidth: 420 }}>
          Set <code style={{ color: '#818cf8' }}>OWNER_USERNAME</code> in your backend .env to your username, then publish your portfolio from the dashboard.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" style={{ background: '#6366f1', color: '#fff', padding: '10px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Sign In</Link>
          <Link to="/builder" style={{ border: '1px solid #333', color: '#fff', padding: '10px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>SaaS Builder Home →</Link>
        </div>
      </div>
    );
  }

  const ThemeComponent = getThemeComponent(data?.portfolio?.theme);
  // // resumeViewUrl is the field every theme reads via getResumeLink(data).
  // // No backend proxy anymore — it's the plain Cloudinary secure_url,
  // // opened directly in a new tab. Keeping this field name unchanged means
  // // none of the 13 theme components need any edit for this fix.
  // const enrichedData = {
  //   ...data,
  //   resumeViewUrl: data.portfolio?.resumeUrl || null,
  // };

  // // Every theme reads resumeViewUrl (via getResumeLink) instead of the raw
  // // portfolio.resumeUrl — this is what routes resume clicks through the
  // // backend proxy, which guarantees correct headers regardless of how
  // // Cloudinary itself classified the file.
  // const enrichedData = {
  //   ...data,
  //   resumeViewUrl: data.portfolio?.resumeUrl ? publicAPI.ownerResumeUrl() : null,
  // };
  const enrichedData = {
    ...data,
    // See PublicPortfolioPage's identical comment: `updatedAt` (changes on
    // every resume re-upload) is baked into the URL so a browser/CDN can
    // never confuse "the new resume" with "whatever was cached under this
    // same static route before".
    resumeViewUrl: data.portfolio?.resumeUrl
      ? publicAPI.ownerResumeUrl(data.portfolio?.updatedAt ? new Date(data.portfolio.updatedAt).getTime() : undefined)
      : null,
  };
  return <ThemeComponent data={enrichedData} accent={data?.portfolio?.accentColor} />;
}
