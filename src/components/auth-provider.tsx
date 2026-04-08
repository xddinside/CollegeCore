'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';
import { QueryProvider } from '@/components/query-provider';

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <QueryProvider>{children}</QueryProvider>
    </ClerkProvider>
  );
}
