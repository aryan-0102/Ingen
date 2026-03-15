import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'circle' | 'row';
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({
  variant = 'text',
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <div className={cn('space-y-4', className)}>
        {items.map((i) => (
          <div
            key={i}
            className="skeleton rounded-xl h-[180px] w-full"
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={cn('flex gap-3', className)}>
        {items.map((i) => (
          <div
            key={i}
            className="skeleton rounded-full w-10 h-10 shrink-0"
          />
        ))}
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className={cn('space-y-3', className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton rounded-full w-10 h-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton rounded h-4 w-3/4" />
              <div className="skeleton rounded h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: text
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((i) => (
        <div
          key={i}
          className="skeleton rounded h-4"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}
