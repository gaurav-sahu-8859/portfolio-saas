import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { Spinner } from '../../components/shared/UI';
import { getThemeComponent } from '../../themes';

export default function PublicPortfolioPage() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    publicAPI.getPortfolio(username)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Portfolio not found'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="xl" />
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <h1 style={{ fontSize: 64, fontWeight: 800, color: '#fff', marginBottom: 12 }}>404</h1>
      <p style={{ color: '#94a3b8', marginBottom: 24 }}>{error}</p>
      <Link to="/" style={{ color: '#818cf8', fontSize: 14, textDecoration: 'none' }}>← Back to home</Link>
    </div>
  );

  const ThemeComponent = getThemeComponent(data.portfolio.theme);
  // // Same as OwnerPortfolioPage — plain Cloudinary secure_url now, no
  // // backend proxy. Field name unchanged so theme components need no edits.
  // const enrichedData = {
  //   ...data,
  //   // resumeViewUrl: data.portfolio?.resumeUrl || null,
  //   resumeViewUrl: data.portfolio?.resumeUrl ? publicAPI.resumeUrlFor(username) : null,
  // };
  const enrichedData = {
    ...data,
    // resumeViewUrl: data.portfolio?.resumeUrl || null,
    // `updatedAt` changes on every resume re-upload (Portfolio has
    // timestamps: true), so passing it here forces the resulting URL to
    // change too — that's what prevents a browser/CDN from serving back a
    // previously cached (stale) resume after the user replaces theirs.
    resumeViewUrl: data.portfolio?.resumeUrl
      ? publicAPI.resumeUrlFor(username, data.portfolio?.updatedAt ? new Date(data.portfolio.updatedAt).getTime() : undefined)
      : null,
  };
  return <ThemeComponent data={enrichedData} accent={data.portfolio.accentColor} />;
}
