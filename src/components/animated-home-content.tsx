import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnimatedHomeContent() {
  return (
    <div className="flex w-full flex-col items-start">
      <div className="mb-8 landing-enter" style={{ animationDelay: '40ms' }}>
        <span className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
          CollegeCore
        </span>
      </div>

      <div className="mb-12 landing-enter" style={{ animationDelay: '100ms' }}>
        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          Semester
          <br />
          planning,
          <br />
          <span className="text-muted-foreground">simplified.</span>
        </h1>
      </div>

      <p
        className="landing-enter text-balance mb-14 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        style={{ animationDelay: '160ms' }}
      >
        Track assignments, study sprints, and subjects in one calm workspace designed for focus.
      </p>

      <div
        className="landing-enter flex flex-col gap-4 sm:flex-row sm:items-center"
        style={{ animationDelay: '220ms' }}
      >
        <Link href="/sign-up">
          <Button size="lg" className="h-14 px-8 text-base">
            Get started
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>

        <Link href="/sign-in">
          <Button variant="ghost" size="lg" className="h-14 px-8 text-base">
            Sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
