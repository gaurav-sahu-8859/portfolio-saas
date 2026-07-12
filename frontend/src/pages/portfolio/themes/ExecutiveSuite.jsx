import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function ExecutiveSuite({ data, accent = '#c9a227' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scroll = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const skillGroups = skills.reduce((a, s) => { if (!a[s.category]) a[s.category] = []; a[s.category].push(s); return a; }, {});
  const navLinks = ['profile', ...(experience.length ? ['experience'] : []), ...(skills.length ? ['expertise'] : []),
    ...(projects.length ? ['portfolio'] : []), ...(education.length || certificates.length ? ['credentials'] : []), 'contact'];

  return (
    <div style={{ background: '#0a0e1a', color: '#e8e6df', fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: '100vh' }}>
      <style>{`
        .es-accent { color: ${A}; }
        .es-gold-line { background: linear-gradient(90deg, transparent, ${A}, transparent); height: 1px; }
        .es-card { background: #0d1326; border: 1px solid rgba(201,162,39,0.18); transition: all 0.3s; }
        .es-card:hover { border-color: ${A}55; box-shadow: 0 8px 30px rgba(201,162,39,0.08); }
        .es-btn { background: ${A}; color: #0a0e1a; padding: 14px 38px; font-weight: 600; text-decoration: none; display: inline-block; letter-spacing: 1.5px; font-size: 12px; text-transform: uppercase; font-family: 'Inter', sans-serif; transition: all 0.25s; }
        .es-btn:hover { background: #ddc04a; transform: translateY(-1px); }
        .es-btn-outline { background: transparent; border: 1px solid rgba(201,162,39,0.5); color: ${A}; padding: 13px 36px; text-decoration: none; display: inline-block; letter-spacing: 1.5px; font-size: 12px; text-transform: uppercase; font-family: 'Inter', sans-serif; transition: all 0.25s; }
        .es-btn-outline:hover { border-color: ${A}; background: rgba(201,162,39,0.06); }
        .es-section { padding: 100px 32px; max-width: 1080px; margin: 0 auto; }
        .es-label { font-family: 'Inter', sans-serif; letter-spacing: 3px; text-transform: uppercase; font-size: 11px; color: ${A}aa; margin-bottom: 18px; font-weight: 600; }
        .es-h2 { font-size: clamp(30px, 4.5vw, 46px); font-weight: 400; letter-spacing: 0.5px; margin-bottom: 8px; }
        .es-nav-link { background: none; border: none; color: #9a958a; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; padding: 8px 14px; font-family: 'Inter', sans-serif; transition: color 0.2s; }
        .es-nav-link:hover { color: ${A}; }
        @media (max-width: 768px) { .es-section { padding: 60px 20px; } }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(10,14,26,0.96)' : 'transparent', backdropFilter: scrolled ? 'blur(14px)' : 'none', borderBottom: scrolled ? '1px solid rgba(201,162,39,0.15)' : 'none', transition: 'all 0.3s' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>{(portfolio.fullName || user.name).toUpperCase()}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {navLinks.map(l => <button key={l} className="es-nav-link" onClick={() => scroll(l)}>{l}</button>)}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="profile" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 32px 60px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '100%', background: `linear-gradient(135deg, transparent, ${A}06)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: portfolio.profilePicture ? '1fr 280px' : '1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <p className="es-label">{portfolio.tagline || 'Executive Profile'}</p>
            <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 400, lineHeight: 1.1, marginBottom: 20, color: '#f5f2e8' }}>{portfolio.fullName || user.name}</h1>
            <div className="es-gold-line" style={{ width: 80, marginBottom: 20 }} />
            <p className="es-accent" style={{ fontSize: 20, fontStyle: 'italic', marginBottom: 24, fontWeight: 300 }}>{portfolio.title}</p>
            {portfolio.bio && <p style={{ color: '#b5b0a4', fontSize: 16, lineHeight: 1.9, marginBottom: 36, maxWidth: 540 }}>{portfolio.bio}</p>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="es-btn">Request Introduction</a>}
              {hasResume && <a {...resumeLink} className="es-btn-outline">Curriculum Vitae</a>}
            </div>
          </div>
          {portfolio.profilePicture && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: -10, left: -10, right: 10, bottom: 10, border: `1px solid ${A}55` }} />
              <img src={portfolio.profilePicture} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', position: 'relative', filter: 'grayscale(8%) contrast(1.05)' }} />
            </div>
          )}
        </div>
      </section>

      {/* Experience */}
      {experience.length > 0 && (
        <section id="experience" className="es-section" style={{ borderTop: '1px solid rgba(201,162,39,0.12)' }}>
          <p className="es-label" style={{ textAlign: 'center' }}>Career History</p>
          <h2 className="es-h2" style={{ textAlign: 'center', marginBottom: 60 }}>Professional <span className="es-accent">Experience</span></h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {experience.map((exp, i) => (
              <div key={exp._id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, padding: '32px 0', borderBottom: i < experience.length - 1 ? '1px solid rgba(201,162,39,0.1)' : 'none' }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, letterSpacing: 1, color: '#9a958a', textTransform: 'uppercase' }}>{fmt(exp.startDate)} — {exp.current ? 'Present' : fmt(exp.endDate)}</p>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 400, marginBottom: 4 }}>{exp.position}</h3>
                  <p className="es-accent" style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 12 }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</p>
                  {exp.description && <p style={{ color: '#b5b0a4', fontSize: 15, lineHeight: 1.8 }}>{exp.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expertise / Skills */}
      {skills.length > 0 && (
        <section id="expertise" className="es-section" style={{ borderTop: '1px solid rgba(201,162,39,0.12)' }}>
          <p className="es-label" style={{ textAlign: 'center' }}>Core Competencies</p>
          <h2 className="es-h2" style={{ textAlign: 'center', marginBottom: 60 }}>Areas of <span className="es-accent">Expertise</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 32 }}>
            {Object.entries(skillGroups).map(([cat, items]) => (
              <div key={cat}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9a958a', marginBottom: 16 }}>{cat}</p>
                {items.map(s => (
                  <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,162,39,0.08)' }}>
                    <span style={{ fontSize: 15 }}>{s.name}</span>
                    <span className="es-accent" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>{s.level}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio / Projects */}
      {projects.length > 0 && (
        <section id="portfolio" className="es-section" style={{ borderTop: '1px solid rgba(201,162,39,0.12)' }}>
          <p className="es-label" style={{ textAlign: 'center' }}>Selected Engagements</p>
          <h2 className="es-h2" style={{ textAlign: 'center', marginBottom: 60 }}>Featured <span className="es-accent">Work</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 30 }}>
            {projects.map(p => (
              <div key={p._id} className="es-card">
                {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: 200, objectFit: 'cover', filter: 'grayscale(15%)' }} />}
                <div style={{ padding: 28 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 400, marginBottom: 10 }}>{p.name}</h3>
                  {p.description && <p style={{ color: '#b5b0a4', fontSize: 14, lineHeight: 1.7, marginBottom: 18, fontFamily: "'Inter',sans-serif" }}>{p.description}</p>}
                  <div style={{ display: 'flex', gap: 18, fontFamily: "'Inter',sans-serif" }}>
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="es-accent" style={{ fontSize: 12, textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>View Case</a>}
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" style={{ color: '#9a958a', fontSize: 12, textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>Repository</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Credentials */}
      {(education.length > 0 || certificates.length > 0) && (
        <section id="credentials" className="es-section" style={{ borderTop: '1px solid rgba(201,162,39,0.12)', display: 'grid', gridTemplateColumns: education.length && certificates.length ? '1fr 1fr' : '1fr', gap: 50 }}>
          {education.length > 0 && (
            <div>
              <p className="es-label">Education</p>
              {education.map(e => (
                <div key={e._id} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 400 }}>{e.degree}{e.field ? `, ${e.field}` : ''}</h3>
                  <p className="es-accent" style={{ fontSize: 14, fontStyle: 'italic' }}>{e.school}</p>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9a958a', marginTop: 4 }}>{e.startYear}–{e.current ? 'Present' : e.endYear}{e.grade ? ` · ${e.grade}` : ''}</p>
                </div>
              ))}
            </div>
          )}
          {certificates.length > 0 && (
            <div>
              <p className="es-label">Certifications</p>
              {certificates.map(c => (
                <div key={c._id} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 400 }}>{c.name}</h3>
                  <p className="es-accent" style={{ fontSize: 14, fontStyle: 'italic' }}>{c.organization}</p>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9a958a', marginTop: 4 }}>{fmt(c.issueDate)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="es-section" style={{ borderTop: '1px solid rgba(201,162,39,0.12)', textAlign: 'center' }}>
        <p className="es-label">Get In Touch</p>
        <h2 className="es-h2" style={{ marginBottom: 36 }}>Let Us <span className="es-accent">Connect</span></h2>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="es-btn">Schedule a Conversation</a>}
          {hasResume && <a {...resumeLink} className="es-btn-outline">Curriculum Vitae</a>}
          {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="es-btn-outline">LinkedIn Profile</a>}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(201,162,39,0.12)', padding: '28px', textAlign: 'center', fontFamily: "'Inter',sans-serif" }}>
        <p style={{ fontSize: 11, color: '#5a5648', letterSpacing: 1 }}>EXECUTIVE SUITE · BUILT WITH <Link to="/builder" className="es-accent" style={{ textDecoration: 'none' }}>PORTFOLIOFORGE</Link></p>
      </footer>
    </div>
  );
}
