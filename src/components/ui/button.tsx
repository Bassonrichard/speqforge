import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md';

    const variants = {
      default: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800',
      outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400',
      ghost: 'text-gray-900 hover:bg-gray-100',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    };

    const sizes = {
      default: 'h-10 px-5 py-2.5',
      sm: 'h-9 px-4 text-sm',
      lg: 'h-12 px-8 text-lg',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && <span className="mr-2 animate-spin">⌛</span>}
        {props.children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
