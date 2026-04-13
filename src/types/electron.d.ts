import type {
  DesktopLaunchState,
  DesktopReminderCandidate,
  DesktopSettings,
  DesktopSettingsUpdate,
} from '@/lib/desktop';

type DesktopUnsubscribe = () => void;

declare global {
  interface Window {
    collegeCoreDesktop?: {
      isDesktop: boolean;
      getSettings: () => Promise<DesktopSettings>;
      updateSettings: (update: DesktopSettingsUpdate) => Promise<DesktopSettings>;
      getLaunchState: () => Promise<DesktopLaunchState>;
      dismissNotificationPrompt: () => Promise<void>;
      submitReminders: (reminders: DesktopReminderCandidate[]) => Promise<void>;
      onSettingsChanged: (callback: (settings: DesktopSettings) => void) => DesktopUnsubscribe;
      onReminderPoll: (callback: () => void | Promise<void>) => DesktopUnsubscribe;
    };
  }
}

export {};
