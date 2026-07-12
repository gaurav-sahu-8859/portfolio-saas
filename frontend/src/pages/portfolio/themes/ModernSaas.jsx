import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function ModernSaas({ data, accent = '#6366f1' }) {
  // const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const {
    portfolio = {},
    user = {},
    projects = [],
    skills = [],
    experience = [],
    education = [],
    certificates = []
  } = data || {};
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scroll = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false); };

  const navLinks = ['about', ...(skills.length ? ['skills'] : []), ...(projects.length ? ['projects'] : []),
    ...(experience.length ? ['experience'] : []), ...(education.length ? ['education'] : []), 'contact'];

  const skillGroups = skills.reduce((a, s) => { if (!a[s.category]) a[s.category] = []; a[s.category].push(s); return a; }, {});

  const A = accent;
  const s = (opacity = 1) => `rgba(${parseInt(A.slice(1, 3), 16)},${parseInt(A.slice(3, 5), 16)},${parseInt(A.slice(5, 7), 16)},${opacity})`;

  return (
    <div style={{ background: '#0a0a12', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .ms-accent { color: ${A}; }
        .ms-accent-bg { background: ${A}; }
        .ms-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; }
        .ms-card:hover { border-color: ${s(0.3)}; }
        .ms-btn { background: ${A}; color: #fff; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block; transition: opacity 0.2s; }
        .ms-btn:hover { opacity: 0.85; }
        .ms-btn-outline { background: transparent; color: ${A}; border: 1px solid ${s(0.4)}; padding: 11px 24px; border-radius: 10px; font-weight: 500; font-size: 14px; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .ms-btn-outline:hover { background: ${s(0.1)}; border-color: ${A}; }
        .ms-skill-bar { height: 5px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; }
        .ms-skill-fill { height: 100%; border-radius: 99px; transition: width 1s ease; }
        .ms-tag { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 3px 8px; font-size: 11px; color: #94a3b8; font-family: monospace; }
        .ms-nav-link { background: none; border: none; color: #94a3b8; font-size: 13px; font-weight: 500; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: all 0.2s; }
        .ms-nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .ms-section { padding: 80px 24px; border-top: 1px solid rgba(255,255,255,0.06); }
        .ms-h2 { font-size: clamp(26px, 4vw, 36px); font-weight: 800; color: #fff; text-align: center; margin-bottom: 12px; }
        .ms-sub { text-align: center; color: #64748b; font-size: 15px; margin-bottom: 52px; }
        @media(max-width:768px){ .ms-section{padding:60px 16px;} }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,10,18,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'all 0.3s'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>{portfolio.fullName || user.name}</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="nav-desktop">
            {navLinks.map(l => <button key={l} className="ms-nav-link" onClick={() => scroll(l)} style={{ textTransform: 'capitalize' }}>{l}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {hasResume && <a {...resumeLink} className="ms-btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>Resume ↓</a>}
            <button onClick={() => setMobileMenu(!mobileMenu)} style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }} className="mob-menu-btn">☰</button>
          </div>
        </div>
        {mobileMenu && (
          <div style={{ background: 'rgba(10,10,18,0.98)', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {navLinks.map(l => <button key={l} className="ms-nav-link" onClick={() => scroll(l)} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 4, textTransform: 'capitalize' }}>{l}</button>)}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="about" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: s(0.06), filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: s(0.04), filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {portfolio.profilePicture && (
            <img src={portfolio.profilePicture} alt={portfolio.fullName} style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 24px', display: 'block', border: `3px solid ${s(0.4)}`, boxShadow: `0 0 40px ${s(0.2)}` }} />
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: s(0.1), border: `1px solid ${s(0.3)}`, borderRadius: 99, padding: '6px 16px', marginBottom: 20, fontSize: 13, color: A }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: A, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            {portfolio.tagline || 'Available for opportunities'}
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 7vw, 68px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: '-2px' }}>
            {portfolio.fullName || user.name}
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', color: A, fontWeight: 600, marginBottom: 16 }}>{portfolio.title}</p>
          {portfolio.bio && <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.8, maxWidth: 560, margin: '0 auto 36px' }}>{portfolio.bio}</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="ms-btn">Get in Touch</a>}
            {hasResume && <a {...resumeLink} className="ms-btn-outline">View Resume</a>}
            {portfolio.socialLinks?.github && <a href={portfolio.socialLinks.github} target="_blank" rel="noopener noreferrer" className="ms-btn-outline">GitHub</a>}
            {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="ms-btn-outline">LinkedIn</a>}
          </div>
        </div>
      </section>

      {/* Skills */}
      {skills.length > 0 && (
        <section id="skills" className="ms-section">
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 className="ms-h2">Skills & <span className="ms-accent">Expertise</span></h2>
            <p className="ms-sub">Technologies and tools I work with</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {Object.entries(skillGroups).map(([cat, items]) => (
                <div key={cat} className="ms-card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <span style={{ background: s(0.15), color: A, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{cat}</span>
                  </div>
                  {items.map(sk => (
                    <div key={sk._id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{sk.name}</span>
                        <span style={{ color: '#64748b' }}>{sk.level}%</span>
                      </div>
                      <div className="ms-skill-bar"><div className="ms-skill-fill" style={{ width: `${sk.level}%`, background: `linear-gradient(90deg, ${A}, ${s(0.7)})` }} /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section id="projects" className="ms-section">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 className="ms-h2">Featured <span className="ms-accent">Projects</span></h2>
            <p className="ms-sub">Things I've built and shipped</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {projects.map(p => (
                <div key={p._id} className="ms-card" style={{ overflow: 'hidden', transition: 'all 0.3s' }}>
                  {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} />}
                  <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>{p.name}</h3>
                      {p.featured && <span style={{ fontSize: 11, color: A, fontWeight: 700, background: s(0.12), padding: '2px 8px', borderRadius: 99 }}>⭐ Featured</span>}
                    </div>
                    {p.description && <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>{p.description}</p>}
                    {p.technologies?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {p.technologies.map(t => <span key={t} className="ms-tag">{t}</span>)}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 16 }}>
                      {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: A, textDecoration: 'none', fontWeight: 500 }}>GitHub →</a>}
                      {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Live Demo →</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section id="experience" className="ms-section">
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 className="ms-h2">Work <span className="ms-accent">Experience</span></h2>
            <p className="ms-sub">My professional journey</p>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.07)' }} />
              {experience.map((exp, i) => (
                <div key={exp._id} style={{ paddingLeft: 60, marginBottom: 28, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: 6, width: 18, height: 18, borderRadius: '50%', background: A, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0a0a12' }} />
                  </div>
                  <div className="ms-card" style={{ padding: 24, transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{exp.position}</h3>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{fmt(exp.startDate)} – {exp.current ? 'Present' : fmt(exp.endDate)}</span>
                    </div>
                    <p style={{ color: A, fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                    {exp.description && <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section id="education" className="ms-section">
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 className="ms-h2"><span className="ms-accent">Education</span></h2>
            <p className="ms-sub">Academic background and qualifications</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {education.map(edu => (
                <div key={edu._id} className="ms-card" style={{ padding: 24, display: 'flex', gap: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: s(0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: A, fontWeight: 800, fontSize: 20 }}>{edu.school.charAt(0)}</div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</h3>
                    <p style={{ color: A, fontSize: 14, fontWeight: 500 }}>{edu.school}</p>
                    <p style={{ color: '#64748b', fontSize: 12 }}>{edu.startYear} – {edu.current ? 'Present' : edu.endYear}{edu.grade ? ` · ${edu.grade}` : ''}</p>
                    {edu.description && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>{edu.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <section id="certificates" className="ms-section">
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 className="ms-h2"><span className="ms-accent">Certifications</span></h2>
            <p className="ms-sub">Professional certifications and achievements</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {certificates.map(cert => (
                <div key={cert._id} className="ms-card" style={{ padding: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: s(0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <span style={{ color: A, fontSize: 18 }}>🏆</span>
                  </div>
                  <h3 style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 4 }}>{cert.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: 12 }}>{cert.organization}</p>
                  <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{fmt(cert.issueDate)}</p>
                  {cert.credentialUrl && <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" style={{ color: A, fontSize: 12, marginTop: 8, display: 'inline-block', textDecoration: 'none' }}>Verify ↗</a>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="ms-section">
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="ms-h2">Let's <span className="ms-accent">Connect</span></h2>
          <p style={{ color: '#64748b', marginBottom: 36, lineHeight: 1.7 }}>
            {portfolio.contact?.location ? `Based in ${portfolio.contact.location}. ` : ''}Open to new opportunities and collaborations.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="ms-btn">Email Me</a>}
            {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="ms-btn-outline">LinkedIn</a>}
            {portfolio.socialLinks?.twitter && <a href={portfolio.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="ms-btn-outline">Twitter</a>}
            {portfolio.resumeUrl && <a {...resumeLink} className="ms-btn-outline">Download Resume</a>}
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#334155' }}>Built with <Link to="/builder" style={{ color: A, textDecoration: 'none' }}>PortfolioForge</Link></p>
      </footer>
    </div>
  );
}
