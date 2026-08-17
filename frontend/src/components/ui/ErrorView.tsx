import { AlertTriangle } from 'lucide-react';


interface ErrorViewProps { message: string; onRetry?: () => void; }

export const ErrorView = ({ message, onRetry }: ErrorViewProps) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-medium text-neutral-900 mb-2">Something went wrong</h3>
    <p className="text-sm text-neutral-500 mb-4">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-sm font-medium text-primary hover:text-primary-hover">Try again</button>
    )}
  </div>
);
