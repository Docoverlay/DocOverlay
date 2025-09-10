import React from 'react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function SecondaryButton({ className = '', children, ...props }: SecondaryButtonProps) {
  const baseClasses = 'min-h-11 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  
  return (
    <button
      type="button"
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}