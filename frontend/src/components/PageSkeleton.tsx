import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-8 py-8">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
