import React, { useState, useEffect } from 'react';
import { certificatesAPI } from '../../services/api';
import { Modal, ConfirmDialog, EmptyState, Spinner, SectionHeader, FormField } from '../../components/shared/UI';
import toast from 'react-hot-toast';

function CertForm({ initial, onSave, onCancel }) {
  const toDateInput = d => d ? new Date(d).toISOString().split('T')[0] : '';
  const [form, setForm] = useState({
    name: '', organization: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '',
    ...initial, issueDate: toDateInput(initial?.issueDate), expiryDate: toDateInput(initial?.expiryDate)
  });
  const [saving, setSaving] = useState(false);
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.organization || !form.issueDate) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Certificate Name" required>
        <input name="name" value={form.name} onChange={handle} className="input-field" placeholder="AWS Certified Developer" required />
      </FormField>
      <FormField label="Issuing Organization" required>
        <input name="organization" value={form.organization} onChange={handle} className="input-field" placeholder="Amazon Web Services" required />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Issue Date" required>
          <input type="date" name="issueDate" value={form.issueDate} onChange={handle} className="input-field" required />
        </FormField>
        <FormField label="Expiry Date" hint="Leave empty if no expiry">
          <input type="date" name="expiryDate" value={form.expiryDate} onChange={handle} className="input-field" />
        </FormField>
      </div>
      <FormField label="Credential ID">
        <input name="credentialId" value={form.credentialId} onChange={handle} className="input-field" placeholder="ABC-123-XYZ" />
      </FormField>
      <FormField label="Credential URL">
        <input name="credentialUrl" value={form.credentialUrl} onChange={handle} className="input-field" placeholder="https://verify.cert.com/..." />
      </FormField>
      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : (initial?._id ? 'Save Changes' : 'Add Certificate')}</button>
      </div>
    </form>
  );
}

const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

export default function CertificatesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    certificatesAPI.getAll().then(r => setItems(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleSave = async (payload) => {
    try {
      if (modal?._id) {
        const { data } = await certificatesAPI.update(modal._id, payload);
        setItems(p => p.map(i => i._id === data._id ? data : i));
        toast.success('Updated!');
      } else {
        const { data } = await certificatesAPI.create(payload);
        setItems(p => [data, ...p]);
        toast.success('Added!');
      }
      setModal(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); throw e; }
  };

  const handleDelete = async () => {
    try { await certificatesAPI.remove(deleteId); setItems(p => p.filter(i => i._id !== deleteId)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Certificates" description="Your certifications and achievements"
        action={<button onClick={() => setModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Certificate
        </button>}
      />
      {loading ? <div className="flex justify-center pt-20"><Spinner size="lg" /></div> :
        items.length === 0 ? <EmptyState title="No certificates yet"
          action={<button onClick={() => setModal(true)} className="btn-primary">Add Certificate</button>} /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item._id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-400">{item.organization}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Issued {fmt(item.issueDate)}{item.expiryDate ? ` · Expires ${fmt(item.expiryDate)}` : ' · No Expiry'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
                {item.credentialId && <p className="text-xs text-gray-500 font-mono">ID: {item.credentialId}</p>}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-600">
                  {item.credentialUrl && (
                    <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-400 hover:text-primary-300">Verify ↗</a>
                  )}
                  <div className="ml-auto flex gap-1.5">
                    <button onClick={() => setModal(item)} className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                    <button onClick={() => setDeleteId(item._id)} className="btn-danger text-xs px-2.5 py-1">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?._id ? 'Edit Certificate' : 'Add Certificate'} size="md">
        <CertForm initial={modal?._id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Certificate" message="Remove this certificate?" />
    </div>
  );
}
