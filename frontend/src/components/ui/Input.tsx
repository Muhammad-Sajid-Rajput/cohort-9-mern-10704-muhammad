import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full text-left group">
        {label && <label className="block text-sm font-semibold tracking-wide text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-base text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0 focus:border-primary focus:bg-surface transition-all disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus:border-error',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm font-medium text-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
