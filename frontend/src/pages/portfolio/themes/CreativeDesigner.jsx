import React from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function CreativeDesigner({ data, accent = '#ff3366' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const A = accent;

  return (
    <div style={{ background:'#fafafa', color:'#111111', fontFamily:"'Inter', sans-serif", minHeight:'100vh' }}>
      <style>{`
        .cd-accent{ color:${A}; }
        .cd-accent-bg{ background:${A}; }
        .cd-h1{ font-size:clamp(48px,10vw,110px); font-weight:900; line-height:0.95; letter-spacing:-3px; }
        .cd-card{ background:#fff; border:3px solid #111; border-radius:0; transition:transform 0.2s; }
        .cd-card:hover{ transform:translate(-4px,-4px); box-shadow:8px 8px 0 ${A}; }
        .cd-btn{ background:#111; color:#fff; padding:14px 32px; font-weight:700; text-decoration:none; display:inline-block; border:3px solid #111; transition:all 0.2s; }
        .cd-btn:hover{ background:${A}; border-color:${A}; transform:translate(-2px,-2px); }
        .cd-btn-outline{ background:transparent; color:#111; padding:13px 30px; font-weight:700; border:3px solid #111; text-decoration:none; display:inline-block; transition:all 0.2s; }
        .cd-btn-outline:hover{ background:#111; color:#fff; }
        .cd-tag{ background:#111; color:#fff; padding:4px 12px; font-size:11px; font-weight:700; text-transform:uppercase; }
        .cd-section{ padding:80px 24px; }
        @media(max-width:768px){ .cd-section{ padding:50px 16px; } }
      `}</style>

      {/* Nav */}
      <nav style={{ padding:'24px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #111' }}>
        <span style={{ fontWeight:900, fontSize:20 }}>{(portfolio.fullName || user.name).toUpperCase()}</span>
        <Link to="/builder" style={{ fontWeight:700, fontSize:13, color:'#111', textDecoration:'none' }}>← BUILDER</Link>
      </nav>

      {/* Hero - asymmetric */}
      <section className="cd-section" style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:40, alignItems:'center', maxWidth:1200, margin:'0 auto' }}>
        <div>
          <div className="cd-tag" style={{ display:'inline-block', marginBottom:20, background:A }}>{portfolio.tagline || 'Creative Portfolio'}</div>
          <h1 className="cd-h1">{(portfolio.fullName || user.name).split(' ').map((w,i) => <span key={i} style={{ display:'block' }}>{i===1 ? <span className="cd-accent">{w}</span> : w}</span>)}</h1>
          <p style={{ fontSize:20, fontWeight:600, marginTop:24, marginBottom:16 }}>{portfolio.title}</p>
          {portfolio.bio && <p style={{ fontSize:15, lineHeight:1.7, color:'#444', maxWidth:480 }}>{portfolio.bio}</p>}
          <div style={{ display:'flex', gap:14, marginTop:32, flexWrap:'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="cd-btn">LET'S TALK</a>}
            {hasResume && <a {...resumeLink} className="cd-btn-outline">RESUME</a>}
          </div>
        </div>
        <div style={{ position:'relative' }}>
          {portfolio.profilePicture ? (
            <div style={{ border:'4px solid #111', position:'relative' }}>
              <img src={portfolio.profilePicture} alt={portfolio.fullName} style={{ width:'100%', display:'block', filter:'grayscale(20%)' }} />
              <div style={{ position:'absolute', bottom:-14, right:-14, width:60, height:60, borderRadius:'50%', background:A, border:'4px solid #111' }} />
            </div>
          ) : <div style={{ aspectRatio:'1', background:A, border:'4px solid #111' }} />}
        </div>
      </section>

      {/* Skills */}
      {skills.length > 0 && (
        <section className="cd-section" style={{ borderTop:'3px solid #111', maxWidth:1200, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, marginBottom:40 }}>SKILLS<span className="cd-accent">.</span></h2>
          <div style={{ display:'flex', flexWrap:'wrap', gap:14 }}>
            {skills.map(s => (
              <div key={s._id} className="cd-card" style={{ padding:'14px 24px' }}>
                <span style={{ fontWeight:700 }}>{s.name}</span>
                <span className="cd-accent" style={{ fontWeight:900, marginLeft:10 }}>{s.level}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="cd-section" style={{ borderTop:'3px solid #111', maxWidth:1200, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, marginBottom:40 }}>WORK<span className="cd-accent">.</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:30 }}>
            {projects.map((p, i) => (
              <div key={p._id} className="cd-card">
                {p.image && <img src={p.image} alt={p.name} style={{ width:'100%', height:220, objectFit:'cover', borderBottom:'3px solid #111' }} />}
                <div style={{ padding:24 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <h3 style={{ fontWeight:900, fontSize:20 }}>{p.name}</h3>
                    {p.featured && <span className="cd-tag" style={{ background:A }}>FEATURED</span>}
                  </div>
                  {p.description && <p style={{ fontSize:14, color:'#444', lineHeight:1.6, marginBottom:16 }}>{p.description}</p>}
                  {p.technologies?.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                      {p.technologies.map(t => <span key={t} style={{ fontSize:11, fontWeight:700, color:'#666' }}>#{t}</span>)}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:16 }}>
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" style={{ fontWeight:700, fontSize:13, color:'#111', textDecoration:'underline' }}>CODE</a>}
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="cd-accent" style={{ fontWeight:700, fontSize:13, textDecoration:'underline' }}>VIEW LIVE</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="cd-section" style={{ borderTop:'3px solid #111', maxWidth:1200, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, marginBottom:40 }}>EXPERIENCE<span className="cd-accent">.</span></h2>
          {experience.map(exp => (
            <div key={exp._id} style={{ borderBottom:'2px solid #111', padding:'24px 0', display:'flex', flexWrap:'wrap', justifyContent:'space-between', gap:12 }}>
              <div>
                <h3 style={{ fontWeight:900, fontSize:20 }}>{exp.position}</h3>
                <p className="cd-accent" style={{ fontWeight:700 }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</p>
                {exp.description && <p style={{ fontSize:14, color:'#444', marginTop:8, maxWidth:600 }}>{exp.description}</p>}
              </div>
              <span style={{ fontWeight:700, fontSize:13, color:'#666', whiteSpace:'nowrap' }}>{fmt(exp.startDate)} – {exp.current ? 'NOW' : fmt(exp.endDate)}</span>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="cd-section" style={{ borderTop:'3px solid #111', maxWidth:1200, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, marginBottom:40 }}>EDUCATION<span className="cd-accent">.</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:24 }}>
            {education.map(edu => (
              <div key={edu._id} className="cd-card" style={{ padding:24 }}>
                <h3 style={{ fontWeight:900, fontSize:17 }}>{edu.degree}</h3>
                <p className="cd-accent" style={{ fontWeight:700, fontSize:14 }}>{edu.school}</p>
                <p style={{ fontSize:12, color:'#666', marginTop:6 }}>{edu.startYear}–{edu.current ? 'present' : edu.endYear}{edu.grade ? ` · ${edu.grade}` : ''}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <section className="cd-section" style={{ borderTop:'3px solid #111', maxWidth:1200, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, marginBottom:40 }}>CERTS<span className="cd-accent">.</span></h2>
          <div style={{ display:'flex', flexWrap:'wrap', gap:14 }}>
            {certificates.map(c => (
              <div key={c._id} className="cd-card" style={{ padding:'16px 20px', minWidth:220 }}>
                <p style={{ fontWeight:900 }}>{c.name}</p>
                <p style={{ fontSize:13, color:'#666' }}>{c.organization}</p>
                {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="cd-accent" style={{ fontSize:12, fontWeight:700, textDecoration:'underline' }}>VERIFY</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="cd-section" style={{ borderTop:'3px solid #111', background:'#111', maxWidth:'100%' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(32px,6vw,64px)', fontWeight:900, color:'#fff', marginBottom:30 }}>LET'S CREATE<span className="cd-accent">.</span></h2>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} style={{ background:A, color:'#111', padding:'14px 32px', fontWeight:700, textDecoration:'none', border:'3px solid '+A }}>EMAIL ME</a>}
            {hasResume && <a {...resumeLink} style={{ background:'transparent', color:'#fff', padding:'13px 30px', fontWeight:700, textDecoration:'none', border:'3px solid #fff' }}>RESUME</a>}
            {portfolio.socialLinks?.instagram && <a href={portfolio.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ background:'transparent', color:'#fff', padding:'13px 30px', fontWeight:700, textDecoration:'none', border:'3px solid #fff' }}>INSTAGRAM</a>}
          </div>
        </div>
      </section>

      <footer style={{ padding:20, textAlign:'center', background:'#111' }}>
        <p style={{ fontSize:11, color:'#666' }}>Built with PortfolioForge</p>
      </footer>
    </div>
  );
}
