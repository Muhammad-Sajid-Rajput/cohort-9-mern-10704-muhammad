import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

/**
 * Animated placeholder for loading asynchronous content.
 */
export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn('animate-pulse rounded-md bg-neutral-200', className)} />
);
