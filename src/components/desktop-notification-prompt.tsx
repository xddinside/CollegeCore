'use client';

import { Bell, LaptopMinimal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { hasDesktopBridge } from '@/lib/desktop';

export function DesktopNotificationPrompt() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasDesktopBridge() || !window.collegeCoreDesktop) {
      return;
    }

    let active = true;

    void window.collegeCoreDesktop.getLaunchState().then((launchState) => {
      if (active) {
        setVisible(launchState.shouldShowNotificationPrompt);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!visible) {
    return null;
  }

  async function dismiss() {
    await window.collegeCoreDesktop?.dismissNotificationPrompt();
    setVisible(false);
  }

  async function openSettings() {
    await dismiss();
    router.push('/dashboard/settings');
  }

  return (
    <section className="flex items-start justify-between gap-4 rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
          <Bell className="h-3.5 w-3.5" />
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Desktop reminders are ready</p>
            <p className="text-xs text-muted-foreground/80">
              Native assignment and sprint alerts from the desktop app.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void openSettings()} size="sm">
              <LaptopMinimal className="h-3.5 w-3.5" />
              Open desktop settings
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void dismiss()}>
              Maybe later
            </Button>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0"
        aria-label="Dismiss desktop notification prompt"
        onClick={() => void dismiss()}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </section>
  );
}
