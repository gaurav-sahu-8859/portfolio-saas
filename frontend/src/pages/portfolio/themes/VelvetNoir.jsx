import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function VelvetNoir({ data, accent = '#8a1538' }) {
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

  return (
    <div style={{ background: '#0a0608', color: '#ece4e6', fontFamily: "'Georgia', serif", minHeight: '100vh' }}>
      <style>{`
        .vn-accent { color: ${A === '#8a1538' ? '#d4536b' : A}; }
        .vn-vignette { background: radial-gradient(ellipse at center, transparent 40%, #0a0608 100%); }
        .vn-card { background: #15101280; border: 1px solid ${A}33; transition: all 0.3s; }
        .vn-card:hover { border-color: ${A}88; box-shadow: 0 0 30px ${A}22; }
        .vn-btn { background: ${A}; color: #fff; padding: 14px 36px; font-weight: 600; text-decoration: none; display: inline-block; letter-spacing: 1px; font-family: 'Inter', sans-serif; font-size: 13px; transition: all 0.25s; }
        .vn-btn:hover { background: #a8194a; box-shadow: 0 4px 20px ${A}66; }
        .vn-btn-outline { background: transparent; border: 1px solid #ece4e655; color: #ece4e6; padding: 13px 34px; text-decoration: none; display: inline-block; letter-spacing: 1px; font-family: 'Inter', sans-serif; font-size: 13px; transition: all 0.2s; }
        .vn-btn-outline:hover { border-color: ${A}; color: #d4536b; }
        .vn-section { padding: 90px 24px; max-width: 980px; margin: 0 auto; }
        .vn-label { font-family: 'Inter', sans-serif; letter-spacing: 4px; text-transform: uppercase; font-size: 11px; color: #8a7378; margin-bottom: 18px; }
        .vn-h2 { font-size: clamp(32px,5vw,52px); font-weight: 400; letter-spacing: 1px; font-style: italic; }
        .vn-nav-link { background: none; border: none; color: #a89499; font-size: 11px; cursor: pointer; letter-spacing: 2px; text-transform: uppercase; padding: 6px 12px; font-family: 'Inter', sans-serif; }
        .vn-nav-link:hover { color: #d4536b; }
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(10,6,8,0.94)' : 'transparent', backdropFilter: 'blur(12px)', borderBottom: scrolled ? '1px solid #2a1a1f' : 'none', transition: 'all 0.3s' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: 2 }}>{(portfolio.fullName || user.name).toUpperCase()}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['profile', 'work', 'contact'].map(s => <button key={s} className="vn-nav-link" onClick={() => scroll(s)}>{s}</button>)}
          </div>
        </div>
      </nav>

      {/* Hero — cinematic spotlight */}
      <section id="profile" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '120px 24px 60px', overflow: 'hidden' }}>
        <div className="vn-vignette" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${A}22, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', maxWidth: 680, position: 'relative', zIndex: 1 }}>
          {portfolio.profilePicture && (
            <img src={portfolio.profilePicture} alt="" style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 30px', display: 'block', filter: 'grayscale(60%) contrast(1.15) brightness(0.95)', border: `1px solid ${A}aa`, boxShadow: `0 0 50px ${A}33` }} />
          )}
          <p className="vn-label">{portfolio.tagline || 'A Portfolio'}</p>
          <h1 style={{ fontSize: 'clamp(40px,8vw,76px)', fontWeight: 400, letterSpacing: '1px', lineHeight: 1.05, marginBottom: 18, color: '#fff' }}>{portfolio.fullName || user.name}</h1>
          <p className="vn-accent" style={{ fontSize: 19, fontStyle: 'italic', marginBottom: 24 }}>{portfolio.title}</p>
          {portfolio.bio && <p style={{ color: '#bfa9ae', fontSize: 16, lineHeight: 1.9, marginBottom: 38, fontFamily: "'Inter',sans-serif" }}>{portfolio.bio}</p>}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="vn-btn">Make an Introduction</a>}
            {hasResume && <a {...resumeLink} className="vn-btn-outline">View Résumé</a>}
          </div>
        </div>
      </section>

      {/* Experience — film credits style */}
      {experience.length > 0 && (
        <section className="vn-section" style={{ borderTop: '1px solid #2a1a1f' }}>
          <p className="vn-label" style={{ textAlign: 'center' }}>Featuring</p>
          <h2 className="vn-h2" style={{ textAlign: 'center', marginBottom: 56 }}>Career <span className="vn-accent">Credits</span></h2>
          {experience.map((exp, i) => (
            <div key={exp._id} style={{ textAlign: 'center', marginBottom: i < experience.length - 1 ? 44 : 0 }}>
              <h3 style={{ fontSize: 24, fontWeight: 400 }}>{exp.position}</h3>
              <p className="vn-accent" style={{ fontSize: 15, margin: '4px 0', fontStyle: 'italic' }}>{exp.company}</p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#8a7378', letterSpacing: 1 }}>{fmt(exp.startDate)} — {exp.current ? 'PRESENT' : fmt(exp.endDate)}</p>
              {exp.description && <p style={{ color: '#bfa9ae', fontSize: 15, lineHeight: 1.8, maxWidth: 600, margin: '14px auto 0' }}>{exp.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="vn-section" style={{ borderTop: '1px solid #2a1a1f' }}>
          <h2 className="vn-h2" style={{ textAlign: 'center', marginBottom: 56 }}>Cast of <span className="vn-accent">Skills</span></h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            {skills.map(s => (
              <div key={s._id} className="vn-card" style={{ padding: '14px 26px' }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>{s.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects — feature reel */}
      {projects.length > 0 && (
        <section id="work" className="vn-section" style={{ borderTop: '1px solid #2a1a1f' }}>
          <h2 className="vn-h2" style={{ textAlign: 'center', marginBottom: 56 }}>Feature <span className="vn-accent">Presentations</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 26 }}>
            {projects.map(p => (
              <div key={p._id} className="vn-card">
                {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: 180, objectFit: 'cover', filter: 'grayscale(20%) contrast(1.1)' }} />}
                <div style={{ padding: 22 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 8 }}>{p.name}</h3>
                  {p.description && <p style={{ color: '#bfa9ae', fontSize: 13, lineHeight: 1.7, marginBottom: 16, fontFamily: "'Inter',sans-serif" }}>{p.description}</p>}
                  <div style={{ display: 'flex', gap: 16, fontFamily: "'Inter',sans-serif" }}>
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="vn-accent" style={{ fontSize: 12, textDecoration: 'none', letterSpacing: 1 }}>SCREENING →</a>}
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#8a7378', textDecoration: 'none', letterSpacing: 1 }}>SOURCE</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education + Certificates */}
      {(education.length > 0 || certificates.length > 0) && (
        <section className="vn-section" style={{ borderTop: '1px solid #2a1a1f', display: 'grid', gridTemplateColumns: education.length && certificates.length ? '1fr 1fr' : '1fr', gap: 50 }}>
          {education.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <p className="vn-label">Education</p>
              {education.map(e => (
                <div key={e._id} style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 17 }}>{e.degree}</p>
                  <p className="vn-accent" style={{ fontSize: 13, fontStyle: 'italic' }}>{e.school}</p>
                </div>
              ))}
            </div>
          )}
          {certificates.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <p className="vn-label">Certifications</p>
              {certificates.map(c => (
                <div key={c._id} style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 17 }}>{c.name}</p>
                  <p className="vn-accent" style={{ fontSize: 13, fontStyle: 'italic' }}>{c.organization}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Closing credits / contact */}
      <section id="contact" className="vn-section" style={{ borderTop: '1px solid #2a1a1f', textAlign: 'center' }}>
        <p className="vn-label">The End — Or a New Beginning</p>
        <h2 className="vn-h2" style={{ marginBottom: 36 }}>Let's <span className="vn-accent">Talk</span></h2>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="vn-btn">Send a Message</a>}
          {hasResume && <a {...resumeLink} className="vn-btn-outline">Download Résumé</a>}
          {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="vn-btn-outline">LinkedIn</a>}
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: 28, borderTop: '1px solid #2a1a1f', fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#5c4a4f', letterSpacing: 1 }}>
        DIRECTED WITH PORTFOLIOFORGE
      </footer>
    </div>
  );
}
