import React from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function Glassmorphism({ data, accent = '#a855f7' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;
  const skillGroups = skills.reduce((a,s) => { if(!a[s.category]) a[s.category]=[]; a[s.category].push(s); return a; }, {});

  return (
    <div style={{
      background: `radial-gradient(circle at 20% 20%, ${A}33, transparent 50%), radial-gradient(circle at 80% 80%, #3b82f655, transparent 50%), #0d0820`,
      color:'#f0e6ff', fontFamily:"'Inter',sans-serif", minHeight:'100vh'
    }}>
      <style>{`
        .gl-accent{ color:${A}; }
        .gl-glass{ background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.15); border-radius:20px; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); }
        .gl-glass:hover{ background:rgba(255,255,255,0.1); }
        .gl-btn{ background:linear-gradient(135deg, ${A}, #ec4899); color:#fff; padding:13px 30px; border-radius:14px; font-weight:700; text-decoration:none; display:inline-block; box-shadow:0 8px 30px ${A}44; }
        .gl-btn-outline{ background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#fff; padding:12px 28px; border-radius:14px; font-weight:600; text-decoration:none; display:inline-block; backdrop-filter:blur(10px); }
        .gl-section{ padding:80px 24px; max-width:1100px; margin:0 auto; }
        .gl-h2{ font-size:clamp(28px,4vw,42px); font-weight:800; text-align:center; margin-bottom:50px; }
      `}</style>

      <nav style={{ padding:'20px 24px', display:'flex', justifyContent:'space-between', maxWidth:1100, margin:'0 auto' }}>
        <span style={{ fontWeight:800 }}>{portfolio.fullName || user.name}</span>
        <Link to="/builder" style={{ color:'#c4b5fd', fontSize:13, textDecoration:'none' }}>Builder</Link>
      </nav>

      <section className="gl-section" style={{ textAlign:'center', paddingTop:60 }}>
        <div className="gl-glass" style={{ display:'inline-block', padding:48, maxWidth:560 }}>
          {portfolio.profilePicture && (
            <img src={portfolio.profilePicture} alt="" style={{ width:100, height:100, borderRadius:'50%', objectFit:'cover', margin:'0 auto 24px', display:'block', border:'2px solid rgba(255,255,255,0.3)' }} />
          )}
          <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:800, marginBottom:10 }}>{portfolio.fullName || user.name}</h1>
          <p className="gl-accent" style={{ fontSize:17, fontWeight:600, marginBottom:16 }}>{portfolio.title}</p>
          {portfolio.bio && <p style={{ color:'#d8c8f0', fontSize:14, lineHeight:1.7, marginBottom:28 }}>{portfolio.bio}</p>}
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="gl-btn">Contact Me</a>}
            {hasResume && <a {...resumeLink} className="gl-btn-outline">Resume</a>}
            {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="gl-btn-outline">LinkedIn</a>}
          </div>
        </div>
      </section>

      {skills.length > 0 && (
        <section className="gl-section">
          <h2 className="gl-h2">Skills & <span className="gl-accent">Expertise</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
            {Object.entries(skillGroups).map(([cat, items]) => (
              <div key={cat} className="gl-glass" style={{ padding:24 }}>
                <p className="gl-accent" style={{ fontWeight:700, marginBottom:16 }}>{cat}</p>
                {items.map(s => (
                  <div key={s._id} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}><span>{s.name}</span><span style={{ color:'#c4b5fd' }}>{s.level}%</span></div>
                    <div style={{ height:6, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${s.level}%`, background:`linear-gradient(90deg, ${A}, #ec4899)`, borderRadius:99 }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="gl-section">
          <h2 className="gl-h2">Featured <span className="gl-accent">Projects</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:22 }}>
            {projects.map(p => (
              <div key={p._id} className="gl-glass" style={{ overflow:'hidden' }}>
                {p.image && <img src={p.image} alt={p.name} style={{ width:'100%', height:180, objectFit:'cover' }} />}
                <div style={{ padding:24 }}>
                  <h3 style={{ fontWeight:700, marginBottom:8 }}>{p.name}</h3>
                  {p.description && <p style={{ color:'#d8c8f0', fontSize:13, lineHeight:1.6, marginBottom:14 }}>{p.description}</p>}
                  {p.technologies?.length > 0 && <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                    {p.technologies.map(t => <span key={t} style={{ fontSize:11, background:'rgba(255,255,255,0.1)', padding:'3px 9px', borderRadius:8 }}>{t}</span>)}
                  </div>}
                  <div style={{ display:'flex', gap:14 }}>
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="gl-accent" style={{ fontSize:13, textDecoration:'none', fontWeight:600 }}>GitHub →</a>}
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" style={{ color:'#d8c8f0', fontSize:13, textDecoration:'none' }}>Live →</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="gl-section">
          <h2 className="gl-h2">Work <span className="gl-accent">Experience</span></h2>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {experience.map(exp => (
              <div key={exp._id} className="gl-glass" style={{ padding:24, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                <div>
                  <h3 style={{ fontWeight:700 }}>{exp.position}</h3>
                  <p className="gl-accent" style={{ fontSize:14 }}>{exp.company}</p>
                  {exp.description && <p style={{ color:'#d8c8f0', fontSize:13, marginTop:8, maxWidth:520 }}>{exp.description}</p>}
                </div>
                <span style={{ fontSize:12, color:'#a78bca' }}>{fmt(exp.startDate)} – {exp.current ? 'Present' : fmt(exp.endDate)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(education.length > 0 || certificates.length > 0) && (
        <section className="gl-section" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:30 }}>
          {education.length > 0 && <div>
            <p className="gl-accent" style={{ fontWeight:700, marginBottom:16 }}>Education</p>
            {education.map(e => <div key={e._id} className="gl-glass" style={{ padding:18, marginBottom:12 }}><p style={{ fontWeight:600 }}>{e.degree}</p><p style={{ fontSize:13, color:'#c4b5fd' }}>{e.school}</p></div>)}
          </div>}
          {certificates.length > 0 && <div>
            <p className="gl-accent" style={{ fontWeight:700, marginBottom:16 }}>Certificates</p>
            {certificates.map(c => <div key={c._id} className="gl-glass" style={{ padding:18, marginBottom:12 }}><p style={{ fontWeight:600 }}>{c.name}</p><p style={{ fontSize:13, color:'#c4b5fd' }}>{c.organization}</p></div>)}
          </div>}
        </section>
      )}

      <section className="gl-section" style={{ textAlign:'center' }}>
        <div className="gl-glass" style={{ padding:48, display:'inline-block' }}>
          <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, marginBottom:24 }}>Let's <span className="gl-accent">Connect</span></h2>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="gl-btn">Email Me</a>}
            {hasResume && <a {...resumeLink} className="gl-btn-outline">Resume</a>}
          </div>
        </div>
      </section>

      <footer style={{ textAlign:'center', padding:24 }}>
        <p style={{ fontSize:12, color:'#7c6a99' }}>Built with PortfolioForge</p>
      </footer>
    </div>
  );
}
