import React, { useState, useEffect } from 'react';
import { portfolioAPI, uploadAPI } from '../../services/api';
import { Spinner, FormField, SectionHeader, Avatar, Toggle } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const INPUT = ({ label, name, value, onChange, type = 'text', placeholder, required, hint }) => (
  <FormField label={label} required={required} hint={hint}>
    <input type={type} name={name} value={value || ''} onChange={onChange}
      placeholder={placeholder}
      className="input-field" />
  </FormField>
);

const TEXTAREA = ({ label, name, value, onChange, placeholder, rows = 4 }) => (
  <FormField label={label}>
    <textarea name={name} value={value || ''} onChange={onChange}
      placeholder={placeholder} rows={rows}
      className="input-field resize-none" />
  </FormField>
);

export default function ProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [viewingResume, setViewingResume] = useState(false);

  useEffect(() => {
    Promise.all([portfolioAPI.get(), portfolioAPI.stats()])
      .then(([p, s]) => setData({ ...p.data, username: s.data.username }))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, key] = name.split('.');
      setData(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));
    } else {
      setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: updated } = await portfolioAPI.update(data);
      setData(updated);
      toast.success('Profile saved!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading('avatar');
    try {
      const form = new FormData();
      form.append('profilePicture', file);
      const { data: r } = await uploadAPI.avatar(form);
      setData(prev => ({ ...prev, profilePicture: r.url }));
      toast.success('Photo uploaded!');
    } catch { toast.error('Upload failed'); } finally { setUploading(''); }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading('resume');
    try {
      const form = new FormData();
      form.append('resume', file);
      const { data: r } = await uploadAPI.resume(form);
      // r.publicId is what lets the backend regenerate a signed private
      // download URL on every view from now on — the actual fix for the
      // 401, not just a cosmetic field. Saved to the database the next
      // time "Save Profile" runs, same deferred-save pattern as every
      // other field on this page.
      setData(prev => ({ ...prev, resumeUrl: r.url, resumePublicId: r.publicId }));
      toast.success('Resume uploaded! Click "Save Profile" to finish.');
    } catch { toast.error('Upload failed'); } finally { setUploading(''); }
  };

  // The dashboard's resume route requires auth (it has to know whose
  // resume to find), and a plain <a href> can't carry an Authorization
  // header — so this fetches the PDF as a blob via axios (which DOES
  // attach the token), then opens a local object URL in a new tab. The
  // public theme pages don't need this dance since their resume routes
  // are intentionally unauthenticated (see publicAPI.resumeUrlFor).
  const handleViewResume = async () => {
    setViewingResume(true);
    try {
      const response = await portfolioAPI.viewResume();
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank');
      // Release the blob a little later — opening in a new tab needs it
      // to still be valid at the moment the tab loads.
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    } catch (err) {
      // responseType: 'blob' on the request means axios blobs the error
      // body too — err.response.data is a Blob, not parsed JSON, so
      // err.response.data.message is always undefined unless we read it
      // out manually. Without this, the backend's actual diagnostic
      // (which now includes the upstream HTTP status) could never reach
      // the user no matter how good the backend error message gets.
      let message = 'Could not load resume';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.message) message = parsed.message;
        } catch { /* keep the generic message if the blob isn't JSON */ }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      toast.error(message);
    } finally {
      setViewingResume(false);
    }
  };

  // No proxy, no blob fetch, no auth dance — resumeUrl is a plain
  // Cloudinary delivery link, so it's just a normal anchor tag opening in
  // a new tab, exactly like every theme's resume CTA already does.

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <SectionHeader title="Profile" description="Your personal information shown on your portfolio" />

      {/* Username (read-only) */}
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-medium text-white text-sm">Your Portfolio URL</h3>
          <p className="text-xs text-gray-500 font-mono mt-1">{window.location.origin}/{data?.username || '...'}</p>
        </div>
        {data?.username && (
          <a href={`/${data.username}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">View Live ↗</a>
        )}
      </div>

      {/* Avatar section */}
      <div className="card">
        <h3 className="section-title mb-4">Profile Picture</h3>
        <div className="flex items-center gap-5">
          <Avatar src={data?.profilePicture} name={data?.fullName} size="xl" />
          <div>
            <label className="btn-secondary cursor-pointer">
              {uploading === 'avatar' ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
              Upload Photo
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} disabled={uploading === 'avatar'} />
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or WebP. Max 5MB. Will be cropped to square.</p>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="card space-y-4">
        <h3 className="section-title">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <INPUT label="Full Name" name="fullName" value={data?.fullName} onChange={handleChange} placeholder="John Doe" required />
          <INPUT label="Title / Profession" name="title" value={data?.title} onChange={handleChange} placeholder="Full Stack Developer" />
        </div>
        <INPUT label="Tagline" name="tagline" value={data?.tagline} onChange={handleChange} placeholder="Available for opportunities" hint="A short status line shown near your name (e.g. on Modern SaaS, Startup Founder themes)" />
        <TEXTAREA label="Bio / About Me" name="bio" value={data?.bio} onChange={handleChange}
          placeholder="Write a short description about yourself..." rows={5} />
      </div>

      {/* Contact */}
      <div className="card space-y-4">
        <h3 className="section-title">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <INPUT label="Email" name="contact.email" value={data?.contact?.email} onChange={handleChange} type="email" placeholder="you@example.com" />
          <INPUT label="Phone" name="contact.phone" value={data?.contact?.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          <INPUT label="Location" name="contact.location" value={data?.contact?.location} onChange={handleChange} placeholder="New Delhi, India" />
          <INPUT label="Website" name="contact.website" value={data?.contact?.website} onChange={handleChange} placeholder="https://yoursite.com" />
        </div>
      </div>

      {/* Social links */}
      <div className="card space-y-4">
        <h3 className="section-title">Social Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <INPUT label="GitHub" name="socialLinks.github" value={data?.socialLinks?.github} onChange={handleChange} placeholder="https://github.com/username" />
          <INPUT label="LinkedIn" name="socialLinks.linkedin" value={data?.socialLinks?.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
          <INPUT label="Twitter / X" name="socialLinks.twitter" value={data?.socialLinks?.twitter} onChange={handleChange} placeholder="https://twitter.com/username" />
          <INPUT label="Instagram" name="socialLinks.instagram" value={data?.socialLinks?.instagram} onChange={handleChange} placeholder="https://instagram.com/username" />
          <INPUT label="YouTube" name="socialLinks.youtube" value={data?.socialLinks?.youtube} onChange={handleChange} placeholder="https://youtube.com/@username" />
          <INPUT label="Other Portfolio / Site" name="socialLinks.portfolio" value={data?.socialLinks?.portfolio} onChange={handleChange} placeholder="https://yoursite.com" />
        </div>
      </div>

      {/* Resume */}
      <div className="card">
        <h3 className="section-title mb-3">Resume</h3>
        <div className="flex items-center gap-4">
          {data?.resumeUrl ? (
            // <a href={data.resumeUrl} target="_blank" rel="noopener noreferrer"
            //   className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1.5">
            //   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            //   </svg>
            //   View Resume
            // </a>
            <button onClick={handleViewResume} disabled={viewingResume}
              className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1.5 disabled:opacity-50">
              {viewingResume ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              View Resume
            </button>
          ) : <span className="text-sm text-gray-500">No resume uploaded</span>}
          <label className="btn-secondary cursor-pointer">
            {uploading === 'resume' ? <Spinner size="sm" /> : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            Upload PDF
            <input type="file" accept="application/pdf" className="sr-only" onChange={handleResumeUpload} disabled={uploading === 'resume'} />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {/* PDF only, max 5MB. Opens directly in a new tab. */}
          PDF only, max 5MB. Served through a secure, signed delivery proxy for reliable viewing. If you uploaded your resume before this fix and viewing still fails, re-upload it once to switch to the new delivery method.
        </p>
      </div>

      {/* Save */}
      <div className="flex justify-end pb-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
          {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
