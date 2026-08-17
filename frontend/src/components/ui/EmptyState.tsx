import React from 'react';
import { FolderX } from 'lucide-react';

interface EmptyStateProps { title: string; description: string; action?: React.ReactNode; }

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <div className="rounded-full bg-neutral-100 p-4 mb-4"><FolderX className="h-8 w-8 text-neutral-400" /></div>
    <h3 className="text-lg font-medium text-neutral-900 mb-1">{title}</h3>
    <p className="text-sm text-neutral-500 mb-4 max-w-sm">{description}</p>
    {action}
  </div>
);
