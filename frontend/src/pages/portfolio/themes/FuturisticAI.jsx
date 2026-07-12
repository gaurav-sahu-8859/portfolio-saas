import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function FuturisticAI({ data, accent = '#00d4ff' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  const scroll = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
  const skillGroups = skills.reduce((a,s) => { if(!a[s.category]) a[s.category]=[]; a[s.category].push(s); return a; }, {});

  return (
    <div style={{ background:'#050510', color:'#e0e0ff', fontFamily:"'Inter',sans-serif", minHeight:'100vh' }}>
      <style>{`
        .fa-accent{ color:${A}; }
        .fa-glow{ box-shadow:0 0 20px ${A}44, inset 0 0 20px ${A}11; }
        .fa-card{ background:linear-gradient(135deg, rgba(0,212,255,0.04), rgba(168,85,247,0.04)); border:1px solid ${A}33; border-radius:14px; backdrop-filter:blur(8px); transition:all 0.3s; }
        .fa-card:hover{ border-color:${A}77; box-shadow:0 0 24px ${A}22; }
        .fa-btn{ background:linear-gradient(135deg, ${A}, #a855f7); color:#000; padding:13px 30px; border-radius:8px; font-weight:700; text-decoration:none; display:inline-block; box-shadow:0 0 20px ${A}55; }
        .fa-btn-outline{ background:transparent; border:1px solid ${A}66; color:${A}; padding:12px 28px; border-radius:8px; font-weight:600; text-decoration:none; display:inline-block; transition:all 0.2s; }
        .fa-btn-outline:hover{ background:${A}11; border-color:${A}; }
        .fa-section{ padding:80px 24px; max-width:1100px; margin:0 auto; }
        .fa-h2{ font-size:clamp(28px,4vw,40px); font-weight:800; text-align:center; margin-bottom:50px; }
        .fa-grid-bg{ background-image:linear-gradient(${A}08 1px, transparent 1px), linear-gradient(90deg, ${A}08 1px, transparent 1px); background-size:40px 40px; }
        @keyframes pulse-glow{ 0%,100%{ opacity:0.6; } 50%{ opacity:1; } }
        .fa-pulse{ animation:pulse-glow 2.5s infinite; }
      `}</style>

      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background: scrolled ? 'rgba(5,5,16,0.9)' : 'transparent', backdropFilter:'blur(12px)', borderBottom: scrolled ? `1px solid ${A}22` : 'none', transition:'all 0.3s' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:800, fontSize:16 }}>{'<'}<span className="fa-accent">{portfolio.fullName || user.name}</span>{' />'}</span>
          <div style={{ display:'flex', gap:18 }}>
            {['about','skills','projects','contact'].map(s => <button key={s} onClick={() => scroll(s)} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:13, cursor:'pointer', textTransform:'uppercase', letterSpacing:1 }}>{s}</button>)}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="about" className="fa-grid-bg" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'100px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', width:600, height:600, borderRadius:'50%', background:`radial-gradient(circle, ${A}15, transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ textAlign:'center', maxWidth:720, position:'relative', zIndex:1 }}>
          {portfolio.profilePicture && (
            <div style={{ position:'relative', display:'inline-block', marginBottom:28 }}>
              <img src={portfolio.profilePicture} alt="" style={{ width:120, height:120, borderRadius:'50%', objectFit:'cover', border:`2px solid ${A}` }} className="fa-glow" />
              <div className="fa-pulse" style={{ position:'absolute', top:-4, left:-4, right:-4, bottom:-4, borderRadius:'50%', border:`1px solid ${A}55` }} />
            </div>
          )}
          <p className="fa-accent" style={{ fontFamily:'monospace', fontSize:13, marginBottom:14, letterSpacing:2 }}>[ SYSTEM ONLINE ]</p>
          <h1 style={{ fontSize:'clamp(36px,7vw,64px)', fontWeight:900, marginBottom:14, lineHeight:1.1 }}>{portfolio.fullName || user.name}</h1>
          <p style={{ fontSize:19, color:A, fontWeight:600, marginBottom:18 }}>{portfolio.title}</p>
          {portfolio.bio && <p style={{ color:'#94a3b8', fontSize:15, lineHeight:1.8, marginBottom:32 }}>{portfolio.bio}</p>}
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="fa-btn">Initialize Contact</a>}
            {hasResume && <a {...resumeLink} className="fa-btn-outline">View Resume</a>}
            {portfolio.socialLinks?.github && <a href={portfolio.socialLinks.github} target="_blank" rel="noopener noreferrer" className="fa-btn-outline">GitHub</a>}
          </div>
        </div>
      </section>

      {skills.length > 0 && (
        <section id="skills" className="fa-section">
          <h2 className="fa-h2">NEURAL <span className="fa-accent">CAPABILITIES</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:20 }}>
            {Object.entries(skillGroups).map(([cat, items]) => (
              <div key={cat} className="fa-card" style={{ padding:22 }}>
                <p className="fa-accent" style={{ fontFamily:'monospace', fontSize:12, marginBottom:16, letterSpacing:1 }}>// {cat.toUpperCase()}</p>
                {items.map(s => (
                  <div key={s._id} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}><span>{s.name}</span><span className="fa-accent">{s.level}%</span></div>
                    <div style={{ height:4, background:'#1a1a2e', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${s.level}%`, background:`linear-gradient(90deg, ${A}, #a855f7)`, transition:'width 1s' }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section id="projects" className="fa-section">
          <h2 className="fa-h2">DEPLOYED <span className="fa-accent">SYSTEMS</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px,1fr))', gap:22 }}>
            {projects.map(p => (
              <div key={p._id} className="fa-card" style={{ overflow:'hidden' }}>
                {p.image && <img src={p.image} alt={p.name} style={{ width:'100%', height:180, objectFit:'cover', opacity:0.9 }} />}
                <div style={{ padding:22 }}>
                  <h3 style={{ fontWeight:700, marginBottom:8 }}>{p.name}</h3>
                  {p.description && <p style={{ color:'#94a3b8', fontSize:13, lineHeight:1.6, marginBottom:14 }}>{p.description}</p>}
                  {p.technologies?.length > 0 && <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                    {p.technologies.map(t => <span key={t} style={{ fontSize:10, fontFamily:'monospace', color:A, border:`1px solid ${A}44`, padding:'2px 8px', borderRadius:4 }}>{t}</span>)}
                  </div>}
                  <div style={{ display:'flex', gap:14 }}>
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="fa-accent" style={{ fontSize:12, textDecoration:'none' }}>SOURCE →</a>}
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:'#94a3b8', textDecoration:'none' }}>LIVE →</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="fa-section">
          <h2 className="fa-h2">EXECUTION <span className="fa-accent">LOG</span></h2>
          {experience.map(exp => (
            <div key={exp._id} className="fa-card" style={{ padding:22, marginBottom:16, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div>
                <h3 style={{ fontWeight:700 }}>{exp.position}</h3>
                <p className="fa-accent" style={{ fontSize:14 }}>{exp.company}</p>
                {exp.description && <p style={{ color:'#94a3b8', fontSize:13, marginTop:8, maxWidth:500 }}>{exp.description}</p>}
              </div>
              <span style={{ fontFamily:'monospace', fontSize:12, color:'#64748b' }}>{fmt(exp.startDate)} → {exp.current ? 'NOW' : fmt(exp.endDate)}</span>
            </div>
          ))}
        </section>
      )}

      {(education.length > 0 || certificates.length > 0) && (
        <section className="fa-section" style={{ display:'grid', gridTemplateColumns: education.length && certificates.length ? '1fr 1fr' : '1fr', gap:30 }}>
          {education.length > 0 && (
            <div>
              <p className="fa-accent" style={{ fontFamily:'monospace', marginBottom:16 }}>// EDUCATION</p>
              {education.map(e => (
                <div key={e._id} className="fa-card" style={{ padding:16, marginBottom:10 }}>
                  <p style={{ fontWeight:700, fontSize:14 }}>{e.degree}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{e.school} · {e.startYear}-{e.current?'now':e.endYear}</p>
                </div>
              ))}
            </div>
          )}
          {certificates.length > 0 && (
            <div>
              <p className="fa-accent" style={{ fontFamily:'monospace', marginBottom:16 }}>// CERTIFICATIONS</p>
              {certificates.map(c => (
                <div key={c._id} className="fa-card" style={{ padding:16, marginBottom:10 }}>
                  <p style={{ fontWeight:700, fontSize:14 }}>{c.name}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{c.organization} · {fmt(c.issueDate)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section id="contact" className="fa-section" style={{ textAlign:'center' }}>
        <h2 className="fa-h2">ESTABLISH <span className="fa-accent">CONNECTION</span></h2>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="fa-btn">Send Transmission</a>}
          {hasResume && <a {...resumeLink} className="fa-btn-outline">Download Resume</a>}
          {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="fa-btn-outline">LinkedIn</a>}
        </div>
      </section>

      <footer style={{ textAlign:'center', padding:24, borderTop:`1px solid ${A}22`, fontFamily:'monospace', fontSize:11, color:'#475569' }}>
        [ END OF TRANSMISSION ] — <Link to="/builder" className="fa-accent" style={{ textDecoration:'none' }}>PortfolioForge</Link>
      </footer>
    </div>
  );
}
