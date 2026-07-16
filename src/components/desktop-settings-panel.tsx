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
  getDesktopRuntime,
  type DesktopSettings,
} from '@/lib/desktop';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function DesktopSettingsPanel() {
  const [runtime] = useState(() => getDesktopRuntime());
  const isDesktop = runtime.kind === 'electron';
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_DESKTOP_SETTINGS);
  const [status, setStatus] = useState<SaveState>('idle');

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    let active = true;

    void runtime.settings.readState().then((state) => {
      if (active) {
        setSettings(state.settings);
      }
    });

    const unsubscribe = runtime.settings.onChanged((nextSettings) => {
      if (active) {
        setSettings(nextSettings);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isDesktop, runtime]);

  async function updateSettings(nextSettings: Partial<DesktopSettings>) {
    if (runtime.kind !== 'electron') {
      return;
    }

    setStatus('saving');

    try {
      const state = await runtime.settings.apply({ type: 'change', changes: nextSettings });
      setSettings(state.settings);
      setStatus('saved');

      window.setTimeout(() => {
        setStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 1500);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }

  async function handleDismiss() {
    if (runtime.kind !== 'electron') {
      return;
    }

    if (!window.confirm('Dismiss the first-launch notification prompt? You can re-enable it later.')) {
      return;
    }

    try {
      await runtime.settings.apply({ type: 'dismiss-notification-prompt' });
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
    <section className="rounded-lg border border-border bg-muted/30 p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight">Desktop preferences</h2>
        <p className="text-sm text-muted-foreground/80">
          These controls appear when CollegeCore is running in the desktop app.
        </p>
      </div>

      {!isDesktop ? (
        <div className="mt-5 rounded-lg border border-dashed border-border px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <MonitorCog className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-medium text-foreground">Open the desktop app to change native behavior</h3>
              <p className="max-w-2xl text-sm text-muted-foreground/80">
                Notifications, tray behavior, and reminder timing are available only in the Electron app.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-1 overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notifications
              </div>
              <p className="text-sm text-muted-foreground/80">
                Get desktop reminders for upcoming assignments and sprint work.
              </p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => void updateSettings({ notificationsEnabled: checked })}
              aria-label="Toggle native notifications"
            />
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MonitorCog className="h-4 w-4 text-muted-foreground" />
                  Minimize to tray
                </div>
                <p className="text-sm text-muted-foreground/80">
                  Keep CollegeCore running when you minimize the window or close it.
                </p>
              </div>
              <Switch
                checked={settings.minimizeToTray}
                onCheckedChange={(checked) => void updateSettings({ minimizeToTray: checked })}
                aria-label="Toggle minimize to tray"
              />
            </div>
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  Reminder check interval
                </div>
                <p className="text-sm text-muted-foreground/80">
                  Choose how often the app checks for new reminders while it is open.
                </p>
              </div>

              <div className="max-w-sm space-y-1.5">
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

          <div className="border-t border-border bg-muted/30 px-4 py-3">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div
                aria-live="polite"
                aria-atomic="true"
                className="text-sm text-muted-foreground/80"
              >
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

              <Button variant="outline" size="sm" onClick={handleDismiss}>
                Dismiss first-launch prompt
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
