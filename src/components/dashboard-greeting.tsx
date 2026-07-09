import { cn } from '@/lib/utils';

export function DashboardGreeting({
  className,
  name,
}: {
  className?: string;
  name?: string | null;
}) {
  return (
    <h1 className={cn('text-2xl font-semibold tracking-tight md:text-3xl', className)}>
      Welcome back{name ? `, ${name}` : ''}
    </h1>
  );
}
