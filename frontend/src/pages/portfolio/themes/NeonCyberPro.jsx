import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

// Lightweight canvas particle field — no external dependency, pure CSS+canvas.
function ParticleField({ accent }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(60, Math.floor(canvas.width / 20));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.5;
        ctx.fill();
      });
      // connecting lines for nearby particles
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = accent;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [accent]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

export default function NeonCyberPro({ data, accent = '#ff2bd6' }) {
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
    <div style={{ background: '#060109', color: '#f0e6fa', fontFamily: "'JetBrains Mono', 'Inter', monospace", minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .nc-accent { color: ${A}; }
        .nc-glow-text { text-shadow: 0 0 12px ${A}88, 0 0 30px ${A}44; }
        .nc-card { background: linear-gradient(135deg, rgba(255,43,214,0.05), rgba(0,212,255,0.03)); border: 1px solid ${A}33; border-radius: 4px; backdrop-filter: blur(6px); position: relative; transition: all 0.3s; clip-path: polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%); }
        .nc-card:hover { border-color: ${A}88; box-shadow: 0 0 30px ${A}22, inset 0 0 20px ${A}11; transform: translateY(-2px); }
        .nc-btn { background: ${A}; color: #060109; padding: 13px 30px; font-weight: 700; text-decoration: none; display: inline-block; clip-path: polygon(0 6px, 6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%); box-shadow: 0 0 25px ${A}66; font-size: 13px; letter-spacing: 0.5px; }
        .nc-btn-outline { background: rgba(0,0,0,0.3); border: 1px solid ${A}77; color: ${A}; padding: 12px 28px; text-decoration: none; display: inline-block; clip-path: polygon(0 6px, 6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%); font-size: 13px; transition: all 0.2s; }
        .nc-btn-outline:hover { background: ${A}15; box-shadow: 0 0 20px ${A}33; }
        .nc-section { padding: 80px 24px; max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
        .nc-h2 { font-size: clamp(26px,4vw,40px); font-weight: 800; text-align: center; margin-bottom: 50px; }
        .nc-tag { font-size: 10px; border: 1px solid ${A}55; padding: 2px 9px; border-radius: 3px; color: ${A}; }
        .nc-grid-bg { background-image: linear-gradient(${A}0a 1px, transparent 1px), linear-gradient(90deg, ${A}0a 1px, transparent 1px); background-size: 36px 36px; }
        @keyframes nc-pulse { 0%,100%{ opacity:0.5; } 50%{ opacity:1; } }
        .nc-pulse { animation: nc-pulse 2s infinite; }
        @keyframes nc-scan { 0%{ transform: translateY(-100%); } 100%{ transform: translateY(100%); } }
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(6,1,9,0.92)' : 'transparent', backdropFilter: 'blur(10px)', borderBottom: scrolled ? `1px solid ${A}33` : 'none', transition: 'all 0.3s' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>[<span className="nc-accent nc-glow-text">{portfolio.fullName || user.name}</span>]</span>
          <div style={{ display: 'flex', gap: 18 }}>
            {['profile', 'skills', 'projects', 'contact'].map(s => (
              <button key={s} onClick={() => scroll(s)} style={{ background: 'none', border: 'none', color: '#a08cb8', fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1.5 }}>{s}</button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero with particle canvas */}
      <section id="profile" className="nc-grid-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', position: 'relative' }}>
        <ParticleField accent={A} />
        <div style={{ textAlign: 'center', maxWidth: 720, position: 'relative', zIndex: 2 }}>
          {portfolio.profilePicture && (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
              <img src={portfolio.profilePicture} alt="" style={{ width: 124, height: 124, objectFit: 'cover', border: `2px solid ${A}`, clipPath: 'polygon(0 14px, 14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)' }} />
              <div className="nc-pulse" style={{ position: 'absolute', inset: -6, border: `1px solid ${A}66`, clipPath: 'polygon(0 18px, 18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)' }} />
            </div>
          )}
          <p className="nc-accent" style={{ fontSize: 12, letterSpacing: 3, marginBottom: 16 }}>&gt;&gt; {portfolio.tagline || 'SYSTEM_ONLINE'}.exe</p>
          <h1 className="nc-glow-text" style={{ fontSize: 'clamp(36px,7vw,66px)', fontWeight: 900, marginBottom: 14, lineHeight: 1.1, color: '#fff' }}>{portfolio.fullName || user.name}</h1>
          <p style={{ fontSize: 18, color: A, fontWeight: 700, marginBottom: 20 }}>{portfolio.title}</p>
          {portfolio.bio && <p style={{ color: '#b8a8cc', fontSize: 14, lineHeight: 1.8, marginBottom: 32, fontFamily: "'Inter',sans-serif" }}>{portfolio.bio}</p>}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="nc-btn">INITIATE_CONTACT</a>}
            {hasResume && <a {...resumeLink} className="nc-btn-outline">VIEW_RESUME.pdf</a>}
            {portfolio.socialLinks?.github && <a href={portfolio.socialLinks.github} target="_blank" rel="noopener noreferrer" className="nc-btn-outline">SOURCE_CODE</a>}
          </div>
        </div>
      </section>

      {/* Skills - holographic cards */}
      {skills.length > 0 && (
        <section id="skills" className="nc-section">
          <h2 className="nc-h2">SYSTEM <span className="nc-accent nc-glow-text">CAPABILITIES</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 22 }}>
            {Object.entries(skillGroups).map(([cat, items]) => (
              <div key={cat} className="nc-card" style={{ padding: 24 }}>
                <p className="nc-accent" style={{ fontSize: 11, letterSpacing: 2, marginBottom: 18 }}>// {cat.toUpperCase()}_MODULE</p>
                {items.map(s => (
                  <div key={s._id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>
                      <span style={{ color: '#e8dcf2' }}>{s.name}</span><span className="nc-accent">{s.level}%</span>
                    </div>
                    <div style={{ height: 3, background: '#1a0a22', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.level}%`, background: `linear-gradient(90deg, ${A}, #00d4ff)`, boxShadow: `0 0 8px ${A}` }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects - holographic cards */}
      {projects.length > 0 && (
        <section id="projects" className="nc-section">
          <h2 className="nc-h2">DEPLOYED <span className="nc-accent nc-glow-text">CONSTRUCTS</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 22 }}>
            {projects.map(p => (
              <div key={p._id} className="nc-card" style={{ overflow: 'hidden' }}>
                {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: 170, objectFit: 'cover', opacity: 0.85, filter: 'saturate(1.2)' }} />}
                <div style={{ padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Inter',sans-serif" }}>{p.name}</h3>
                    {p.featured && <span className="nc-tag">FEATURED</span>}
                  </div>
                  {p.description && <p style={{ color: '#b8a8cc', fontSize: 12.5, lineHeight: 1.7, marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>{p.description}</p>}
                  {p.technologies?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {p.technologies.map(t => <span key={t} className="nc-tag">{t}</span>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14 }}>
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="nc-accent" style={{ fontSize: 12, textDecoration: 'none' }}>SRC →</a>}
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#b8a8cc', textDecoration: 'none' }}>LIVE →</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="nc-section">
          <h2 className="nc-h2">EXECUTION <span className="nc-accent nc-glow-text">TIMELINE</span></h2>
          {experience.map(exp => (
            <div key={exp._id} className="nc-card" style={{ padding: 22, marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontFamily: "'Inter',sans-serif", fontSize: 15 }}>{exp.position}</h3>
                <p className="nc-accent" style={{ fontSize: 13 }}>{exp.company}</p>
                {exp.description && <p style={{ color: '#b8a8cc', fontSize: 12.5, marginTop: 8, maxWidth: 480, fontFamily: "'Inter',sans-serif" }}>{exp.description}</p>}
              </div>
              <span style={{ fontSize: 11, color: '#7a6a8c' }}>{fmt(exp.startDate)} → {exp.current ? 'NOW' : fmt(exp.endDate)}</span>
            </div>
          ))}
        </section>
      )}

      {(education.length > 0 || certificates.length > 0) && (
        <section className="nc-section" style={{ display: 'grid', gridTemplateColumns: education.length && certificates.length ? '1fr 1fr' : '1fr', gap: 30 }}>
          {education.length > 0 && (
            <div>
              <p className="nc-accent" style={{ fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>// EDUCATION_LOG</p>
              {education.map(e => <div key={e._id} className="nc-card" style={{ padding: 16, marginBottom: 10 }}><p style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>{e.degree}</p><p style={{ fontSize: 11, color: '#b8a8cc' }}>{e.school}</p></div>)}
            </div>
          )}
          {certificates.length > 0 && (
            <div>
              <p className="nc-accent" style={{ fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>// CERT_REGISTRY</p>
              {certificates.map(c => <div key={c._id} className="nc-card" style={{ padding: 16, marginBottom: 10 }}><p style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>{c.name}</p><p style={{ fontSize: 11, color: '#b8a8cc' }}>{c.organization}</p></div>)}
            </div>
          )}
        </section>
      )}

      <section id="contact" className="nc-section" style={{ textAlign: 'center' }}>
        <h2 className="nc-h2">ESTABLISH <span className="nc-accent nc-glow-text">UPLINK</span></h2>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="nc-btn">SEND_TRANSMISSION</a>}
          {hasResume && <a {...resumeLink} className="nc-btn-outline">DOWNLOAD_RESUME</a>}
          {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="nc-btn-outline">LINKEDIN</a>}
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: 24, borderTop: `1px solid ${A}22`, fontSize: 10, color: '#5a4a6c', letterSpacing: 1, position: 'relative', zIndex: 1 }}>
        [ EOF ] — <Link to="/builder" className="nc-accent" style={{ textDecoration: 'none' }}>PORTFOLIOFORGE_PRO</Link>
      </footer>
    </div>
  );
}
