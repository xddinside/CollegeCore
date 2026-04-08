export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-9 w-64 rounded-md bg-accent" />
        <div className="h-4 w-48 rounded-md bg-accent" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 rounded-xl bg-accent" />
          <div className="space-y-3">
            <div className="h-16 rounded-lg bg-accent" />
            <div className="h-16 rounded-lg bg-accent" />
            <div className="h-16 rounded-lg bg-accent" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-12 rounded-lg bg-accent" />
          <div className="h-12 rounded-lg bg-accent" />
        </div>
      </div>
    </div>
  );
}
