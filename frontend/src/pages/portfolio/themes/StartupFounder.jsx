import React from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function StartupFounder({ data, accent = '#ff6b00' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;

  return (
    <div style={{ background:'#0a0a0a', color:'#ffffff', fontFamily:"'Inter',sans-serif", minHeight:'100vh' }}>
      <style>{`
        .sf-accent{ color:${A}; }
        .sf-card{ background:#141414; border:1px solid #262626; border-radius:18px; transition:all 0.25s; }
        .sf-card:hover{ border-color:${A}55; transform:translateY(-3px); }
        .sf-btn{ background:${A}; color:#0a0a0a; padding:15px 34px; border-radius:99px; font-weight:800; text-decoration:none; display:inline-block; font-size:15px; }
        .sf-btn-outline{ background:transparent; border:2px solid #333; color:#fff; padding:13px 32px; border-radius:99px; font-weight:700; text-decoration:none; display:inline-block; }
        .sf-btn-outline:hover{ border-color:${A}; }
        .sf-section{ padding:90px 24px; max-width:1100px; margin:0 auto; }
        .sf-badge{ background:${A}22; color:${A}; padding:6px 16px; border-radius:99px; font-size:13px; font-weight:700; display:inline-block; }
        @media(max-width:768px){ .sf-section{padding:56px 16px;} }
      `}</style>

      <nav style={{ padding:'22px 24px', display:'flex', justifyContent:'space-between', maxWidth:1100, margin:'0 auto' }}>
        <span style={{ fontWeight:900, fontSize:18 }}>{portfolio.fullName || user.name}<span className="sf-accent">.</span></span>
        <Link to="/builder" style={{ color:'#888', fontSize:13, textDecoration:'none' }}>Builder ↗</Link>
      </nav>

      {/* Hero */}
      <section className="sf-section" style={{ textAlign:'center', paddingTop:60 }}>
        <span className="sf-badge">🚀 {portfolio.tagline || 'Building the future'}</span>
        <h1 style={{ fontSize:'clamp(40px,8vw,80px)', fontWeight:900, margin:'28px 0 16px', lineHeight:1.05 }}>
          {portfolio.fullName || user.name}
        </h1>
        <p style={{ fontSize:'clamp(18px,3vw,24px)', color:A, fontWeight:700, marginBottom:20 }}>{portfolio.title}</p>
        {portfolio.bio && <p style={{ fontSize:17, color:'#a3a3a3', maxWidth:600, margin:'0 auto 40px', lineHeight:1.8 }}>{portfolio.bio}</p>}
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="sf-btn">Let's Build Together →</a>}
          {hasResume && <a {...resumeLink} className="sf-btn-outline">View Resume</a>}
        </div>
        {portfolio.profilePicture && (
          <img src={portfolio.profilePicture} alt="" style={{ width:140, height:140, borderRadius:24, objectFit:'cover', margin:'56px auto 0', display:'block', border:`3px solid ${A}` }} />
        )}
      </section>

      {/* Stats-style projects */}
      {projects.length > 0 && (
        <section className="sf-section">
          <div style={{ textAlign:'center', marginBottom:50 }}>
            <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:900 }}>Ventures & <span className="sf-accent">Builds</span></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(310px,1fr))', gap:24 }}>
            {projects.map(p => (
              <div key={p._id} className="sf-card" style={{ overflow:'hidden' }}>
                {p.image && <img src={p.image} alt={p.name} style={{ width:'100%', height:190, objectFit:'cover' }} />}
                <div style={{ padding:26 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <h3 style={{ fontWeight:800, fontSize:18 }}>{p.name}</h3>
                    {p.featured && <span className="sf-badge" style={{ fontSize:11, padding:'3px 10px' }}>HOT</span>}
                  </div>
                  {p.description && <p style={{ color:'#a3a3a3', fontSize:14, lineHeight:1.7, marginBottom:16 }}>{p.description}</p>}
                  <div style={{ display:'flex', gap:16 }}>
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="sf-accent" style={{ fontWeight:700, fontSize:13, textDecoration:'none' }}>Launch →</a>}
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" style={{ color:'#888', fontSize:13, textDecoration:'none' }}>Code →</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="sf-section">
          <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:900, textAlign:'center', marginBottom:50 }}>The <span className="sf-accent">Stack</span></h2>
          <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center' }}>
            {skills.map(s => (
              <div key={s._id} className="sf-card" style={{ padding:'16px 26px', textAlign:'center', minWidth:140 }}>
                <p style={{ fontWeight:800, fontSize:15 }}>{s.name}</p>
                <p className="sf-accent" style={{ fontSize:13, fontWeight:700, marginTop:4 }}>{s.level}%</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="sf-section">
          <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:900, textAlign:'center', marginBottom:50 }}>The <span className="sf-accent">Journey</span></h2>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {experience.map(exp => (
              <div key={exp._id} className="sf-card" style={{ padding:26, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <h3 style={{ fontWeight:800, fontSize:17 }}>{exp.position} <span style={{ color:'#666' }}>@</span> <span className="sf-accent">{exp.company}</span></h3>
                  {exp.description && <p style={{ color:'#a3a3a3', fontSize:14, marginTop:8, maxWidth:560 }}>{exp.description}</p>}
                </div>
                <span style={{ fontSize:13, color:'#666', whiteSpace:'nowrap' }}>{fmt(exp.startDate)} – {exp.current ? 'Now' : fmt(exp.endDate)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(education.length > 0 || certificates.length > 0) && (
        <section className="sf-section" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:30 }}>
          {education.length > 0 && <div>
            <h3 className="sf-accent" style={{ fontWeight:800, marginBottom:18, fontSize:14, textTransform:'uppercase', letterSpacing:1 }}>Education</h3>
            {education.map(e => <div key={e._id} className="sf-card" style={{ padding:18, marginBottom:12 }}><p style={{ fontWeight:700 }}>{e.degree}</p><p style={{ fontSize:13, color:'#888' }}>{e.school}</p></div>)}
          </div>}
          {certificates.length > 0 && <div>
            <h3 className="sf-accent" style={{ fontWeight:800, marginBottom:18, fontSize:14, textTransform:'uppercase', letterSpacing:1 }}>Certifications</h3>
            {certificates.map(c => <div key={c._id} className="sf-card" style={{ padding:18, marginBottom:12 }}><p style={{ fontWeight:700 }}>{c.name}</p><p style={{ fontSize:13, color:'#888' }}>{c.organization}</p></div>)}
          </div>}
        </section>
      )}

      <section className="sf-section" style={{ textAlign:'center' }}>
        <h2 style={{ fontSize:'clamp(32px,6vw,56px)', fontWeight:900, marginBottom:30 }}>Ready to <span className="sf-accent">scale together?</span></h2>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="sf-btn">Get in Touch</a>}
          {hasResume && <a {...resumeLink} className="sf-btn-outline">Download Resume</a>}
          {portfolio.socialLinks?.twitter && <a href={portfolio.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="sf-btn-outline">Follow on X</a>}
        </div>
      </section>

      <footer style={{ textAlign:'center', padding:24, borderTop:'1px solid #262626' }}>
        <p style={{ fontSize:12, color:'#525252' }}>Built with PortfolioForge</p>
      </footer>
    </div>
  );
}
