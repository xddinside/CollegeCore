import {
  DEFAULT_DESKTOP_SETTINGS,
  NOTIFICATION_INTERVAL_OPTIONS,
  clampNotificationInterval,
  type DesktopReminderMessage,
  type DesktopSettings,
  type DesktopSettingsChange,
  type DesktopSettingsState,
  type DesktopSettingsUpdate,
} from '../../electron/desktop-contract';

export type DesktopSettingsAccess = {
  readState: () => Promise<DesktopSettingsState>;
  apply: (command: DesktopSettingsChange) => Promise<DesktopSettingsState>;
  onChanged: (listener: (settings: DesktopSettings) => void) => () => void;
};

export type DesktopReminderAccess = {
  submit: (reminders: DesktopReminderMessage[]) => Promise<void>;
  onPoll: (listener: () => void | Promise<void>) => () => void;
};

export type DesktopRuntimeAccess =
  | { kind: 'electron'; settings: DesktopSettingsAccess; reminders: DesktopReminderAccess }
  | { kind: 'browser' };

export type {
  DesktopSettings,
  DesktopSettingsChange,
  DesktopSettingsState,
  DesktopSettingsUpdate,
  DesktopReminderMessage,
};

export {
  DEFAULT_DESKTOP_SETTINGS,
  NOTIFICATION_INTERVAL_OPTIONS,
  clampNotificationInterval,
};

export function getDesktopRuntime(): DesktopRuntimeAccess {
  if (typeof window === 'undefined' || typeof window.collegeCoreDesktop === 'undefined') {
    return { kind: 'browser' };
  }

  const bridge = window.collegeCoreDesktop;

  if (!bridge) {
    return { kind: 'browser' };
  }

  return {
    kind: 'electron',
    settings: {
      readState: () => bridge.readSettingsState(),
      apply: (command) => bridge.applySettings(command),
      onChanged: (listener) => bridge.onSettingsChanged(listener),
    },
    reminders: {
      submit: (reminders) => bridge.submitReminders(reminders),
      onPoll: (listener) => bridge.onReminderPoll(listener),
    },
  };
}
