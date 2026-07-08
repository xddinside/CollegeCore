import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  'Track assignments by due date',
  'Plan exam sprints with sessions',
  'Organize courses and todos',
  'Desktop reminders',
];

export function AnimatedHomeContent() {
  return (
    <div className="flex w-full flex-col items-start">
      <div className="mb-8 landing-enter" style={{ '--landing-enter-delay': '40ms' } as React.CSSProperties}>
        <span className="inline-flex items-center gap-2 text-sm font-medium tracking-tight text-foreground">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            C
          </span>
          CollegeCore
        </span>
      </div>

      <div className="mb-6 landing-enter" style={{ '--landing-enter-delay': '100ms' } as React.CSSProperties}>
        <h1 className="text-balance text-5xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Semester
          <br />
          planning,
          <br />
          <span className="text-muted-foreground">simplified.</span>
        </h1>
      </div>

      <p
        className="landing-enter text-balance mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        style={{ '--landing-enter-delay': '160ms' } as React.CSSProperties}
      >
        Track assignments, study sprints, and subjects in one calm workspace designed for focus.
      </p>

      <ul
        className="landing-enter mb-10 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"
        style={{ '--landing-enter-delay': '190ms' } as React.CSSProperties}
      >
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

      <div
        className="landing-enter flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{ '--landing-enter-delay': '240ms' } as React.CSSProperties}
      >
        <Button render={<Link href="/sign-up" />} size="lg" className="h-12 px-7 text-base">
          Get started
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>

        <Button render={<Link href="/sign-in" />} variant="ghost" size="lg" className="h-12 px-7 text-base">
          Sign in
        </Button>
      </div>
    </div>
  );
}
