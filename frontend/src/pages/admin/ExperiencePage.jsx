import React, { useState, useEffect } from 'react';
import { experienceAPI } from '../../services/api';
import { Modal, ConfirmDialog, EmptyState, Spinner, SectionHeader, FormField } from '../../components/shared/UI';
import toast from 'react-hot-toast';

function ExperienceForm({ initial, onSave, onCancel }) {
  const toDateInput = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
  const [form, setForm] = useState({
    company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '',
    ...initial, startDate: toDateInput(initial?.startDate), endDate: toDateInput(initial?.endDate)
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company || !form.position || !form.startDate) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Company" required>
          <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="input-field" placeholder="Google" required />
        </FormField>
        <FormField label="Position" required>
          <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className="input-field" placeholder="Senior Developer" required />
        </FormField>
      </div>
      <FormField label="Location">
        <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input-field" placeholder="Remote / New Delhi" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Date" required>
          <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input-field" required />
        </FormField>
        {!form.current && (
          <FormField label="End Date">
            <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input-field" />
          </FormField>
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.current} onChange={e => setForm(p => ({ ...p, current: e.target.checked, endDate: '' }))} className="w-4 h-4 rounded accent-primary-500" />
        <span className="text-sm text-gray-300">I currently work here</span>
      </label>
      <FormField label="Description">
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field resize-none" rows={3} placeholder="Describe your role and achievements..." />
      </FormField>
      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : (initial?._id ? 'Save Changes' : 'Add Experience')}</button>
      </div>
    </form>
  );
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function ExperiencePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    experienceAPI.getAll().then(r => setItems(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleSave = async (payload) => {
    try {
      if (modal?._id) {
        const { data } = await experienceAPI.update(modal._id, payload);
        setItems(p => p.map(i => i._id === data._id ? data : i));
        toast.success('Updated!');
      } else {
        const { data } = await experienceAPI.create(payload);
        setItems(p => [data, ...p]);
        toast.success('Added!');
      }
      setModal(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); throw e; }
  };

  const handleDelete = async () => {
    try { await experienceAPI.remove(deleteId); setItems(p => p.filter(i => i._id !== deleteId)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Experience" description="Your work history"
        action={<button onClick={() => setModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Experience
        </button>}
      />
      {loading ? <div className="flex justify-center pt-20"><Spinner size="lg" /></div> :
        items.length === 0 ? <EmptyState title="No experience yet" description="Add your work history"
          action={<button onClick={() => setModal(true)} className="btn-primary">Add Experience</button>} /> : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item._id} className="card flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0 text-primary-400 font-bold text-sm">
                  {item.company.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{item.position}</h3>
                      <p className="text-xs text-gray-400">{item.company}{item.location ? ` · ${item.location}` : ''}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmt(item.startDate)} – {item.current ? 'Present' : fmt(item.endDate)}</p>
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
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?._id ? 'Edit Experience' : 'Add Experience'} size="lg">
        <ExperienceForm initial={modal?._id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Experience" message="Remove this work experience from your portfolio?" />
    </div>
  );
}
