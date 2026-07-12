import React, { useState, useEffect } from 'react';
import { superAdminAPI, adminAPI } from '../../services/api';
import { Modal, ConfirmDialog, Spinner, SectionHeader, FormField, Badge, Avatar } from '../../components/shared/UI';
import toast from 'react-hot-toast';

function PromoteForm({ onSave, onCancel }) {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reuse the existing admin user search (GET /api/admin/users?search=) to
  // find the target by email before promoting — confirms the account
  // exists and isn't already admin-tier before submitting.
  const handleSearch = async () => {
    if (!email) return;
    setSearching(true);
    setFound(null);
    try {
      const { data } = await adminAPI.getUsers({ search: email, limit: 5 });
      const match = data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!match) { toast.error('No user found with that exact email'); return; }
      if (['admin', 'super_admin'].includes(match.role)) { toast.error('This account is already admin-tier'); return; }
      setFound(match);
    } finally { setSearching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!found) { toast.error('Search for and confirm a user first'); return; }
    setSaving(true);
    try { await onSave(found._id); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="User's Email" required>
        <div className="flex gap-2">
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setFound(null); }} className="input-field" placeholder="user@example.com" />
          <button type="button" onClick={handleSearch} disabled={searching} className="btn-secondary flex-shrink-0">
            {searching ? <Spinner size="sm" /> : 'Find'}
          </button>
        </div>
      </FormField>

      {found && (
        <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
          <Avatar name={found.name} size="sm" />
          <div>
            <p className="text-sm text-gray-200">{found.name}</p>
            <p className="text-xs text-gray-500">{found.email} · currently <Badge color="gray">{found.role}</Badge></p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2 justify-end border-t border-dark-600">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving || !found} className="btn-primary">{saving ? <Spinner size="sm" /> : 'Promote to Admin'}</button>
      </div>
    </form>
  );
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoteModal, setPromoteModal] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState(null);

  const load = async () => {
    try {
      const { data } = await superAdminAPI.listAdmins();
      setAdmins(data.admins);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to load admins'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handlePromote = async (userId) => {
    try {
      await superAdminAPI.promote(userId);
      toast.success('User promoted to admin');
      setPromoteModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to promote'); throw e; }
  };

  const handleDemote = async () => {
    try {
      await superAdminAPI.demote(demoteTarget._id);
      toast.success(`${demoteTarget.name} is no longer an admin`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to demote'); }
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Manage Admins"
        description="Super admin only — create or remove platform administrators"
        action={<button onClick={() => setPromoteModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Promote a User
        </button>}
      />

      <div className="card mb-6 bg-purple-500/5 border-purple-500/20">
        <p className="text-xs text-gray-400">
          <span className="text-purple-400 font-semibold">Super admin only.</span> Admins can manage themes, users, and portfolio settings platform-wide, but cannot create or remove other admins, and can never override super_admin ownership.
        </p>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Last Login</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {admins.map(a => (
              <tr key={a._id} className="hover:bg-dark-700/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-white">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge color={a.role === 'super_admin' ? 'purple' : 'orange'}>{a.role}</Badge>
                </td>
                <td className="px-5 py-3 text-xs text-gray-400 hidden sm:table-cell">
                  {a.lastLogin ? new Date(a.lastLogin).toLocaleDateString() : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  {a.role === 'admin' ? (
                    <button onClick={() => setDemoteTarget(a)} className="btn-danger text-xs px-2.5 py-1">Demote</button>
                  ) : (
                    <span className="text-xs text-gray-600">Platform Owner</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={promoteModal} onClose={() => setPromoteModal(false)} title="Promote a User to Admin" size="md">
        <PromoteForm onSave={handlePromote} onCancel={() => setPromoteModal(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!demoteTarget} onClose={() => setDemoteTarget(null)} onConfirm={handleDemote}
        title="Demote Admin" message={`Remove admin privileges from ${demoteTarget?.name}? They'll become a regular user.`} />
    </div>
  );
}
