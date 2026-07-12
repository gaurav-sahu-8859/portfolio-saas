import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeLink } from '../../../themes/getResumeLink';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function DeveloperTerminal({ data, accent = '#00ff41' }) {
  const { portfolio, user, projects = [], skills = [], experience = [], education = [], certificates = [] } = data;
  const { hasResume, linkProps: resumeLink } = getResumeLink(data);
  const [typed, setTyped] = useState('');
  const fullText = `whoami: ${portfolio.fullName || user.name}`;

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setTyped(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [fullText]);

  const A = accent;
  const skillGroups = skills.reduce((a, s) => { if (!a[s.category]) a[s.category] = []; a[s.category].push(s); return a; }, {});

  return (
    <div style={{ background:'#0d1117', color:'#c9d1d9', fontFamily:"'JetBrains Mono', monospace", minHeight:'100vh', fontSize:14 }}>
      <style>{`
        .dt-accent{ color:${A}; }
        .dt-window{ background:#161b22; border:1px solid #30363d; border-radius:8px; overflow:hidden; }
        .dt-titlebar{ background:#21262d; padding:8px 14px; display:flex; align-items:center; gap:8px; border-bottom:1px solid #30363d; }
        .dt-dot{ width:11px; height:11px; border-radius:50%; }
        .dt-prompt{ color:${A}; }
        .dt-comment{ color:#8b949e; }
        .dt-link{ color:${A}; text-decoration:none; border-bottom:1px dashed ${A}66; }
        .dt-link:hover{ border-bottom-style:solid; }
        .dt-card{ background:#161b22; border:1px solid #30363d; border-radius:6px; padding:16px; transition:border-color 0.2s; }
        .dt-card:hover{ border-color:${A}55; }
        .dt-section{ padding:50px 20px; max-width:900px; margin:0 auto; }
        .dt-tag{ background:#0d1117; border:1px solid #30363d; border-radius:4px; padding:2px 8px; font-size:11px; color:#8b949e; }
        .dt-bar{ height:6px; background:#0d1117; border:1px solid #30363d; border-radius:3px; overflow:hidden; }
        .dt-bar-fill{ height:100%; background:${A}; transition:width 1s; }
        @keyframes blink{ 0%,50%{opacity:1;} 51%,100%{opacity:0;} }
        .cursor{ animation: blink 1s step-end infinite; }
      `}</style>

      {/* Top nav */}
      <div style={{ borderBottom:'1px solid #30363d', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#0d1117', zIndex:50 }}>
        <span className="dt-prompt">~/{user.username} $</span>
        <div style={{ display:'flex', gap:16, fontSize:13 }}>
          {hasResume && <a {...resumeLink} className="dt-link">./resume.pdf</a>}
          <Link to="/builder" className="dt-link">exit</Link>
        </div>
      </div>

      <div className="dt-section">
        {/* Terminal hero */}
        <div className="dt-window" style={{ marginTop:30 }}>
          <div className="dt-titlebar">
            <div className="dt-dot" style={{ background:'#ff5f56' }} />
            <div className="dt-dot" style={{ background:'#ffbd2e' }} />
            <div className="dt-dot" style={{ background:'#27c93f' }} />
            <span style={{ marginLeft:8, color:'#8b949e', fontSize:12 }}>bash — {user.username}@portfolio</span>
          </div>
          <div style={{ padding:24 }}>
            <p><span className="dt-prompt">$</span> {typed}<span className="cursor">▊</span></p>
            {portfolio.title && <p style={{ marginTop:8 }}><span className="dt-comment"># role:</span> {portfolio.title}</p>}
            {portfolio.bio && <p style={{ marginTop:12, color:'#c9d1d9', lineHeight:1.7 }}><span className="dt-comment">// </span>{portfolio.bio}</p>}
            <p style={{ marginTop:16 }}>
              <span className="dt-comment">$ ls socials/</span><br />
              {[
                portfolio.socialLinks?.github && ['github', portfolio.socialLinks.github],
                portfolio.socialLinks?.linkedin && ['linkedin', portfolio.socialLinks.linkedin],
                portfolio.socialLinks?.twitter && ['twitter', portfolio.socialLinks.twitter],
                portfolio.contact?.email && ['email', `mailto:${portfolio.contact.email}`]
              ].filter(Boolean).map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="dt-link" style={{ marginRight:16, display:'inline-block', marginTop:6 }}>{label}</a>
              ))}
              {hasResume && <a {...resumeLink} className="dt-link" style={{ marginRight:16, display:'inline-block', marginTop:6 }}>resume.pdf</a>}
            </p>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{ marginTop:40 }}>
            <p className="dt-comment" style={{ marginBottom:16 }}>$ cat skills.json</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))', gap:14 }}>
              {Object.entries(skillGroups).map(([cat, items]) => (
                <div key={cat} className="dt-card">
                  <p className="dt-accent" style={{ fontWeight:700, marginBottom:10 }}>"{cat.toLowerCase()}": [</p>
                  {items.map(sk => (
                    <div key={sk._id} style={{ marginBottom:10, paddingLeft:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                        <span>"{sk.name}"</span><span className="dt-comment">{sk.level}%</span>
                      </div>
                      <div className="dt-bar"><div className="dt-bar-fill" style={{ width:`${sk.level}%` }} /></div>
                    </div>
                  ))}
                  <p className="dt-accent">]</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div style={{ marginTop:40 }}>
            <p className="dt-comment" style={{ marginBottom:16 }}>$ ls -la projects/</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:14 }}>
              {projects.map(p => (
                <div key={p._id} className="dt-card">
                  {p.image && <img src={p.image} alt={p.name} style={{ width:'100%', height:140, objectFit:'cover', borderRadius:4, marginBottom:12, border:'1px solid #30363d' }} />}
                  <p><span className="dt-accent">drwxr-xr-x</span> {p.name}{p.featured && <span className="dt-comment"> # featured</span>}</p>
                  {p.description && <p style={{ color:'#8b949e', fontSize:13, marginTop:6, lineHeight:1.6 }}>{p.description}</p>}
                  {p.technologies?.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                      {p.technologies.map(t => <span key={t} className="dt-tag">{t}</span>)}
                    </div>
                  )}
                  <div style={{ marginTop:10, display:'flex', gap:14 }}>
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="dt-link" style={{ fontSize:12 }}>git clone</a>}
                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="dt-link" style={{ fontSize:12 }}>./run.sh</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div style={{ marginTop:40 }}>
            <p className="dt-comment" style={{ marginBottom:16 }}>$ git log --oneline experience/</p>
            {experience.map(exp => (
              <div key={exp._id} className="dt-card" style={{ marginBottom:12 }}>
                <p><span className="dt-accent">commit</span> {exp.position}@{exp.company}</p>
                <p className="dt-comment" style={{ fontSize:12, marginTop:4 }}>Date: {fmt(exp.startDate)} → {exp.current ? 'HEAD' : fmt(exp.endDate)}</p>
                {exp.description && <p style={{ marginTop:8, fontSize:13, color:'#c9d1d9', paddingLeft:12 }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div style={{ marginTop:40 }}>
            <p className="dt-comment" style={{ marginBottom:16 }}>$ cat education.log</p>
            {education.map(edu => (
              <div key={edu._id} className="dt-card" style={{ marginBottom:12 }}>
                <p><span className="dt-accent">[INFO]</span> {edu.degree}{edu.field ? ` (${edu.field})` : ''} — {edu.school}</p>
                <p className="dt-comment" style={{ fontSize:12, marginTop:4 }}>{edu.startYear}–{edu.current ? 'present' : edu.endYear}{edu.grade ? ` · ${edu.grade}` : ''}</p>
              </div>
            ))}
          </div>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <div style={{ marginTop:40 }}>
            <p className="dt-comment" style={{ marginBottom:16 }}>$ ls certs/*.cert</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:12 }}>
              {certificates.map(c => (
                <div key={c._id} className="dt-card">
                  <p className="dt-accent" style={{ fontSize:13, fontWeight:700 }}>{c.name}.cert</p>
                  <p className="dt-comment" style={{ fontSize:12, marginTop:4 }}>{c.organization} · {fmt(c.issueDate)}</p>
                  {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="dt-link" style={{ fontSize:12, marginTop:6, display:'inline-block' }}>verify --check</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div style={{ marginTop:40, marginBottom:40 }}>
          <p className="dt-comment" style={{ marginBottom:16 }}>$ ./contact.sh --send</p>
          <div className="dt-card">
            <p>Reach out via:</p>
            <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:16 }}>
              {portfolio.contact?.email && <a href={`mailto:${portfolio.contact.email}`} className="dt-link">{portfolio.contact.email}</a>}
              {portfolio.socialLinks?.linkedin && <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="dt-link">LinkedIn</a>}
              {portfolio.socialLinks?.twitter && <a href={portfolio.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="dt-link">Twitter</a>}
              {hasResume && <a {...resumeLink} className="dt-link">./download-resume.sh</a>}
            </div>
          </div>
        </div>

        <p style={{ textAlign:'center', color:'#30363d', fontSize:11, paddingBottom:20 }}># EOF — built with PortfolioForge</p>
      </div>
    </div>
  );
}
