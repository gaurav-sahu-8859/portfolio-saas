import React from 'react';
import { Link } from 'react-router-dom';

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="card max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h1 className="text-lg font-bold text-white mb-1">Checkout canceled</h1>
        <p className="text-sm text-gray-400 mb-6">No charge was made. You can upgrade anytime from the pricing page.</p>
        <div className="flex gap-3">
          <Link to="/pricing" className="btn-primary flex-1 justify-center">Back to Pricing</Link>
          <Link to="/dashboard" className="btn-secondary flex-1 justify-center">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
