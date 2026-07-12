import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, SectionHeader, Avatar, Badge, ConfirmDialog } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const ROLE_BADGE_COLOR = { super_admin: 'purple', admin: 'orange', family_admin: 'teal', user: 'gray' };

export function AdminUsersPage() {
  const { isSuperAdmin } = useAuth();
  const [data, setData] = useState({ users: [], total: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggleId, setToggleId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetch = async (q = search, p = 1) => {
    setLoading(true);
    try {
      const { data: res } = await adminAPI.getUsers({ search: q, page: p, limit: 20 });
      setData(res);
    } catch { toast.error('Failed to load users'); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleToggle = async (id) => {
    try {
      const { data: res } = await adminAPI.toggleUserStatus(id);
      setData(prev => ({ ...prev, users: prev.users.map(u => u._id === id ? { ...u, isActive: res.isActive } : u) }));
      toast.success(res.message);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setToggleId(null);
  };

  const handleDelete = async () => {
    try {
      await adminAPI.deleteUser(deleteId);
      setData(prev => ({ ...prev, users: prev.users.filter(u => u._id !== deleteId), total: prev.total - 1 }));
      toast.success('User deleted');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="All Users" description={`${data.total} total users`} />

      <div className="mb-4 flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetch(search)}
          className="input-field max-w-xs" placeholder="Search by name or email..." />
        <button onClick={() => fetch(search)} className="btn-secondary">Search</button>
        {search && <button onClick={() => { setSearch(''); fetch(''); }} className="btn-secondary text-xs">Clear</button>}
      </div>

      {loading ? <div className="flex justify-center pt-20"><Spinner size="lg" /></div> : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {data.users.map(user => (
                <tr key={user._id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email} · @{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <Badge color={ROLE_BADGE_COLOR[user.role] || 'gray'}>{user.role}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 hidden sm:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <Badge color={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {/* Mirrors the backend exactly: super_admin is never
                        touchable here; a plain admin is only touchable by
                        a super_admin viewer; family_admin and user are
                        manageable by any admin-tier viewer. Showing a
                        button that the API would reject anyway is worse
                        than not showing it. */}
                    {user.role !== 'super_admin' && (user.role !== 'admin' || isSuperAdmin) && (
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => setToggleId(user._id)}
                          className="btn-secondary text-xs px-2.5 py-1">
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setDeleteId(user._id)} className="btn-danger text-xs px-2.5 py-1">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.users.length === 0 && <p className="text-center text-gray-500 text-sm py-10">No users found</p>}
        </div>
      )}

      <ConfirmDialog isOpen={!!toggleId} onClose={() => setToggleId(null)} onConfirm={() => handleToggle(toggleId)}
        title="Toggle User Status" message="Are you sure you want to change this user's status?" confirmText="Confirm" danger={false} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete User" message="This will permanently delete the user and ALL their data. This cannot be undone." />
    </div>
  );
}

export function AdminPortfoliosPage() {
  const [data, setData] = useState({ portfolios: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getPortfolios().then(r => setData(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Published Portfolios" description={`${data.total} portfolios live`} />
      {loading ? <div className="flex justify-center pt-20"><Spinner size="lg" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.portfolios.map(p => (
            <div key={p._id} className="card hover:border-dark-400 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <Avatar src={p.profilePicture} name={p.fullName} size="md" />
                <div>
                  <h3 className="font-semibold text-white text-sm">{p.fullName || p.user?.name}</h3>
                  <p className="text-xs text-gray-400">{p.title || 'No title set'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.bio || 'No bio'}</p>
              <div className="flex items-center justify-between pt-3 border-t border-dark-600">
                <span className="text-xs text-gray-500">{p.views} views</span>
                <a href={`/${p.user?.username}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary-400 hover:text-primary-300">/{p.user?.username} ↗</a>
              </div>
            </div>
          ))}
          {data.portfolios.length === 0 && <p className="text-gray-500 text-sm col-span-3 text-center py-10">No published portfolios yet</p>}
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
