import React from 'react';

interface ButtonGroupProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export default function ButtonGroup({ 
  children, 
  align = 'right',
  className 
}: ButtonGroupProps) {
  const alignment = {
    left: 'justify-start',
    center: 'justify-center', 
    right: 'justify-end',
  }[align];

  return (
    <div className={`flex items-center gap-2 ${alignment} ${className || ''}`}>
      {children}
    </div>
  );
}