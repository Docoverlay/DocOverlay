import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base classes - ALWAYS VISIBLE, no opacity-0 or invisible
  "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white border-transparent hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-white text-gray-900 border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
        danger: "bg-red-600 text-white border-transparent hover:bg-red-700 focus:ring-red-500",
        tertiary: "bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-gray-500",
      },
      size: {
        sm: "h-9 px-3 py-2",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-6 py-2",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "sm",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;