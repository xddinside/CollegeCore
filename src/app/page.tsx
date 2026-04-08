import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentSemester } from '@/lib/actions';
import { AnimatedHomeContent } from '@/components/animated-home-content';

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    const semester = await getCurrentSemester(userId);

    if (semester) {
      redirect('/dashboard');
    }

    redirect('/onboarding');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,120,120,0.08),transparent)]" />
      
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20 md:px-12">
        <AnimatedHomeContent />
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
