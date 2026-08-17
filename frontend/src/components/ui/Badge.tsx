import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn('inline-flex items-center rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-semibold text-primary', className)}>
    {children}
  </span>
);
