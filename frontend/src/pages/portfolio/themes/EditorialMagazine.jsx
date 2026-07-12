import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function EditorialMagazine({ data, accent = '#a3271f' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;
  const [scrolled, setScrolled] = useState(false);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const skillGroups = skills.reduce((a, s) => { if (!a[s.category]) a[s.category] = []; a[s.category].push(s); return a; }, {});

  return (
    <div style={{ background: '#f7f3ea', color: '#1a1a1a', fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: '100vh' }}>
      <style>{`
        .em-accent { color: ${A}; }
        .em-rule { border-top: 3px solid #1a1a1a; }
        .em-rule-thin { border-top: 1px solid #1a1a1a44; }
        .em-card { background: #fffdf8; border: 1px solid #1a1a1a22; transition: all 0.25s; }
        .em-card:hover { border-color: ${A}66; box-shadow: 4px 4px 0 ${A}22; }
        .em-btn { background: #1a1a1a; color: #f7f3ea; padding: 13px 30px; font-weight: 600; text-decoration: none; display: inline-block; font-family: 'Inter', sans-serif; font-size: 13px; letter-spacing: 0.5px; }
        .em-btn:hover { background: ${A}; }
        .em-btn-outline { background: transparent; border: 2px solid #1a1a1a; color: #1a1a1a; padding: 11px 28px; text-decoration: none; display: inline-block; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; transition: all 0.2s; }
        .em-btn-outline:hover { border-color: ${A}; color: ${A}; }
        .em-section { padding: 70px 32px; max-width: 980px; margin: 0 auto; }
        .em-kicker { font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: ${A}; font-weight: 700; margin-bottom: 10px; }
        .em-h2 { font-size: clamp(30px,4.5vw,46px); font-weight: 700; margin-bottom: 40px; }
        .em-dropcap::first-letter { font-size: 64px; font-weight: 700; float: left; line-height: 0.85; margin: 4px 8px 0 0; color: ${A}; font-family: 'Georgia', serif; }
        @media (max-width: 768px) { .em-section { padding: 44px 18px; } }
      `}</style>

      {/* Masthead */}
      <header style={{ position: scrolled ? 'fixed' : 'relative', top: 0, left: 0, right: 0, zIndex: 100, background: '#f7f3ea', borderBottom: scrolled ? '1px solid #1a1a1a22' : 'none' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Inter',sans-serif" }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#1a1a1a99' }}>{today}</span>
          <Link to="/builder" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#1a1a1a99', textDecoration: 'none' }}>PortfolioForge</Link>
        </div>
      </header>
      {scrolled && <div style={{ height: 44 }} />}

      {/* Hero / Cover story */}
      <section className="em-section" style={{ textAlign: 'center', paddingTop: 50 }}>
        <p className="em-kicker">{portfolio.tagline || 'Cover Story'}</p>
        <h1 style={{ fontSize: 'clamp(46px,9vw,96px)', fontWeight: 700, lineHeight: 0.98, letterSpacing: '-1px', marginBottom: 18 }}>{portfolio.fullName || user.name}</h1>
        <div className="em-rule" style={{ width: 100, margin: '0 auto 22px' }} />
        <p className="em-accent" style={{ fontSize: 20, fontStyle: 'italic', marginBottom: 28 }}>{portfolio.title}</p>
        {portfolio.profilePicture && (
          <img src={portfolio.profilePicture} alt="" style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 28px', display: 'block', filter: 'grayscale(40%) contrast(1.05)', border: '4px solid #fffdf8', boxShadow: '0 0 0 1px #1a1a1a22' }} />
        )}
        {portfolio.bio && <p className="em-dropcap" style={{ fontSize: 18, lineHeight: 1.9, maxWidth: 620, margin: '0 auto 36px', textAlign: 'left' }}>{portfolio.bio}</p>}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="em-btn">Get in Touch</a>}
          {hasResume && <a {...resumeLink} className="em-btn-outline">Read Full Résumé</a>}
        </div>
      </section>

      {/* Experience — feature article style */}
      {experience.length > 0 && (
        <section className="em-section em-rule-thin">
          <p className="em-kicker">Career Feature</p>
          <h2 className="em-h2">Professional <span className="em-accent">Experience</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 28 }}>
            {experience.map(exp => (
              <div key={exp._id}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, letterSpacing: 1, color: '#1a1a1a77', textTransform: 'uppercase', marginBottom: 6 }}>{fmt(exp.startDate)} — {exp.current ? 'Present' : fmt(exp.endDate)}</p>
                <h3 style={{ fontSize: 21, fontWeight: 700, marginBottom: 2 }}>{exp.position}</h3>
                <p className="em-accent" style={{ fontSize: 15, fontStyle: 'italic', marginBottom: 10 }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                {exp.description && <p style={{ fontSize: 15, lineHeight: 1.8, color: '#333' }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills — like a sidebar column */}
      {skills.length > 0 && (
        <section className="em-section em-rule-thin">
          <p className="em-kicker">At a Glance</p>
          <h2 className="em-h2">Skills & <span className="em-accent">Expertise</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 24 }}>
            {Object.entries(skillGroups).map(([cat, items]) => (
              <div key={cat} style={{ borderLeft: `3px solid ${A}`, paddingLeft: 16 }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1a1a1a77', marginBottom: 10 }}>{cat}</p>
                {items.map(s => (
                  <p key={s._id} style={{ fontSize: 16, marginBottom: 4 }}>{s.name}</p>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects — gallery spread */}
      {projects.length > 0 && (
        <section className="em-section em-rule-thin">
          <p className="em-kicker">Portfolio Spread</p>
          <h2 className="em-h2">Selected <span className="em-accent">Works</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 30 }}>
            {projects.map(p => (
              <div key={p._id} className="em-card">
                {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: 200, objectFit: 'cover', filter: 'grayscale(15%)' }} />}
                <div style={{ padding: 22 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{p.name}</h3>
                  {p.description && <p style={{ fontSize: 14, lineHeight: 1.7, color: '#333', marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>{p.description}</p>}
                  <div style={{ display: 'flex', gap: 16, fontFamily: "'Inter',sans-serif" }}>
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="em-accent" style={{ fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Read More →</a>}
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1a1a1a99', textDecoration: 'none' }}>Source</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education + Certificates — two-column masthead block */}
      {(education.length > 0 || certificates.length > 0) && (
        <section className="em-section em-rule-thin" style={{ display: 'grid', gridTemplateColumns: education.length && certificates.length ? '1fr 1fr' : '1fr', gap: 40 }}>
          {education.length > 0 && (
            <div>
              <p className="em-kicker">Academic Record</p>
              {education.map(e => (
                <div key={e._id} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{e.degree}{e.field ? `, ${e.field}` : ''}</h3>
                  <p className="em-accent" style={{ fontStyle: 'italic', fontSize: 14 }}>{e.school}</p>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#1a1a1a77', marginTop: 4 }}>{e.startYear}–{e.current ? 'present' : e.endYear}{e.grade ? ` · ${e.grade}` : ''}</p>
                </div>
              ))}
            </div>
          )}
          {certificates.length > 0 && (
            <div>
              <p className="em-kicker">Credentials</p>
              {certificates.map(c => (
                <div key={c._id} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{c.name}</h3>
                  <p className="em-accent" style={{ fontStyle: 'italic', fontSize: 14 }}>{c.organization}</p>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#1a1a1a77', marginTop: 4 }}>{fmt(c.issueDate)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Closing / contact — back page masthead */}
      <section className="em-section em-rule" style={{ textAlign: 'center' }}>
        <p className="em-kicker">Letters to the Editor</p>
        <h2 className="em-h2">Get in <span className="em-accent">Touch</span></h2>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="em-btn">Send a Letter</a>}
          {hasResume && <a {...resumeLink} className="em-btn-outline">Download Résumé</a>}
          {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="em-btn-outline">LinkedIn</a>}
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: 24, fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#1a1a1a66', letterSpacing: 1 }}>
        ISSUE №1 · BUILT WITH PORTFOLIOFORGE
      </footer>
    </div>
  );
}
