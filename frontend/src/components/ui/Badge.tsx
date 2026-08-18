import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Pill badge indicator for labels and categories.
 */
export const Badge = ({ children, className }: BadgeProps) => (
  <span className={cn('inline-flex items-center rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-semibold text-primary', className)}>
    {children}
  </span>
);
