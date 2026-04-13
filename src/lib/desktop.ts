export type DesktopSettings = {
  notificationsEnabled: boolean;
  minimizeToTray: boolean;
  notificationCheckIntervalMinutes: number;
  hasSeenNotificationPrompt: boolean;
};

export type DesktopSettingsUpdate = Partial<
  Pick<DesktopSettings, 'notificationsEnabled' | 'minimizeToTray' | 'notificationCheckIntervalMinutes'>
>;

export type DesktopLaunchState = {
  settings: DesktopSettings;
  shouldShowNotificationPrompt: boolean;
};

export type DesktopReminderCandidate = {
  id: string;
  title: string;
  body: string;
  route?: string;
};

export const NOTIFICATION_INTERVAL_OPTIONS = [5, 10, 15, 30, 60] as const;

export const DEFAULT_DESKTOP_SETTINGS: DesktopSettings = {
  notificationsEnabled: true,
  minimizeToTray: false,
  notificationCheckIntervalMinutes: 15,
  hasSeenNotificationPrompt: false,
};

export function clampNotificationInterval(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_DESKTOP_SETTINGS.notificationCheckIntervalMinutes;
  }

  return Math.min(60, Math.max(5, Math.round(value)));
}

export function hasDesktopBridge() {
  return typeof window !== 'undefined' && typeof window.collegeCoreDesktop !== 'undefined';
}
