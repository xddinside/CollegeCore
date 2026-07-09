'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './globals.css';
import { interDisplay, interVariable } from './fonts';

export default function GlobalErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`dark h-full ${interVariable.variable} ${interDisplay.variable}`}>
      <body className="h-full bg-background text-foreground antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="rounded-full bg-accent p-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-6 text-2xl font-medium tracking-tight">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            We hit an unexpected issue. Try again, or refresh the page if the problem persists.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={() => unstable_retry()}>Try again</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
