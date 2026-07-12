import React, { useState, useEffect } from 'react';
import { familyAPI } from '../../services/api';
import { ConfirmDialog, EmptyState, Spinner, SectionHeader, FormField, Badge, Avatar, Toggle } from '../../components/shared/UI';
import toast from 'react-hot-toast';

/**
 * This page is intentionally narrow — a family_admin can ONLY invite/remove
 * members and grant/revoke premium within their own group. There is no
 * theme management, no platform user list, no billing control here at
 * all — those simply don't exist on this page, which is how rule 6
 * ("FAMILY_ADMIN must not see global admin theme controls") is satisfied:
 * not by hiding a button, but by this page never importing that code.
 */
export default function FamilyAdminDashboardPage() {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);

  const load = async () => {
    try {
      const { data } = await familyAPI.getMyGroup();
      setGroup(data);
    } catch (e) {
      // 404 here just means this family_admin doesn't have a group yet,
      // which shouldn't normally happen since creating the role and the
      // group happen together — but degrade gracefully either way.
      setGroup(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await familyAPI.inviteMember(group._id, inviteEmail);
      toast.success('Member added to your family group');
      setInviteEmail('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to invite'); } finally { setInviting(false); }
  };

  const handleToggleGrant = async (member) => {
    setBusyMemberId(member.user._id);
    try {
      if (member.isPremiumGranted) {
        await familyAPI.revokePremium(group._id, member.user._id);
        toast.success(`Premium revoked for ${member.user.name}`);
      } else {
        await familyAPI.grantPremium(group._id, member.user._id);
        toast.success(`Premium granted to ${member.user.name}`);
      }
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setBusyMemberId(''); }
  };

  const handleRemove = async () => {
    try {
      await familyAPI.removeMember(group._id, removeTarget.user._id);
      toast.success('Member removed');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  if (!group) {
    return <EmptyState title="No family group found" description="Contact your platform admin if this seems wrong." />;
  }

  const premiumCount = group.members.filter(m => m.isPremiumGranted).length;
  const atCapacity = group.members.length >= group.maxMembers;

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <SectionHeader title={group.name} description="Manage premium access for your own family group" />

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-2xl font-bold text-white">{group.members.length}<span className="text-sm text-gray-500">/{group.maxMembers}</span></p>
          <p className="text-xs text-gray-400 mt-0.5">Members</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-white">{premiumCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">With Premium Access</p>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-3">Invite a Member</h3>
        <form onSubmit={handleInvite} className="flex gap-2">
          <FormField label="" hint={atCapacity ? `Group is at its limit of ${group.maxMembers} members` : 'Must be an existing, registered user'}>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              className="input-field" placeholder="family.member@example.com" disabled={atCapacity} />
          </FormField>
          <button type="submit" disabled={inviting || atCapacity || !inviteEmail} className="btn-primary flex-shrink-0 self-start">
            {inviting ? <Spinner size="sm" /> : 'Invite'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="section-title mb-4">Members</h3>
        {group.members.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No members yet — invite someone above</p>
        ) : (
          <div className="space-y-2">
            {group.members.map(m => (
              <div key={m.user._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.user.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">{m.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {busyMemberId === m.user._id ? <Spinner size="sm" /> : (
                    <Toggle checked={m.isPremiumGranted} onChange={() => handleToggleGrant(m)} label="Premium" />
                  )}
                  <button onClick={() => setRemoveTarget(m)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove}
        title="Remove Family Member" message={`Remove ${removeTarget?.user?.name} from your family group? Their premium access (if any) will also be revoked.`} />
    </div>
  );
}
