import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string; // Obligatoire pour aria-label
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'danger';
}

export default function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'default',
  className,
  ...props
}: IconButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed aspect-square';
  
  const sizes = {
    sm: 'min-h-8 w-8',
    md: 'min-h-10 w-10', 
    lg: 'min-h-11 w-11',
  }[size];

  const variants = {
    default: 'text-neutral-700 bg-transparent hover:bg-neutral-100 focus:ring-neutral-400',
    danger: 'text-danger-600 bg-transparent hover:bg-danger-50 focus:ring-danger-400',
  }[variant];

  return (
    <button
      type="button"
      className={`${base} ${sizes} ${variants} ${className || ''}`}
      aria-label={label}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}