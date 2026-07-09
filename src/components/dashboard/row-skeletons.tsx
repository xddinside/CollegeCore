export function AssignmentRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="row-enter flex items-center gap-3 px-3 py-2.5"
      style={{ ['--row-enter-delay' as string]: `${delay}ms` }}
    >
      <div className="h-4 w-4 animate-skeleton rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3.5 w-2/3 animate-skeleton rounded" />
        <div className="h-3 w-1/2 animate-skeleton rounded opacity-70" />
      </div>
      <div className="hidden h-3 w-12 animate-skeleton rounded sm:block" />
      <div className="hidden h-3 w-10 animate-skeleton rounded sm:block" />
      <div className="h-6 w-6 animate-skeleton rounded-md" />
    </div>
  );
}

export function TodoRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="row-enter flex items-center gap-3 px-3 py-2.5"
      style={{ ['--row-enter-delay' as string]: `${delay}ms` }}
    >
      <div className="h-3.5 w-3.5 animate-skeleton rounded-sm" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3.5 w-3/4 animate-skeleton rounded" />
        <div className="h-3 w-1/3 animate-skeleton rounded opacity-70" />
      </div>
      <div className="h-6 w-6 animate-skeleton rounded-md" />
    </div>
  );
}

export function SubjectCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="row-enter space-y-3 rounded-lg border border-border bg-muted/40 p-4"
      style={{ ['--row-enter-delay' as string]: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-skeleton rounded-md" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 animate-skeleton rounded" />
          <div className="h-3 w-16 animate-skeleton rounded opacity-70" />
        </div>
      </div>
      <div className="h-1 w-full animate-skeleton rounded-full" />
    </div>
  );
}

export function SprintRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="row-enter flex items-center gap-3 px-3 py-3"
      style={{ ['--row-enter-delay' as string]: `${delay}ms` }}
    >
      <div className="h-4 w-4 animate-skeleton rounded-sm" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3.5 w-40 animate-skeleton rounded" />
        <div className="h-3 w-32 animate-skeleton rounded opacity-70" />
      </div>
      <div className="h-7 w-20 animate-skeleton rounded-md" />
    </div>
  );
}
