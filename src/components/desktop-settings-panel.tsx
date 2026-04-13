'use client';

import { Bell, MonitorCog, RefreshCw } from 'lucide-react';
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
        <h2 className="text-lg font-medium tracking-tight">Desktop preferences</h2>
        <p className="text-sm text-muted-foreground">
          These controls appear when CollegeCore is running in the desktop app.
        </p>
      </div>

      {!isDesktop ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-accent/35 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background text-muted-foreground">
              <MonitorCog className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Open the desktop app to change native behavior</h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Notifications, tray behavior, and reminder timing are available only in the Electron app.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-1 overflow-hidden rounded-xl border border-border bg-background">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bell className="h-4 w-4" />
                Notifications
              </div>
              <p className="text-sm text-muted-foreground">
                Get desktop reminders for upcoming assignments and sprint work.
              </p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onClick={() => void updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              aria-label="Toggle native notifications"
            />
          </div>

          <div className="border-t border-border px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MonitorCog className="h-4 w-4" />
                  Minimize to tray
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep CollegeCore running when you minimize the window or close it.
                </p>
              </div>
              <Switch
                checked={settings.minimizeToTray}
                onClick={() => void updateSettings({ minimizeToTray: !settings.minimizeToTray })}
                aria-label="Toggle minimize to tray"
              />
            </div>
          </div>

          <div className="border-t border-border px-5 py-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <RefreshCw className="h-4 w-4" />
                  Reminder check interval
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose how often the app checks for new reminders while it is open.
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
          </div>

          <div className="border-t border-border bg-accent/30 px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 text-sm text-muted-foreground">
                {status === 'saving' && <p>Saving desktop preferences...</p>}
                {status === 'saved' && <p>Desktop preferences saved.</p>}
                {status === 'error' && <p>We could not save your changes. Try again.</p>}
                {status === 'idle' && (
                  <p>
                    Notifications are {settings.notificationsEnabled ? 'on' : 'off'}, tray mode is{' '}
                    {settings.minimizeToTray ? 'enabled' : 'off'}, and reminders are checked every{' '}
                    {settings.notificationCheckIntervalMinutes} minutes.
                  </p>
                )}
              </div>

              <Button variant="outline" onClick={() => void window.collegeCoreDesktop?.dismissNotificationPrompt()}>
                Dismiss first-launch prompt
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
