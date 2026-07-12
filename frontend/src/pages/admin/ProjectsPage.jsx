import React, { useState, useEffect } from 'react';
import { projectsAPI, uploadAPI } from '../../services/api';
import { Modal, ConfirmDialog, EmptyState, Spinner, SectionHeader, FormField, Badge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const EMPTY_PROJECT = { name: '', description: '', technologies: '', githubLink: '', liveLink: '', image: '', featured: false };

function ProjectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_PROJECT, ...initial, technologies: Array.isArray(initial?.technologies) ? initial.technologies.join(', ') : '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await uploadAPI.image(fd);
      setForm(p => ({ ...p, image: data.url }));
      toast.success('Image uploaded!');
    } catch { toast.error('Upload failed'); } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, technologies: form.technologies.split(',').map(t => t.trim()).filter(Boolean) };
      await onSave(payload);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Project Name" required>
        <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="My Awesome Project" required />
      </FormField>
      <FormField label="Description">
        <textarea name="description" value={form.description} onChange={handleChange} className="input-field resize-none" rows={3} placeholder="What does this project do?" />
      </FormField>
      <FormField label="Technologies" hint="Comma-separated: React, Node.js, MongoDB">
        <input name="technologies" value={form.technologies} onChange={handleChange} className="input-field" placeholder="React, Node.js, MongoDB" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="GitHub Link">
          <input name="githubLink" value={form.githubLink} onChange={handleChange} className="input-field" placeholder="https://github.com/..." />
        </FormField>
        <FormField label="Live Demo Link">
          <input name="liveLink" value={form.liveLink} onChange={handleChange} className="input-field" placeholder="https://..." />
        </FormField>
      </div>
      <FormField label="Project Image">
        <div className="flex items-center gap-3">
          {form.image && <img src={form.image} alt="preview" className="w-20 h-14 rounded-lg object-cover ring-1 ring-dark-500" />}
          <label className="btn-secondary cursor-pointer">
            {uploading ? <Spinner size="sm" /> : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {form.image ? 'Change Image' : 'Upload Image'}
            <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
          </label>
        </div>
      </FormField>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))}
          className="w-4 h-4 rounded accent-primary-500" />
        <span className="text-sm text-gray-300">Mark as featured project</span>
      </label>
      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : (initial?._id ? 'Save Changes' : 'Add Project')}
        </button>
      </div>
    </form>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | project object
  const [deleteId, setDeleteId] = useState(null);

  const fetch = async () => {
    try { const { data } = await projectsAPI.getAll(); setProjects(data); }
    catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (payload) => {
    try {
      if (modal?._id) {
        const { data } = await projectsAPI.update(modal._id, payload);
        setProjects(p => p.map(pr => pr._id === data._id ? data : pr));
        toast.success('Project updated!');
      } else {
        const { data } = await projectsAPI.create(payload);
        setProjects(p => [data, ...p]);
        toast.success('Project added!');
      }
      setModal(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); throw e; }
  };

  const handleDelete = async () => {
    try {
      await projectsAPI.remove(deleteId);
      setProjects(p => p.filter(pr => pr._id !== deleteId));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Projects" description="Showcase your work"
        action={<button onClick={() => setModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Project
        </button>}
      />

      {loading ? <div className="flex justify-center pt-20"><Spinner size="lg" /></div> :
        projects.length === 0 ? (
          <EmptyState title="No projects yet" description="Add your first project to showcase your work"
            action={<button onClick={() => setModal(true)} className="btn-primary">Add Project</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(project => (
              <div key={project._id} className="card hover:border-dark-400 transition-all group flex flex-col">
                {project.image && (
                  <img src={project.image} alt={project.name}
                    className="w-full h-40 object-cover rounded-lg mb-3 ring-1 ring-dark-600" />
                )}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white text-sm">{project.name}</h3>
                  {project.featured && <Badge color="primary">Featured</Badge>}
                </div>
                {project.description && <p className="text-xs text-gray-400 mb-3 flex-1 line-clamp-2">{project.description}</p>}
                {project.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.technologies.slice(0, 4).map(t => (
                      <span key={t} className="px-2 py-0.5 bg-dark-700 text-gray-400 text-xs rounded-md font-mono">{t}</span>
                    ))}
                    {project.technologies.length > 4 && <span className="text-xs text-gray-500">+{project.technologies.length - 4}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-dark-600">
                  {project.githubLink && <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors text-xs flex items-center gap-1">GitHub</a>}
                  {project.liveLink && <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-400 transition-colors text-xs">Live ↗</a>}
                  <div className="ml-auto flex gap-1.5">
                    <button onClick={() => setModal(project)}
                      className="px-2.5 py-1 text-xs btn-secondary">Edit</button>
                    <button onClick={() => setDeleteId(project._id)}
                      className="px-2.5 py-1 text-xs btn-danger">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?._id ? 'Edit Project' : 'Add Project'} size="lg">
        <ProjectForm initial={modal?._id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Project" message="Are you sure you want to delete this project? This cannot be undone." />
    </div>
  );
}
