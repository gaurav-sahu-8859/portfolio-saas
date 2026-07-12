import React, { useState, useEffect } from 'react';
import { skillsAPI } from '../../services/api';
import { Modal, ConfirmDialog, EmptyState, Spinner, SectionHeader, FormField, Badge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'DevOps', 'Mobile', 'Design', 'Other'];
const CAT_COLORS = { Frontend: 'blue', Backend: 'green', Database: 'orange', DevOps: 'purple', Mobile: 'primary', Design: 'red', Other: 'gray' };

function SkillForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', level: 80, category: 'Frontend', ...initial });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Skill name required'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Skill Name" required>
        <input name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          className="input-field" placeholder="e.g. React.js" required />
      </FormField>
      <FormField label="Category">
        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
          className="input-field">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FormField>
      <FormField label={`Proficiency Level: ${form.level}%`}>
        <input type="range" min="0" max="100" value={form.level}
          onChange={e => setForm(p => ({ ...p, level: Number(e.target.value) }))}
          className="w-full accent-primary-500" />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Beginner</span><span>Intermediate</span><span>Expert</span>
        </div>
      </FormField>
      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : (initial?._id ? 'Save Changes' : 'Add Skill')}
        </button>
      </div>
    </form>
  );
}

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetch = async () => {
    try { const { data } = await skillsAPI.getAll(); setSkills(data); }
    catch { toast.error('Failed to load skills'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (payload) => {
    try {
      if (modal?._id) {
        const { data } = await skillsAPI.update(modal._id, payload);
        setSkills(p => p.map(s => s._id === data._id ? data : s));
        toast.success('Skill updated!');
      } else {
        const { data } = await skillsAPI.create(payload);
        setSkills(p => [...p, data]);
        toast.success('Skill added!');
      }
      setModal(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); throw e; }
  };

  const handleDelete = async () => {
    try {
      await skillsAPI.remove(deleteId);
      setSkills(p => p.filter(s => s._id !== deleteId));
      toast.success('Skill deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // Group by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = skills.filter(s => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Skills" description="Your technical skills and proficiency"
        action={<button onClick={() => setModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Skill
        </button>}
      />

      {loading ? <div className="flex justify-center pt-20"><Spinner size="lg" /></div> :
        skills.length === 0 ? (
          <EmptyState title="No skills yet" description="Add your technical skills to showcase your expertise"
            action={<button onClick={() => setModal(true)} className="btn-primary">Add Skill</button>} />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Badge color={CAT_COLORS[cat]}>{cat}</Badge>
                  <span className="text-xs text-gray-500">{items.length} skill{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3">
                  {items.map(skill => (
                    <div key={skill._id} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-200">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{skill.level}%</span>
                          <button onClick={() => setModal(skill)} className="invisible group-hover:visible text-xs text-primary-400 hover:text-primary-300">Edit</button>
                          <button onClick={() => setDeleteId(skill._id)} className="invisible group-hover:visible text-xs text-red-400 hover:text-red-300">Delete</button>
                        </div>
                      </div>
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full skill-bar-fill"
                          style={{ width: `${skill.level}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?._id ? 'Edit Skill' : 'Add Skill'} size="sm">
        <SkillForm initial={modal?._id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Skill" message="Delete this skill from your portfolio?" />
    </div>
  );
}
