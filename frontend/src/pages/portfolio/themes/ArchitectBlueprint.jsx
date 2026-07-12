import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function ArchitectBlueprint({ data, accent = '#5ec8e8' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scroll = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const skillGroups = skills.reduce((a, s) => { if (!a[s.category]) a[s.category] = []; a[s.category].push(s); return a; }, {});
  const navLinks = ['index', ...(skills.length ? ['specs'] : []), ...(projects.length ? ['drawings'] : []), ...(experience.length ? ['history'] : []), 'contact'];

  return (
    <div style={{ background: '#0c2d4a', color: '#cfe8f5', fontFamily: "'JetBrains Mono', 'Inter', monospace", minHeight: '100vh' }}>
      <style>{`
        .ab-accent { color: ${A}; }
        .ab-grid-bg { background-image: linear-gradient(${A}1a 1px, transparent 1px), linear-gradient(90deg, ${A}1a 1px, transparent 1px); background-size: 28px 28px; }
        .ab-card { background: rgba(255,255,255,0.02); border: 1px solid ${A}33; transition: all 0.25s; position: relative; }
        .ab-card:hover { border-color: ${A}; }
        .ab-card::before { content: ''; position: absolute; top: -1px; left: -1px; width: 10px; height: 10px; border-top: 2px solid ${A}; border-left: 2px solid ${A}; }
        .ab-card::after { content: ''; position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; border-bottom: 2px solid ${A}; border-right: 2px solid ${A}; }
        .ab-btn { background: ${A}; color: #0c2d4a; padding: 12px 28px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 13px; letter-spacing: 1px; }
        .ab-btn-outline { background: transparent; border: 1px solid ${A}; color: ${A}; padding: 11px 26px; text-decoration: none; display: inline-block; font-size: 13px; letter-spacing: 1px; transition: all 0.2s; }
        .ab-btn-outline:hover { background: ${A}15; }
        .ab-section { padding: 70px 24px; max-width: 1080px; margin: 0 auto; }
        .ab-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: ${A}aa; margin-bottom: 6px; }
        .ab-h2 { font-family: 'Inter', sans-serif; font-size: clamp(26px,4vw,38px); font-weight: 800; margin-bottom: 6px; }
        .ab-dim-line { border-bottom: 1px dashed ${A}55; position: relative; margin: 30px 0; }
        .ab-nav-link { background: none; border: none; color: #8fb8cf; font-size: 11px; cursor: pointer; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 10px; }
        .ab-nav-link:hover { color: ${A}; }
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(12,45,74,0.95)' : 'transparent', backdropFilter: 'blur(10px)', borderBottom: scrolled ? `1px solid ${A}33` : 'none', transition: 'all 0.3s' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "'Inter',sans-serif" }}>
            <span className="ab-accent">#</span>{(portfolio.fullName || user.name).toUpperCase().replace(/\s/g, '-')}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {navLinks.map(l => <button key={l} className="ab-nav-link" onClick={() => scroll(l)}>{l}</button>)}
          </div>
        </div>
      </nav>

      {/* Hero — drafting sheet */}
      <section id="index" className="ab-grid-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '110px 24px 60px', position: 'relative' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}>
          <p className="ab-label" style={{ fontFamily: "'Inter',sans-serif" }}>DWG NO. 001 — {portfolio.tagline || 'PROFILE SHEET'}</p>
          <h1 style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(38px,7vw,72px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 16, color: '#fff' }}>
            {portfolio.fullName || user.name}
          </h1>
          <div className="ab-dim-line" style={{ maxWidth: 400 }} />
          <p className="ab-accent" style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{portfolio.title}</p>
          {portfolio.bio && <p style={{ color: '#a8cce0', fontSize: 14, lineHeight: 1.8, maxWidth: 560, marginBottom: 32, fontFamily: "'Inter',sans-serif" }}>{portfolio.bio}</p>}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="ab-btn">OPEN_CHANNEL</a>}
            {hasResume && <a {...resumeLink} className="ab-btn-outline">VIEW_SPEC_SHEET.pdf</a>}
            {portfolio.socialLinks?.github && <a href={portfolio.socialLinks.github} target="_blank" rel="noopener noreferrer" className="ab-btn-outline">SOURCE_REPO</a>}
          </div>
        </div>
      </section>

      {/* Skills — spec table */}
      {skills.length > 0 && (
        <section id="specs" className="ab-section">
          <p className="ab-label">SECTION 02</p>
          <h2 className="ab-h2" style={{ marginBottom: 40 }}>Technical <span className="ab-accent">Specifications</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 20 }}>
            {Object.entries(skillGroups).map(([cat, items]) => (
              <div key={cat} className="ab-card" style={{ padding: 22 }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, letterSpacing: 1.5, color: '#8fb8cf', textTransform: 'uppercase', marginBottom: 16 }}>{cat}</p>
                {items.map(s => (
                  <div key={s._id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span>{s.name}</span><span className="ab-accent">{s.level}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${s.level}%`, background: A }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects — drawing sheets */}
      {projects.length > 0 && (
        <section id="drawings" className="ab-section">
          <p className="ab-label">SECTION 03</p>
          <h2 className="ab-h2" style={{ marginBottom: 40 }}>Project <span className="ab-accent">Drawings</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 24 }}>
            {projects.map((p, i) => (
              <div key={p._id} className="ab-card">
                {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: 180, objectFit: 'cover', opacity: 0.92, filter: 'sepia(8%) hue-rotate(170deg) saturate(0.8)' }} />}
                <div style={{ padding: 20 }}>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#8fb8cf', letterSpacing: 1 }}>FIG. {String(i + 1).padStart(2, '0')}</p>
                  <h3 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#fff' }}>{p.name}</h3>
                  {p.description && <p style={{ color: '#a8cce0', fontSize: 13, lineHeight: 1.6, marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>{p.description}</p>}
                  {p.technologies?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {p.technologies.map(t => <span key={t} style={{ fontSize: 10, border: `1px solid ${A}55`, color: A, padding: '2px 7px' }}>{t}</span>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14, fontFamily: "'Inter',sans-serif" }}>
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="ab-accent" style={{ fontSize: 12, textDecoration: 'none' }}>SRC →</a>}
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#a8cce0', textDecoration: 'none' }}>LIVE →</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience — timeline ledger */}
      {experience.length > 0 && (
        <section id="history" className="ab-section">
          <p className="ab-label">SECTION 04</p>
          <h2 className="ab-h2" style={{ marginBottom: 40 }}>Revision <span className="ab-accent">History</span></h2>
          {experience.map((exp, i) => (
            <div key={exp._id} className="ab-card" style={{ padding: 20, marginBottom: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#8fb8cf' }}>REV {String(experience.length - i).padStart(2, '0')}</p>
                <h3 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>{exp.position}</h3>
                <p className="ab-accent" style={{ fontSize: 13 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                {exp.description && <p style={{ color: '#a8cce0', fontSize: 13, marginTop: 8, maxWidth: 500, fontFamily: "'Inter',sans-serif" }}>{exp.description}</p>}
              </div>
              <span style={{ fontSize: 11, color: '#7099b3' }}>{fmt(exp.startDate)} → {exp.current ? 'CURRENT' : fmt(exp.endDate)}</span>
            </div>
          ))}
        </section>
      )}

      {/* Education + Certificates */}
      {(education.length > 0 || certificates.length > 0) && (
        <section className="ab-section" style={{ display: 'grid', gridTemplateColumns: education.length && certificates.length ? '1fr 1fr' : '1fr', gap: 24 }}>
          {education.length > 0 && (
            <div>
              <p className="ab-label">CREDENTIALS — EDU</p>
              {education.map(e => (
                <div key={e._id} className="ab-card" style={{ padding: 16, marginBottom: 10 }}>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff' }}>{e.degree}</p>
                  <p style={{ fontSize: 12, color: '#a8cce0' }}>{e.school} · {e.startYear}–{e.current ? 'present' : e.endYear}</p>
                </div>
              ))}
            </div>
          )}
          {certificates.length > 0 && (
            <div>
              <p className="ab-label">CREDENTIALS — CERT</p>
              {certificates.map(c => (
                <div key={c._id} className="ab-card" style={{ padding: 16, marginBottom: 10 }}>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff' }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: '#a8cce0' }}>{c.organization} · {fmt(c.issueDate)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section id="contact" className="ab-section" style={{ textAlign: 'center' }}>
        <p className="ab-label">SECTION 05 — FINAL SHEET</p>
        <h2 className="ab-h2" style={{ marginBottom: 30 }}>Open a <span className="ab-accent">Channel</span></h2>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="ab-btn">SEND_MESSAGE</a>}
          {hasResume && <a {...resumeLink} className="ab-btn-outline">DOWNLOAD_SPEC_SHEET</a>}
          {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="ab-btn-outline">LINKEDIN</a>}
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: 24, borderTop: `1px solid ${A}33`, fontSize: 10, color: '#5d8aa3', letterSpacing: 1 }}>
        DRAWN WITH PORTFOLIOFORGE — SCALE 1:1
      </footer>
    </div>
  );
}
