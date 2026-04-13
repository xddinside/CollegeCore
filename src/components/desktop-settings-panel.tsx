'use client';

import { Bell, MonitorCog, RefreshCw, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_DESKTOP_SETTINGS,
  NOTIFICATION_INTERVAL_OPTIONS,
  clampNotificationInterval,
  hasDesktopBridge,
  type DesktopSettings,
} from '@/lib/desktop';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function DesktopSettingsPanel() {
  const [isDesktop] = useState(() => hasDesktopBridge());
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_DESKTOP_SETTINGS);
  const [status, setStatus] = useState<SaveState>('idle');

  useEffect(() => {
    if (!isDesktop || !window.collegeCoreDesktop) {
      return;
    }

    let active = true;

    void window.collegeCoreDesktop.getSettings().then((nextSettings) => {
      if (active) {
        setSettings(nextSettings);
      }
    });

    const unsubscribe = window.collegeCoreDesktop.onSettingsChanged((nextSettings) => {
      if (active) {
        setSettings(nextSettings);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isDesktop]);

  async function updateSettings(nextSettings: Partial<DesktopSettings>) {
    if (!window.collegeCoreDesktop) {
      return;
    }

    setStatus('saving');

    try {
      const savedSettings = await window.collegeCoreDesktop.updateSettings(nextSettings);
      setSettings(savedSettings);
      setStatus('saved');

      window.setTimeout(() => {
        setStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 1500);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-medium tracking-tight">Desktop features</h2>
        <p className="text-sm text-muted-foreground">
          Native controls live here when CollegeCore is opened through the Electron app.
        </p>
      </div>

      {!isDesktop ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-accent/40 p-6">
          <div className="space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <MonitorCog className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium">Desktop-only controls</h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Native notifications, system tray behavior, and the background reminder interval are available
                only inside the desktop app. Your account data stays the same across both platforms.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Bell className="h-4 w-4" />
                    Native notifications
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive native assignment reminders and exam sprint alerts from the desktop app.
                  </p>
                </div>
                <Switch
                  checked={settings.notificationsEnabled}
                  onClick={() => void updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                  aria-label="Toggle native notifications"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MonitorCog className="h-4 w-4" />
                    Minimize to tray
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keep CollegeCore running in the background when the window is minimized or closed.
                  </p>
                </div>
                <Switch
                  checked={settings.minimizeToTray}
                  onClick={() => void updateSettings({ minimizeToTray: !settings.minimizeToTray })}
                  aria-label="Toggle minimize to tray"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-background p-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <RefreshCw className="h-4 w-4" />
                    Reminder check interval
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose how often the desktop app looks for new due reminders while it is running.
                  </p>
                </div>

                <div className="max-w-sm space-y-2">
                  <Label htmlFor="notification-interval">Check every</Label>
                  <Select
                    id="notification-interval"
                    value={String(settings.notificationCheckIntervalMinutes)}
                    onChange={(event) => {
                      const minutes = clampNotificationInterval(Number(event.target.value));
                      void updateSettings({ notificationCheckIntervalMinutes: minutes });
                    }}
                  >
                    {NOTIFICATION_INTERVAL_OPTIONS.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} minutes
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-border bg-[linear-gradient(180deg,#fafaf9,white)] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Timer className="h-4 w-4" />
                Status
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Notifications are{' '}
                <span className="font-medium text-foreground">
                  {settings.notificationsEnabled ? 'on' : 'off'}
                </span>{' '}
                and tray mode is{' '}
                <span className="font-medium text-foreground">
                  {settings.minimizeToTray ? 'enabled' : 'disabled'}
                </span>.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                The app is checking for new reminders every{' '}
                <span className="font-medium text-foreground">
                  {settings.notificationCheckIntervalMinutes} minutes
                </span>.
              </p>

              <div className="mt-5 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                {status === 'saving' && 'Saving your desktop preferences...'}
                {status === 'saved' && 'Desktop preferences saved.'}
                {status === 'error' && 'Could not save desktop preferences. Try again.'}
                {status === 'idle' && 'Changes apply immediately while the desktop app is running.'}
              </div>

              <div className="mt-5">
                <Button variant="outline" onClick={() => void window.collegeCoreDesktop?.dismissNotificationPrompt()}>
                  Mark first-launch prompt as reviewed
                </Button>
              </div>
            </section>
          </aside>
        </div>
      )}
    </section>
  );
}
