import React, { useState, useEffect } from 'react';
import { educationAPI } from '../../services/api';
import { Modal, ConfirmDialog, EmptyState, Spinner, SectionHeader, FormField } from '../../components/shared/UI';
import toast from 'react-hot-toast';

function EducationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ school: '', degree: '', field: '', startYear: '', endYear: '', current: false, grade: '', description: '', ...initial });
  const [saving, setSaving] = useState(false);
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.school || !form.degree || !form.startYear) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="School / University" required>
        <input name="school" value={form.school} onChange={handle} className="input-field" placeholder="IIT Delhi" required />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Degree" required>
          <input name="degree" value={form.degree} onChange={handle} className="input-field" placeholder="B.Tech / MCA / MBA" required />
        </FormField>
        <FormField label="Field of Study">
          <input name="field" value={form.field} onChange={handle} className="input-field" placeholder="Computer Science" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Year" required>
          <input type="number" name="startYear" value={form.startYear} onChange={handle} className="input-field" placeholder="2020" min="1950" max="2030" required />
        </FormField>
        {!form.current && (
          <FormField label="End Year">
            <input type="number" name="endYear" value={form.endYear} onChange={handle} className="input-field" placeholder="2024" min="1950" max="2030" />
          </FormField>
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.current} onChange={e => setForm(p => ({ ...p, current: e.target.checked, endYear: '' }))} className="w-4 h-4 rounded accent-primary-500" />
        <span className="text-sm text-gray-300">Currently studying here</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Grade / CGPA">
          <input name="grade" value={form.grade} onChange={handle} className="input-field" placeholder="8.5 CGPA / 85%" />
        </FormField>
      </div>
      <FormField label="Description">
        <textarea name="description" value={form.description} onChange={handle} className="input-field resize-none" rows={3} placeholder="Relevant coursework, activities..." />
      </FormField>
      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : (initial?._id ? 'Save Changes' : 'Add Education')}</button>
      </div>
    </form>
  );
}

export default function EducationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    educationAPI.getAll().then(r => setItems(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleSave = async (payload) => {
    try {
      if (modal?._id) {
        const { data } = await educationAPI.update(modal._id, payload);
        setItems(p => p.map(i => i._id === data._id ? data : i));
        toast.success('Updated!');
      } else {
        const { data } = await educationAPI.create(payload);
        setItems(p => [data, ...p]);
        toast.success('Added!');
      }
      setModal(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); throw e; }
  };

  const handleDelete = async () => {
    try { await educationAPI.remove(deleteId); setItems(p => p.filter(i => i._id !== deleteId)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Education" description="Your academic background"
        action={<button onClick={() => setModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Education
        </button>}
      />
      {loading ? <div className="flex justify-center pt-20"><Spinner size="lg" /></div> :
        items.length === 0 ? <EmptyState title="No education yet"
          action={<button onClick={() => setModal(true)} className="btn-primary">Add Education</button>} /> : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item._id} className="card flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-400 font-bold text-sm">
                  {item.school.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{item.degree}{item.field ? ` in ${item.field}` : ''}</h3>
                      <p className="text-xs text-gray-400">{item.school}</p>
                      <p className="text-xs text-gray-500">{item.startYear} – {item.current ? 'Present' : (item.endYear || '')}{item.grade ? ` · ${item.grade}` : ''}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setModal(item)} className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                      <button onClick={() => setDeleteId(item._id)} className="btn-danger text-xs px-2.5 py-1">Delete</button>
                    </div>
                  </div>
                  {item.description && <p className="text-xs text-gray-400 mt-2">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      }
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?._id ? 'Edit Education' : 'Add Education'} size="lg">
        <EducationForm initial={modal?._id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Education" message="Remove this education entry?" />
    </div>
  );
}
