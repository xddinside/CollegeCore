import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentSemester } from '@/lib/actions';
import { DashboardShell } from '@/components/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const semester = await getCurrentSemester(userId);

  if (!semester) {
    redirect('/onboarding');
  }

  return <DashboardShell semesterName={semester.name}>{children}</DashboardShell>;
}
