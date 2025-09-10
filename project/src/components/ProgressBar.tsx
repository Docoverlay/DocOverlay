import React from 'react';

export interface ProgressBarProps { value?: number; label?: string; indeterminate?: boolean; }

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, indeterminate = false }) => {
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>{label || 'Chargement…'}</span>
        {!indeterminate && typeof value === 'number' ? <span>{pct}%</span> : <span>&nbsp;</span>}
      </div>
      <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
        {indeterminate ? <div className="h-2 w-1/3 bg-pink-500 animate-pulse rounded" /> :
          <div className="h-2 bg-pink-500 transition-all duration-200 rounded" style={{ width: `${pct}%` }} />}
      </div>
    </div>
  );
};

export default ProgressBar;
