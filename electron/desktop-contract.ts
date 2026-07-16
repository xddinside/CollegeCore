export const NOTIFICATION_INTERVAL_OPTIONS = [5, 10, 15, 30, 60] as const;

export type NotificationIntervalMinutes = (typeof NOTIFICATION_INTERVAL_OPTIONS)[number];

export type DesktopSettings = {
  notificationsEnabled: boolean;
  minimizeToTray: boolean;
  notificationCheckIntervalMinutes: number;
  hasSeenNotificationPrompt: boolean;
};

export type DesktopSettingsUpdate = Partial<
  Pick<DesktopSettings, 'notificationsEnabled' | 'minimizeToTray' | 'notificationCheckIntervalMinutes'>
>;

export type DesktopSettingsState = {
  settings: DesktopSettings;
  shouldShowNotificationPrompt: boolean;
};

export type DesktopSettingsChange =
  | { type: 'change'; changes: DesktopSettingsUpdate }
  | { type: 'dismiss-notification-prompt' };

export type DesktopReminderMessage = {
  id: string;
  title: string;
  body: string;
  route?: string;
};

export type DesktopUnsubscribe = () => void;

export type DesktopBridge = {
  isDesktop: true;
  readSettingsState: () => Promise<DesktopSettingsState>;
  applySettings: (command: DesktopSettingsChange) => Promise<DesktopSettingsState>;
  onSettingsChanged: (listener: (settings: DesktopSettings) => void) => DesktopUnsubscribe;
  submitReminders: (reminders: DesktopReminderMessage[]) => Promise<void>;
  onReminderPoll: (listener: () => void | Promise<void>) => DesktopUnsubscribe;
};

export const DEFAULT_DESKTOP_SETTINGS: DesktopSettings = {
  notificationsEnabled: true,
  minimizeToTray: false,
  notificationCheckIntervalMinutes: 15,
  hasSeenNotificationPrompt: false,
};

export const MIN_NOTIFICATION_INTERVAL = 5;
export const MAX_NOTIFICATION_INTERVAL = 60;

export function clampNotificationInterval(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return DEFAULT_DESKTOP_SETTINGS.notificationCheckIntervalMinutes;
  }

  return Math.min(MAX_NOTIFICATION_INTERVAL, Math.max(MIN_NOTIFICATION_INTERVAL, Math.round(numeric)));
}

export function normalizeSettings(value: unknown): DesktopSettings {
  const candidate = typeof value === 'object' && value !== null ? (value as Partial<DesktopSettings>) : {};

  return {
    notificationsEnabled:
      typeof candidate.notificationsEnabled === 'boolean'
        ? candidate.notificationsEnabled
        : DEFAULT_DESKTOP_SETTINGS.notificationsEnabled,
    minimizeToTray:
      typeof candidate.minimizeToTray === 'boolean'
        ? candidate.minimizeToTray
        : DEFAULT_DESKTOP_SETTINGS.minimizeToTray,
    notificationCheckIntervalMinutes: clampNotificationInterval(candidate.notificationCheckIntervalMinutes),
    hasSeenNotificationPrompt:
      typeof candidate.hasSeenNotificationPrompt === 'boolean'
        ? candidate.hasSeenNotificationPrompt
        : DEFAULT_DESKTOP_SETTINGS.hasSeenNotificationPrompt,
  };
}

const DASHBOARD_ROUTE_PATTERN = /^\/dashboard(?:\/[a-z0-9\-_]+)*$/i;

export function isValidReminderRoute(route: unknown): route is string {
  return typeof route === 'string' && DASHBOARD_ROUTE_PATTERN.test(route);
}

export function parseReminderMessages(value: unknown): DesktopReminderMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const messages: DesktopReminderMessage[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const candidate = item as Partial<DesktopReminderMessage>;

    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.body !== 'string'
    ) {
      continue;
    }

    const message: DesktopReminderMessage = {
      id: candidate.id,
      title: candidate.title,
      body: candidate.body,
    };

    if (isValidReminderRoute(candidate.route)) {
      message.route = candidate.route;
    }

    messages.push(message);
  }

  return messages;
}

export class DesktopSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DesktopSettingsError';
  }
}

export function parseSettingsCommand(value: unknown): DesktopSettingsChange {
  if (!value || typeof value !== 'object') {
    throw new DesktopSettingsError('Invalid settings command');
  }

  const candidate = value as Partial<DesktopSettingsChange>;

  if (candidate.type === 'dismiss-notification-prompt') {
    return { type: 'dismiss-notification-prompt' };
  }

  if (candidate.type === 'change') {
    if (!candidate.changes || typeof candidate.changes !== 'object') {
      throw new DesktopSettingsError('Missing changes for change command');
    }

    const changes = candidate.changes as Partial<DesktopSettingsUpdate>;
    const allowed: DesktopSettingsUpdate = {};

    if (typeof changes.notificationsEnabled === 'boolean') {
      allowed.notificationsEnabled = changes.notificationsEnabled;
    }

    if (typeof changes.minimizeToTray === 'boolean') {
      allowed.minimizeToTray = changes.minimizeToTray;
    }

    if (typeof changes.notificationCheckIntervalMinutes === 'number') {
      allowed.notificationCheckIntervalMinutes = clampNotificationInterval(changes.notificationCheckIntervalMinutes);
    }

    return { type: 'change', changes: allowed };
  }

  throw new DesktopSettingsError('Unknown settings command type');
}

export const DESKTOP_SETTINGS_READ_STATE_CHANNEL = 'desktop:read-settings-state' as const;
export const DESKTOP_SETTINGS_APPLY_CHANNEL = 'desktop:apply-settings' as const;
export const DESKTOP_SETTINGS_CHANGED_CHANNEL = 'desktop:settings-changed' as const;
export const DESKTOP_REMINDERS_SUBMIT_CHANNEL = 'desktop:submit-reminders' as const;
export const DESKTOP_REMINDERS_POLL_CHANNEL = 'desktop:poll-reminders' as const;
