import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentSemester } from '@/lib/academic/server/read-actions';
import { AnimatedHomeContent } from '@/components/animated-home-content';

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    const semester = await getCurrentSemester();

    if (semester) {
      redirect('/dashboard');
    }

    redirect('/onboarding');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[700px] translate-x-1/3 translate-y-1/3 rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-14 md:px-16 md:py-16 lg:px-24">
        <AnimatedHomeContent />
      </div>
    </main>
  );
}
