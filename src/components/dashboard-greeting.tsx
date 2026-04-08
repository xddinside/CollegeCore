'use client';

import { useUser } from '@clerk/nextjs';

export function DashboardGreeting() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <h1 className="text-2xl font-medium tracking-tight md:text-3xl">Welcome back</h1>;
  }

  const name = user?.firstName || user?.fullName || 'there';

  return <h1 className="text-2xl font-medium tracking-tight md:text-3xl">Welcome back, {name}</h1>;
}
