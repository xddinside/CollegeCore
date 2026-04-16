import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCachedCurrentSemester } from '@/lib/actions';
import { AnimatedHomeContent } from '@/components/animated-home-content';

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    const semester = await getCachedCurrentSemester(userId);

    if (semester) {
      redirect('/dashboard');
    }

    redirect('/onboarding');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,120,120,0.08),transparent)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20 md:px-16 lg:px-24">
        <AnimatedHomeContent />
      </div>
    </main>
  );
}
