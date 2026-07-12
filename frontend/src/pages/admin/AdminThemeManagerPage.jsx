import React, { useState, useEffect } from 'react';
import { adminThemesAPI } from '../../services/api';
import { Modal, ConfirmDialog, Spinner, SectionHeader, FormField, Badge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const ACCENT_PRESETS = ['#6366f1', '#00ff41', '#ff3366', '#1a1a2e', '#00d4ff', '#ff6b00', '#a855f7', '#d4af37', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

function CreateThemeForm({ availableToAdd, onSave, onCancel }) {
  const [form, setForm] = useState({ key: '', name: '', description: '', previewAccent: '#6366f1', order: 0, isPremium: false });
  const [saving, setSaving] = useState(false);

  const handleKeyPick = (key) => {
    const preset = availableToAdd.find(t => t.key === key);
    setForm(p => ({
      ...p, key,
      name: preset?.name || p.name,
      description: preset?.description || p.description,
      previewAccent: preset?.previewAccent || p.previewAccent,
      isPremium: preset?.isPremium ?? p.isPremium,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.key || !form.name) { toast.error('Pick a theme component and give it a name'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  if (availableToAdd.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-400">Every implemented theme is already in your catalog.</p>
        <button onClick={onCancel} className="btn-secondary mt-4">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Theme Component" required hint="Only components that exist in the codebase can be added">
        <select value={form.key} onChange={e => handleKeyPick(e.target.value)} className="input-field">
          <option value="">Select a theme component...</option>
          {availableToAdd.map(t => <option key={t.key} value={t.key}>{t.name}{t.isPremium ? ' (Premium)' : ''}</option>)}
        </select>
      </FormField>
      <FormField label="Display Name" required hint='Shown to users — e.g. "Theme 1" or a descriptive name, your choice'>
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Modern SaaS" />
      </FormField>
      <FormField label="Description">
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field resize-none" rows={2} />
      </FormField>
      <FormField label="Accent Swatch">
        <div className="flex gap-2 flex-wrap">
          {ACCENT_PRESETS.map(c => (
            <button key={c} type="button" onClick={() => setForm(p => ({ ...p, previewAccent: c }))}
              className={`w-8 h-8 rounded-full transition-all ${form.previewAccent === c ? 'ring-2 ring-offset-2 ring-offset-dark-800 ring-white scale-110' : ''}`}
              style={{ background: c }} />
          ))}
        </div>
      </FormField>
      <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg bg-dark-700 border border-dark-500">
        <input type="checkbox" checked={form.isPremium} onChange={e => setForm(p => ({ ...p, isPremium: e.target.checked }))}
          className="w-4 h-4 rounded accent-primary-500" />
        <div>
          <span className="text-sm text-gray-200 font-medium">Premium theme</span>
          <p className="text-xs text-gray-500">Only users on the Pro plan can select this theme</p>
        </div>
      </label>
      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : 'Add to Catalog'}</button>
      </div>
    </form>
  );
}

function EditThemeForm({ theme, onSave, onCancel }) {
  const [form, setForm] = useState({ name: theme.name, description: theme.description, previewAccent: theme.previewAccent, order: theme.order, isPremium: theme.isPremium });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Display Name" required>
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" />
      </FormField>
      <FormField label="Description">
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field resize-none" rows={2} />
      </FormField>
      <FormField label="Accent Swatch">
        <div className="flex gap-2 flex-wrap">
          {ACCENT_PRESETS.map(c => (
            <button key={c} type="button" onClick={() => setForm(p => ({ ...p, previewAccent: c }))}
              className={`w-8 h-8 rounded-full transition-all ${form.previewAccent === c ? 'ring-2 ring-offset-2 ring-offset-dark-800 ring-white scale-110' : ''}`}
              style={{ background: c }} />
          ))}
        </div>
      </FormField>
      <FormField label="Display Order">
        <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} className="input-field" />
      </FormField>
      <label className={`flex items-center gap-2.5 p-3 rounded-lg bg-dark-700 border border-dark-500 ${theme.isDefault ? 'opacity-50' : 'cursor-pointer'}`}>
        <input type="checkbox" checked={form.isPremium} disabled={theme.isDefault}
          onChange={e => setForm(p => ({ ...p, isPremium: e.target.checked }))}
          className="w-4 h-4 rounded accent-primary-500" />
        <div>
          <span className="text-sm text-gray-200 font-medium">Premium theme</span>
          <p className="text-xs text-gray-500">{theme.isDefault ? 'The default theme must stay free' : 'Only users on the Pro plan can select this theme'}</p>
        </div>
      </label>
      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : 'Save Changes'}</button>
      </div>
    </form>
  );
}

export default function AdminThemeManagerPage() {
  const [themes, setThemes] = useState([]);
  const [availableToAdd, setAvailableToAdd] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState('');

  const load = async () => {
    try {
      const { data } = await adminThemesAPI.getAll();
      setThemes(data.themes);
      setAvailableToAdd(data.availableToAdd);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load catalog');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload) => {
    try {
      await adminThemesAPI.create(payload);
      toast.success('Theme added to catalog');
      setCreateModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add theme'); throw e; }
  };

  const handleEditSave = async (payload) => {
    try {
      await adminThemesAPI.update(editModal._id, payload);
      toast.success('Theme updated');
      setEditModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update'); throw e; }
  };

  const handleToggleEnabled = async (theme) => {
    setBusy(theme._id);
    try {
      await adminThemesAPI.update(theme._id, { isEnabled: !theme.isEnabled });
      toast.success(theme.isEnabled ? 'Theme disabled' : 'Theme enabled');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setBusy(''); }
  };

  const handleSetDefault = async (theme) => {
    setBusy(theme._id);
    try {
      await adminThemesAPI.setDefault(theme._id);
      toast.success(`"${theme.name}" is now the default for new users`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setBusy(''); }
  };

  const handleDelete = async () => {
    try {
      const { data } = await adminThemesAPI.remove(deleteTarget._id);
      toast.success(`Removed from catalog${data.affectedExistingUsers ? ` — ${data.affectedExistingUsers} existing user(s) keep it on their portfolio` : ''}`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Theme Manager"
        description="Admin-only: control which themes users can choose, and set the platform default"
        action={<button onClick={() => setCreateModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Theme
        </button>}
      />

      <div className="card mb-6 bg-orange-500/5 border-orange-500/20">
        <p className="text-xs text-gray-400">
          <span className="text-orange-400 font-semibold">Admin only.</span> Changes here affect what every user can choose from. Existing users keep their current theme even if you disable or remove it from the catalog — only new selections are restricted.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes.map(theme => (
          <div key={theme._id} className={`card p-0 overflow-hidden transition-all ${theme.isDefault ? 'border-primary-500 ring-1 ring-primary-500/30' : !theme.isEnabled ? 'opacity-60' : ''}`}>
            <div className="h-3" style={{ background: theme.previewAccent }} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-1.5">
                <h3 className="font-semibold text-white text-sm">{theme.name}</h3>
                <div className="flex gap-1.5">
                  {theme.isPremium && <Badge color="purple">Premium</Badge>}
                  {theme.isDefault && <Badge color="primary">Default</Badge>}
                  <Badge color={theme.isEnabled ? 'green' : 'gray'}>{theme.isEnabled ? 'Enabled' : 'Disabled'}</Badge>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2 line-clamp-2">{theme.description}</p>
              <p className="text-xs text-gray-600 font-mono mb-3">key: {theme.key} · used by {theme.usageCount} user{theme.usageCount !== 1 ? 's' : ''}</p>

              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => handleToggleEnabled(theme)} disabled={busy === theme._id || (theme.isDefault && theme.isEnabled)}
                  className="btn-secondary text-xs px-2.5 py-1" title={theme.isDefault && theme.isEnabled ? 'Default theme cannot be disabled' : ''}>
                  {busy === theme._id ? <Spinner size="sm" /> : theme.isEnabled ? 'Disable' : 'Enable'}
                </button>
                {!theme.isDefault && (
                  <button onClick={() => handleSetDefault(theme)} disabled={busy === theme._id || !theme.isEnabled || theme.isPremium}
                    title={theme.isPremium ? 'Premium themes cannot be the default' : ''}
                    className="btn-secondary text-xs px-2.5 py-1">Set Default</button>
                )}
                <button onClick={() => setEditModal(theme)} className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                <button onClick={() => setDeleteTarget(theme)} disabled={theme.isDefault}
                  className="btn-danger text-xs px-2.5 py-1" title={theme.isDefault ? 'Set a different default first' : ''}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Add Theme to Catalog" size="md">
        <CreateThemeForm availableToAdd={availableToAdd} onSave={handleCreate} onCancel={() => setCreateModal(false)} />
      </Modal>

      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Theme" size="md">
        {editModal && <EditThemeForm theme={editModal} onSave={handleEditSave} onCancel={() => setEditModal(null)} />}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove Theme from Catalog"
        message={`Remove "${deleteTarget?.name}"? ${deleteTarget?.usageCount ? `${deleteTarget.usageCount} user(s) currently use it and will keep it, but it won't be offered as a new choice.` : 'No users currently use it.'}`} />
    </div>
  );
}
