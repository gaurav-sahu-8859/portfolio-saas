import React from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function PremiumDark({ data, accent = '#d4af37' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;

  return (
    <div style={{ background:'#0a0800', color:'#f5f0e8', fontFamily:"'Georgia',serif", minHeight:'100vh' }}>
      <style>{`
        .pd-accent{ color:${A}; }
        .pd-line{ border-top:1px solid ${A}22; }
        .pd-card{ background:#111008; border:1px solid ${A}22; transition:all 0.3s; }
        .pd-card:hover{ border-color:${A}66; }
        .pd-btn{ background:${A}; color:#0a0800; padding:14px 36px; font-weight:700; text-decoration:none; display:inline-block; letter-spacing:1px; }
        .pd-btn-outline{ background:transparent; border:1px solid ${A}55; color:${A}; padding:13px 34px; text-decoration:none; display:inline-block; letter-spacing:1px; }
        .pd-btn-outline:hover{ border-color:${A}; background:${A}0a; }
        .pd-section{ padding:90px 24px; max-width:980px; margin:0 auto; }
        .pd-label{ font-family:'Inter',sans-serif; letter-spacing:3px; text-transform:uppercase; font-size:11px; color:${A}99; text-align:center; margin-bottom:16px; }
        .pd-h2{ font-size:clamp(28px,4vw,42px); text-align:center; margin-bottom:50px; font-weight:400; letter-spacing:1px; }
      `}</style>

      <nav style={{ padding:'28px 24px', display:'flex', justifyContent:'space-between', maxWidth:980, margin:'0 auto', fontFamily:"'Inter',sans-serif" }}>
        <span style={{ fontWeight:600, letterSpacing:1, fontSize:14 }}>{(portfolio.fullName || user.name).toUpperCase()}</span>
        <Link to="/builder" style={{ color:`${A}99`, fontSize:12, textDecoration:'none', letterSpacing:1 }}>BUILDER</Link>
      </nav>

      {/* Hero */}
      <section className="pd-section" style={{ textAlign:'center', paddingTop:60 }}>
        {portfolio.profilePicture && (
          <img src={portfolio.profilePicture} alt="" style={{ width:110, height:110, borderRadius:'50%', objectFit:'cover', margin:'0 auto 32px', display:'block', border:`1px solid ${A}66` }} />
        )}
        <p className="pd-label">{portfolio.tagline || 'Portfolio'}</p>
        <h1 style={{ fontSize:'clamp(36px,7vw,64px)', fontWeight:400, letterSpacing:2, marginBottom:18 }}>{portfolio.fullName || user.name}</h1>
        <div style={{ width:60, height:1, background:A, margin:'0 auto 22px' }} />
        <p className="pd-accent" style={{ fontSize:18, fontStyle:'italic', marginBottom:24 }}>{portfolio.title}</p>
        {portfolio.bio && <p style={{ color:'#c9bfa8', fontSize:16, lineHeight:1.9, maxWidth:580, margin:'0 auto 40px' }}>{portfolio.bio}</p>}
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', fontFamily:"'Inter',sans-serif" }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="pd-btn">CONTACT</a>}
          {hasResume && <a {...resumeLink} className="pd-btn-outline">RÉSUMÉ</a>}
        </div>
      </section>

      {experience.length > 0 && (
        <section className="pd-section pd-line">
          <p className="pd-label">Professional Journey</p>
          <h2 className="pd-h2">Experience</h2>
          {experience.map((exp,i) => (
            <div key={exp._id} style={{ marginBottom: i < experience.length-1 ? 40 : 0, textAlign:'center' }}>
              <h3 style={{ fontSize:22, fontWeight:400 }}>{exp.position}</h3>
              <p className="pd-accent" style={{ fontSize:15, fontStyle:'italic', margin:'4px 0' }}>{exp.company}</p>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#8a7d5e', letterSpacing:1 }}>{fmt(exp.startDate)} – {exp.current ? 'PRESENT' : fmt(exp.endDate)}</p>
              {exp.description && <p style={{ color:'#c9bfa8', fontSize:15, lineHeight:1.8, maxWidth:600, margin:'14px auto 0' }}>{exp.description}</p>}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section className="pd-section pd-line">
          <h2 className="pd-h2">Areas of <span className="pd-accent">Mastery</span></h2>
          <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center' }}>
            {skills.map(s => (
              <div key={s._id} className="pd-card" style={{ padding:'14px 26px' }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:14 }}>{s.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="pd-section pd-line">
          <h2 className="pd-h2">Selected <span className="pd-accent">Works</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {projects.map(p => (
              <div key={p._id} className="pd-card">
                {p.image && <img src={p.image} alt={p.name} style={{ width:'100%', height:170, objectFit:'cover', filter:'sepia(10%)' }} />}
                <div style={{ padding:22 }}>
                  <h3 style={{ fontWeight:400, fontSize:18, marginBottom:8 }}>{p.name}</h3>
                  {p.description && <p style={{ color:'#c9bfa8', fontSize:13, lineHeight:1.7, marginBottom:14, fontFamily:"'Inter',sans-serif" }}>{p.description}</p>}
                  <div style={{ display:'flex', gap:16, fontFamily:"'Inter',sans-serif" }}>
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="pd-accent" style={{ fontSize:12, textDecoration:'none', letterSpacing:1 }}>VIEW</a>}
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:'#8a7d5e', textDecoration:'none', letterSpacing:1 }}>SOURCE</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(education.length > 0 || certificates.length > 0) && (
        <section className="pd-section pd-line" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:40 }}>
          {education.length > 0 && <div style={{ textAlign:'center' }}>
            <p className="pd-label">Education</p>
            {education.map(e => <div key={e._id} style={{ marginBottom:20 }}><p style={{ fontWeight:400, fontSize:17 }}>{e.degree}</p><p className="pd-accent" style={{ fontSize:13, fontStyle:'italic' }}>{e.school}</p></div>)}
          </div>}
          {certificates.length > 0 && <div style={{ textAlign:'center' }}>
            <p className="pd-label">Certifications</p>
            {certificates.map(c => <div key={c._id} style={{ marginBottom:20 }}><p style={{ fontWeight:400, fontSize:17 }}>{c.name}</p><p className="pd-accent" style={{ fontSize:13, fontStyle:'italic' }}>{c.organization}</p></div>)}
          </div>}
        </section>
      )}

      <section className="pd-section pd-line" style={{ textAlign:'center' }}>
        <h2 className="pd-h2">Get in <span className="pd-accent">Touch</span></h2>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', fontFamily:"'Inter',sans-serif" }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="pd-btn">SEND MESSAGE</a>}
          {hasResume && <a {...resumeLink} className="pd-btn-outline">RÉSUMÉ</a>}
          {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="pd-btn-outline">LINKEDIN</a>}
        </div>
      </section>

      <footer style={{ textAlign:'center', padding:24, fontFamily:"'Inter',sans-serif", fontSize:11, color:'#5c5340', letterSpacing:1 }}>BUILT WITH PORTFOLIOFORGE</footer>
    </div>
  );
}
