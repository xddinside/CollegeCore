import { Skeleton } from '@/components/ui/skeleton';

export default function TodosLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32 rounded-md" />
        <Skeleton className="h-4 w-40 rounded-md" />
      </div>

      <Skeleton className="h-24 rounded-lg" />

      <div className="space-y-1">
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
      </div>
    </div>
  );
}
