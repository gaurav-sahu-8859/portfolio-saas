import React, { useState, useEffect } from 'react';
import { adminFamilyAPI, familyAPI } from '../../services/api';
import { Modal, ConfirmDialog, EmptyState, Spinner, SectionHeader, FormField, Badge, Avatar } from '../../components/shared/UI';
import toast from 'react-hot-toast';

function CreateGroupForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', ownerEmail: '', maxMembers: 5 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.ownerEmail) { toast.error('Fill in all fields'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Group Name" required>
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Sahu Family" />
      </FormField>
      <FormField label="Family Admin's Email" required hint="Must be an existing, registered user. They will be promoted to family_admin.">
        <input type="email" value={form.ownerEmail} onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))} className="input-field" placeholder="parent@example.com" />
      </FormField>
      <FormField label="Max Members">
        <input type="number" min="1" max="50" value={form.maxMembers} onChange={e => setForm(p => ({ ...p, maxMembers: Number(e.target.value) }))} className="input-field" />
      </FormField>
      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : 'Create Group'}</button>
      </div>
    </form>
  );
}

function GroupDetailModal({ group, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    familyAPI.getUsage(group._id).then(r => setDetail(r.data)).catch(() => toast.error('Failed to load group')).finally(() => setLoading(false));
  }, [group._id]);

  return (
    <Modal isOpen={!!group} onClose={onClose} title={group.name} size="md">
      {loading ? <div className="flex justify-center py-10"><Spinner size="lg" /></div> : detail && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{detail.memberCount} / {detail.maxMembers} members</span>
            <span>{detail.premiumGrantedCount} with premium</span>
          </div>
          <div className="space-y-2">
            {detail.members.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No members yet</p>
            ) : detail.members.map(m => (
              <div key={m.user._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar name={m.user.name} size="sm" />
                  <div>
                    <p className="text-sm text-gray-200">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.user.email}</p>
                  </div>
                </div>
                <Badge color={m.isPremiumGranted ? 'primary' : 'gray'}>{m.isPremiumGranted ? 'Premium' : 'Free'}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminFamilyGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [viewGroup, setViewGroup] = useState(null);

  const load = async () => {
    try {
      const { data } = await adminFamilyAPI.listAll();
      setGroups(data.groups);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to load groups'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload) => {
    try {
      await adminFamilyAPI.create(payload);
      toast.success('Family group created — owner promoted to family_admin');
      setCreateModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create group'); throw e; }
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Family Groups"
        description="Admin oversight — every family group on the platform. Creating a group promotes its owner to family_admin."
        action={<button onClick={() => setCreateModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Group
        </button>}
      />

      {groups.length === 0 ? (
        <EmptyState title="No family groups yet" description="Create one by promoting a trusted user to family_admin"
          action={<button onClick={() => setCreateModal(true)} className="btn-primary">Create Group</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map(g => (
            <div key={g._id} className="card hover:border-dark-400 transition-all cursor-pointer" onClick={() => setViewGroup(g)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">{g.name}</h3>
                <Badge color="teal">{g.members.length}/{g.maxMembers}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Avatar name={g.owner?.name} size="sm" />
                <div>
                  <p className="text-xs text-gray-300">{g.owner?.name}</p>
                  <p className="text-xs text-gray-500">{g.owner?.email}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{g.members.filter(m => m.isPremiumGranted).length} member(s) with premium access</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Family Group" size="md">
        <CreateGroupForm onSave={handleCreate} onCancel={() => setCreateModal(false)} />
      </Modal>

      {viewGroup && <GroupDetailModal group={viewGroup} onClose={() => setViewGroup(null)} />}
    </div>
  );
}
