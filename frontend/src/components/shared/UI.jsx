import React from 'react';

// Spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-primary-500 border-t-transparent rounded-full animate-spin ${className}`} />
  );
};

// Full-page loader
export const PageLoader = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <Spinner size="xl" />
  </div>
);

// Empty state
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-500" />
    </div>}
    <h3 className="text-base font-semibold text-gray-300 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
    {action}
  </div>
);

// Modal wrapper
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-dark-600 flex-shrink-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// Confirm dialog
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', danger = true }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-400 mb-5">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmText}</button>
    </div>
  </Modal>
);

// Form field wrapper
export const FormField = ({ label, required, error, children, hint }) => (
  <div className="space-y-1">
    {label && <label className="label">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>}
    {children}
    {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

// Stats card
export const StatCard = ({ icon: Icon, label, value, color = 'primary', trend }) => {
  const colors = {
    primary: 'bg-primary-500/10 text-primary-400',
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400',
    red: 'bg-red-500/10 text-red-400',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
        {trend && <p className="text-xs text-green-400 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
};

// Badge
export const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-500/20 text-gray-300',
    green: 'bg-green-500/20 text-green-300',
    red: 'bg-red-500/20 text-red-300',
    blue: 'bg-blue-500/20 text-blue-300',
    purple: 'bg-purple-500/20 text-purple-300',
    primary: 'bg-primary-500/20 text-primary-300',
    orange: 'bg-orange-500/20 text-orange-300',
    teal: 'bg-teal-500/20 text-teal-300',
  };
  return <span className={`badge ${colors[color]}`}>{children}</span>;
};

// Toggle switch
export const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-dark-500'}`} />
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
    {label && <span className="text-sm text-gray-300">{label}</span>}
  </label>
);

// Section header with action
export const SectionHeader = ({ title, description, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
    </div>
    {action}
  </div>
);

// Avatar
export const Avatar = ({ src, name, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  return src
    ? <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-dark-600`} />
    : <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-dark-600`}>{initials}</div>;
};

// Image upload button
export const ImageUploadButton = ({ onUpload, loading, className = '' }) => (
  <label className={`cursor-pointer ${className}`}>
    <input type="file" accept="image/*" className="sr-only" onChange={onUpload} />
    <div className="btn-secondary">
      {loading ? <Spinner size="sm" /> : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )}
      Upload
    </div>
  </label>
);
