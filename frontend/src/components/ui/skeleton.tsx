import { cn } from '@/utils/cn';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-bento-sm bg-ink/6', className)}
      {...props}
    />
  );
}

export { Skeleton };
