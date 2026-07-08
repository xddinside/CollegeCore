import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-40 rounded-md" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
      </div>

      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  );
}
