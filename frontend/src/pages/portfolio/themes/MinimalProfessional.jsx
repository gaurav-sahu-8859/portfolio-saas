import React from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function MinimalProfessional({ data, accent = '#1a1a2e' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;

  return (
    <div style={{ background:'#ffffff', color:'#222', fontFamily:"'Georgia', serif", minHeight:'100vh' }}>
      <style>{`
        .mp-accent{ color:${A}; }
        .mp-line{ border-top:1px solid #e5e5e5; }
        .mp-link{ color:${A}; text-decoration:none; border-bottom:1px solid ${A}33; padding-bottom:1px; }
        .mp-link:hover{ border-bottom-color:${A}; }
        .mp-section{ padding:64px 32px; max-width:760px; margin:0 auto; }
        .mp-label{ font-family:'Inter',sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#999; margin-bottom:24px; }
        @media(max-width:640px){ .mp-section{ padding:40px 20px; } }
      `}</style>

      <nav style={{ padding:'28px 32px', display:'flex', justifyContent:'space-between', maxWidth:760, margin:'0 auto', fontFamily:"'Inter',sans-serif" }}>
        <span style={{ fontWeight:600, fontSize:15 }}>{portfolio.fullName || user.name}</span>
        <Link to="/builder" style={{ fontSize:12, color:'#999', textDecoration:'none' }}>Builder</Link>
      </nav>

      {/* Hero */}
      <section className="mp-section" style={{ paddingTop:60, paddingBottom:60, textAlign:'center' }}>
        {portfolio.profilePicture && (
          <img src={portfolio.profilePicture} alt="" style={{ width:88, height:88, borderRadius:'50%', objectFit:'cover', margin:'0 auto 28px', display:'block' }} />
        )}
        <h1 style={{ fontSize:'clamp(32px,5vw,48px)', fontWeight:400, marginBottom:12, letterSpacing:'-0.5px' }}>{portfolio.fullName || user.name}</h1>
        <p className="mp-accent" style={{ fontSize:18, fontStyle:'italic', marginBottom:20 }}>{portfolio.title}</p>
        {portfolio.bio && <p style={{ fontSize:16, lineHeight:1.9, color:'#555', maxWidth:560, margin:'0 auto 32px' }}>{portfolio.bio}</p>}
        <div style={{ display:'flex', gap:24, justifyContent:'center', fontFamily:"'Inter',sans-serif", fontSize:13 }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="mp-link">Email</a>}
          {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="mp-link">LinkedIn</a>}
          {portfolio.socialLinks?.github && <a href={portfolio.socialLinks.github} target="_blank" rel="noopener noreferrer" className="mp-link">GitHub</a>}
          {hasResume && <a {...resumeLink} className="mp-link">Resume</a>}
        </div>
      </section>

      {experience.length > 0 && (
        <section className="mp-section mp-line">
          <p className="mp-label">Experience</p>
          {experience.map((exp,i) => (
            <div key={exp._id} style={{ marginBottom: i < experience.length-1 ? 36 : 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <h3 style={{ fontSize:19, fontWeight:600 }}>{exp.position}</h3>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'#999' }}>{fmt(exp.startDate)} – {exp.current ? 'Present' : fmt(exp.endDate)}</span>
              </div>
              <p className="mp-accent" style={{ fontSize:15, marginTop:2 }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
              {exp.description && <p style={{ fontSize:15, color:'#555', lineHeight:1.8, marginTop:10 }}>{exp.description}</p>}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="mp-section mp-line">
          <p className="mp-label">Education</p>
          {education.map((edu,i) => (
            <div key={edu._id} style={{ marginBottom: i < education.length-1 ? 24 : 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <h3 style={{ fontSize:17, fontWeight:600 }}>{edu.degree}{edu.field ? `, ${edu.field}` : ''}</h3>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'#999' }}>{edu.startYear}–{edu.current ? 'present' : edu.endYear}</span>
              </div>
              <p className="mp-accent" style={{ fontSize:14 }}>{edu.school}{edu.grade ? ` · ${edu.grade}` : ''}</p>
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section className="mp-section mp-line">
          <p className="mp-label">Skills</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'10px 24px', fontFamily:"'Inter',sans-serif" }}>
            {skills.map(s => (
              <span key={s._id} style={{ fontSize:14 }}>{s.name} <span style={{ color:'#bbb' }}>· {s.category}</span></span>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mp-section mp-line">
          <p className="mp-label">Selected Work</p>
          {projects.map((p,i) => (
            <div key={p._id} style={{ marginBottom: i < projects.length-1 ? 32 : 0, display:'flex', gap:20, flexWrap:'wrap' }}>
              {p.image && <img src={p.image} alt={p.name} style={{ width:140, height:100, objectFit:'cover', flexShrink:0 }} />}
              <div style={{ flex:1, minWidth:200 }}>
                <h3 style={{ fontSize:18, fontWeight:600 }}>{p.name}</h3>
                {p.description && <p style={{ fontSize:14, color:'#555', lineHeight:1.7, marginTop:6 }}>{p.description}</p>}
                <div style={{ marginTop:8, fontFamily:"'Inter',sans-serif", fontSize:13, display:'flex', gap:16 }}>
                  {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="mp-link">View Project</a>}
                  {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="mp-link">Source</a>}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {certificates.length > 0 && (
        <section className="mp-section mp-line">
          <p className="mp-label">Certifications</p>
          {certificates.map(c => (
            <div key={c._id} style={{ marginBottom:14, display:'flex', justifyContent:'space-between', flexWrap:'wrap' }}>
              <span style={{ fontSize:15 }}>{c.name} — <span className="mp-accent">{c.organization}</span></span>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'#999' }}>{fmt(c.issueDate)}</span>
            </div>
          ))}
        </section>
      )}

      <section className="mp-section mp-line" style={{ textAlign:'center' }}>
        <p style={{ fontSize:18, marginBottom:16 }}>Thank you for visiting.</p>
        <div style={{ display:'flex', gap:20, justifyContent:'center', fontFamily:"'Inter',sans-serif", fontSize:14 }}>
          {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="mp-link">{portfolio.contact.email}</a>}
          {hasResume && <a {...resumeLink} className="mp-link">Download Resume</a>}
        </div>
      </section>

      <footer style={{ textAlign:'center', padding:24, fontFamily:"'Inter',sans-serif", fontSize:11, color:'#bbb' }}>Built with PortfolioForge</footer>
    </div>
  );
}
