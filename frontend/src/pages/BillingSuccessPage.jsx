import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { billingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/shared/UI';

export default function BillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) { setStatus('error'); setErrorMsg('No checkout session found in URL'); return; }

    // The webhook is the real source of truth, but we don't want the user
    // staring at a spinner waiting on webhook delivery — this confirms the
    // exact same session synchronously and applies the same upgrade logic.
    billingAPI.verifySession(sessionId)
      .then(async (r) => {
        if (r.data.plan === 'pro') {
          await refreshUser();
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg('Payment is still processing — this can take a moment. Check Settings shortly.');
        }
      })
      .catch(e => { setStatus('error'); setErrorMsg(e.response?.data?.message || 'Could not verify payment'); });
  }, [searchParams, refreshUser]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="card max-w-sm w-full text-center">
        {status === 'verifying' && (
          <>
            <Spinner size="lg" className="mx-auto mb-4" />
            <h1 className="text-lg font-bold text-white mb-1">Confirming your payment...</h1>
            <p className="text-sm text-gray-400">This only takes a second.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-lg font-bold text-white mb-1">You're on Pro!</h1>
            <p className="text-sm text-gray-400 mb-6">Premium themes are unlocked — switch to them anytime from your dashboard.</p>
            <Link to="/dashboard/themes" className="btn-primary w-full justify-center">Browse Premium Themes</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h1 className="text-lg font-bold text-white mb-1">Almost there</h1>
            <p className="text-sm text-gray-400 mb-6">{errorMsg}</p>
            <Link to="/dashboard/settings" className="btn-secondary w-full justify-center">Go to Settings</Link>
          </>
        )}
      </div>
    </div>
  );
}
