import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function PrimaryButton({ className = '', children, ...props }: PrimaryButtonProps) {
  const baseClasses = 'min-h-11 px-4 py-2 rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  
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