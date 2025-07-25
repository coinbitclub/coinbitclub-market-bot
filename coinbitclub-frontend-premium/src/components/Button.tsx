import React from 'react';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-black border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black shadow-md hover:shadow-blue-500/30',
        destructive: 'bg-black border border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black shadow-md hover:shadow-pink-500/30',
        outline: 'border border-amber-400 bg-black text-amber-400 hover:bg-amber-400 hover:text-black shadow-md hover:shadow-amber-400/30',
        secondary: 'bg-black border border-blue-500 text-blue-500 hover:bg-blue-500/20 shadow-md hover:shadow-blue-500/30',
        ghost: 'text-pink-500 hover:bg-pink-500/20 hover:text-pink-400',
        link: 'text-blue-500 underline-offset-4 hover:underline',
        accent: 'bg-black border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black shadow-md hover:shadow-amber-400/30',
        success: 'bg-black border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black shadow-md hover:shadow-blue-500/30',
        warning: 'bg-black border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black shadow-md hover:shadow-amber-400/30',
        info: 'bg-black border border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black shadow-md hover:shadow-pink-500/30',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 size-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
