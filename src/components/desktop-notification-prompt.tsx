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
    <section className="rounded-2xl border border-border bg-[linear-gradient(135deg,#fafaf9,white)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Desktop reminders are ready</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              CollegeCore can send native assignment and sprint alerts from the desktop app. Review the
              notification settings once so you can keep them on, tune the check interval, or turn them off.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void openSettings()}>
              <LaptopMinimal className="h-4 w-4" />
              Open desktop settings
            </Button>
            <Button variant="ghost" onClick={() => void dismiss()}>
              Maybe later
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="self-start"
          aria-label="Dismiss desktop notification prompt"
          onClick={() => void dismiss()}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
