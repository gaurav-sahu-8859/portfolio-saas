import { useState, useEffect } from 'react';
import { adminPaymentAPI } from '../../services/api';
import { Modal, EmptyState, Spinner, SectionHeader, Badge, Avatar } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const STATUS_TABS = ['pending', 'approved', 'rejected', 'all'];
const formatRupees = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN')}`;

function ReviewModal({ verification, onClose, onDone }) {
  const [adminNote, setAdminNote] = useState('');
  const [busy, setBusy] = useState(''); // '' | 'approve' | 'reject'
  if (!verification) return null;

  const act = async (action) => {
    setBusy(action);
    try {
      await (action === 'approve' ? adminPaymentAPI.approve(verification._id, adminNote) : adminPaymentAPI.reject(verification._id, adminNote));
      toast.success(action === 'approve' ? 'Approved — user upgraded to Pro' : 'Rejected');
      onDone();
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setBusy(''); }
  };

  return (
    <Modal isOpen={!!verification} onClose={onClose} title="Review UPI Payment Claim" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={verification.user?.name} size="sm" />
          <div>
            <p className="text-sm font-medium text-white">{verification.user?.name}</p>
            <p className="text-xs text-gray-500">{verification.user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-dark-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Amount claimed</p>
            <p className="text-white font-semibold">
              {formatRupees(verification.amount)}
              {verification.discountAmount > 0 && <span className="text-xs text-gray-500 font-normal"> (was {formatRupees(verification.originalAmount)})</span>}
            </p>
          </div>
          <div className="bg-dark-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">For</p>
            <p className="text-white font-semibold">{verification.purchasedTheme}</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-3 col-span-2">
            <p className="text-xs text-gray-500 mb-1">UTR / Transaction ID</p>
            <p className="text-white font-mono text-xs">{verification.utr || '— not provided —'}</p>
          </div>
        </div>

        {verification.note && (
          <div>
            <p className="text-xs text-gray-500 mb-1">User's note</p>
            <p className="text-sm text-gray-300 bg-dark-700 rounded-lg p-3">{verification.note}</p>
          </div>
        )}

        {verification.screenshotUrl ? (
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment screenshot</p>
            <a href={verification.screenshotUrl} target="_blank" rel="noreferrer">
              <img src={verification.screenshotUrl} alt="Payment screenshot" className="w-full max-h-80 object-contain rounded-lg border border-dark-500 bg-dark-900" />
            </a>
          </div>
        ) : (
          <p className="text-xs text-gray-600">No screenshot was submitted.</p>
        )}

        {verification.status === 'pending' ? (
          <>
            <div>
              <label className="label">Admin note (optional)</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
                className="input-field resize-none" placeholder="Visible to the user if you reject — explain why, or leave a note for your own records either way." />
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-dark-600">
              <button onClick={() => act('reject')} disabled={!!busy} className="btn-danger">
                {busy === 'reject' ? <Spinner size="sm" /> : 'Reject'}
              </button>
              <button onClick={() => act('approve')} disabled={!!busy} className="btn-primary">
                {busy === 'approve' ? <Spinner size="sm" /> : 'Approve & Upgrade to Pro'}
              </button>
            </div>
          </>
        ) : (
          <div className="pt-2 border-t border-dark-600 text-xs text-gray-500">
            {verification.status === 'approved' ? 'Approved' : 'Rejected'} by {verification.reviewedBy?.name || 'an admin'} on {new Date(verification.reviewedAt).toLocaleString()}
            {verification.adminNote && <p className="mt-1 text-gray-400">Note: {verification.adminNote}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ClaimsTab() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(null);

  const load = async (status = statusFilter) => {
    setLoading(true);
    try {
      const { data } = await adminPaymentAPI.listVerifications(status);
      setVerifications(data.verifications);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  return (
    <>
      <div className="flex gap-2 mb-5">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center pt-20"><Spinner size="lg" /></div> :
        verifications.length === 0 ? (
          <EmptyState title={`No ${statusFilter === 'all' ? '' : statusFilter} verifications`} description="UPI payment claims submitted from the Pricing page will appear here" />
        ) : (
          <div className="space-y-3">
            {verifications.map(v => (
              <button key={v._id} onClick={() => setReviewing(v)} className="card w-full flex items-center justify-between gap-4 flex-wrap text-left hover:border-dark-400 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {v.screenshotUrl
                    ? <img src={v.screenshotUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-dark-500 flex-shrink-0" />
                    : <Avatar name={v.user?.name} size="sm" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{v.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{v.user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRupees(v.amount)}{v.discountAmount > 0 && <span className="text-gray-600"> (discounted)</span>}
                      {v.utr && <span className="font-mono ml-2">· UTR {v.utr}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color={v.status === 'approved' ? 'green' : v.status === 'rejected' ? 'red' : 'orange'}>{v.status}</Badge>
                  <span className="text-xs text-primary-400">Review →</span>
                </div>
              </button>
            ))}
          </div>
        )
      }

      <ReviewModal verification={reviewing} onClose={() => setReviewing(null)} onDone={() => load()} />
    </>
  );
}

function HistoryTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminPaymentAPI.getHistory()
      .then(r => setPayments(r.data.payments))
      .catch((e) => toast.error(e.response?.data?.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;
  if (payments.length === 0) return <EmptyState title="No payments yet" description="Razorpay and Manual UPI payments will both show up here once you have some" />;

  return (
    <div className="card p-0 overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-dark-600">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Transaction</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p._id} className="border-b border-dark-700 last:border-0">
              <td className="px-4 py-3">
                <p className="text-sm text-gray-200">{p.user?.name || '—'}</p>
                <p className="text-xs text-gray-500">{p.user?.email}</p>
              </td>
              <td className="px-4 py-3">
                <Badge color={p.method === 'razorpay' ? 'primary' : 'teal'}>{p.method === 'razorpay' ? 'Razorpay' : 'Manual UPI'}</Badge>
              </td>
              <td className="px-4 py-3 text-sm text-gray-200">
                {formatRupees(p.amount)}
                {p.discountAmount > 0 && <span className="text-xs text-gray-500"> (−{formatRupees(p.discountAmount)})</span>}
              </td>
              <td className="px-4 py-3">
                <Badge color={p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'orange'}>{p.status}</Badge>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400 font-mono hidden md:table-cell">{p.transactionId || '—'}</td>
              <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{new Date(p.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPaymentVerificationsPage() {
  const [tab, setTab] = useState('claims'); // 'claims' | 'history'

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Payments" description="Review manual UPI claims, or see the full payment history across both Razorpay and Manual UPI" />

      <div className="flex gap-2 mb-5 border-b border-dark-600">
        {[['claims', 'UPI Claims'], ['history', 'Payment History']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`text-sm px-3 pb-2.5 -mb-px border-b-2 transition-colors ${tab === id ? 'border-primary-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'claims' ? <ClaimsTab /> : <HistoryTab />}
    </div>
  );
}
