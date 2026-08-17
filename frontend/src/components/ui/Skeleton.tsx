import { cn } from '../../utils/cn';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-neutral-200', className)} />
);
