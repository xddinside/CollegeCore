import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';
import { getCurrentSemester } from '@/lib/actions';

function HomePageLoading() {
  return (
    <div className="flex w-full flex-col items-start">
      <div className="mb-8 h-6 w-24 rounded-md bg-accent" />
      <div className="mb-12 space-y-4">
        <div className="h-16 w-80 rounded-md bg-accent" />
        <div className="h-16 w-96 rounded-md bg-accent" />
      </div>
      <div className="mb-14 h-6 w-96 max-w-xl rounded-md bg-accent" />
      <div className="flex gap-4">
        <div className="h-14 w-36 rounded-md bg-accent" />
        <div className="h-14 w-24 rounded-md bg-accent" />
      </div>
    </div>
  );
}

const AnimatedHomeContent = React.lazy(() =>
  import('@/components/animated-home-content').then((mod) => ({ default: mod.AnimatedHomeContent }))
);

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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,120,120,0.08),transparent)]" />
      
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20 md:px-16 lg:px-24">
        <Suspense fallback={<HomePageLoading />}>
          <AnimatedHomeContent />
        </Suspense>
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
