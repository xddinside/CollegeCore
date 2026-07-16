import fs from 'node:fs/promises';
import path from 'node:path';
import type { BrowserWindow } from 'electron';
import {
  DEFAULT_DESKTOP_SETTINGS,
  DESKTOP_SETTINGS_CHANGED_CHANNEL,
  clampNotificationInterval,
  normalizeSettings,
  type DesktopSettings,
  type DesktopSettingsChange,
  type DesktopSettingsState,
  type DesktopSettingsUpdate,
} from './desktop-contract';

export type DesktopSettingsStoreOptions = {
  userDataPath?: string;
  storage?: DesktopSettingsStorage;
  getMainWindow: () => BrowserWindow | null;
};

export interface DesktopSettingsStorage {
  read(): Promise<string>;
  write(value: string): Promise<void>;
}

export class FileDesktopSettingsStorage implements DesktopSettingsStorage {
  private readonly settingsPath: string;

  constructor(userDataPath: string) {
    this.settingsPath = path.join(userDataPath, 'desktop-settings.json');
  }

  async read(): Promise<string> {
    return fs.readFile(this.settingsPath, 'utf8');
  }

  async write(value: string): Promise<void> {
    const tempPath = `${this.settingsPath}.tmp`;
    await fs.writeFile(tempPath, value);
    await fs.rename(tempPath, this.settingsPath);
  }
}

export class InMemoryDesktopSettingsStorage implements DesktopSettingsStorage {
  private value: string | null;

  constructor(initialValue: string | null = null) {
    this.value = initialValue;
  }

  async read(): Promise<string> {
    if (this.value === null) {
      const error = new Error('Desktop settings have not been stored') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      throw error;
    }
    return this.value;
  }

  async write(value: string): Promise<void> {
    this.value = value;
  }
}

export class DesktopSettingsStore {
  private settings: DesktopSettings;
  private readonly storage: DesktopSettingsStorage;
  private readonly getMainWindow: () => BrowserWindow | null;

  constructor(options: DesktopSettingsStoreOptions) {
    if (!options.storage && !options.userDataPath) {
      throw new Error('Desktop settings require a storage adapter or user data path');
    }
    this.storage = options.storage ?? new FileDesktopSettingsStorage(options.userDataPath!);
    this.getMainWindow = options.getMainWindow;
    this.settings = { ...DEFAULT_DESKTOP_SETTINGS };
  }

  async load(): Promise<void> {
    try {
      const raw = await this.storage.read();
      this.settings = normalizeSettings(JSON.parse(raw));
    } catch (error) {
      this.settings = { ...DEFAULT_DESKTOP_SETTINGS };

      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Could not read desktop settings:', error);
      }
    }
  }

  getState(): DesktopSettingsState {
    return {
      settings: { ...this.settings },
      shouldShowNotificationPrompt: !this.settings.hasSeenNotificationPrompt,
    };
  }

  async apply(command: DesktopSettingsChange): Promise<DesktopSettingsState> {
    const next = this.computeNextSettings(command);

    if (!settingsEqual(this.settings, next)) {
      await this.persist(next);
      this.settings = next;
      this.broadcast();
    }

    return this.getState();
  }

  private computeNextSettings(command: DesktopSettingsChange): DesktopSettings {
    if (command.type === 'dismiss-notification-prompt') {
      return normalizeSettings({ ...this.settings, hasSeenNotificationPrompt: true });
    }

    const allowed: DesktopSettingsUpdate = {};

    if (typeof command.changes.notificationsEnabled === 'boolean') {
      allowed.notificationsEnabled = command.changes.notificationsEnabled;
    }

    if (typeof command.changes.minimizeToTray === 'boolean') {
      allowed.minimizeToTray = command.changes.minimizeToTray;
    }

    if (typeof command.changes.notificationCheckIntervalMinutes === 'number') {
      allowed.notificationCheckIntervalMinutes = clampNotificationInterval(
        command.changes.notificationCheckIntervalMinutes,
      );
    }

    return normalizeSettings({ ...this.settings, ...allowed });
  }

  private async persist(next: DesktopSettings): Promise<void> {
    await this.storage.write(JSON.stringify(next, null, 2));
  }

  private broadcast(): void {
    const window = this.getMainWindow();

    if (!window || window.isDestroyed()) {
      return;
    }

    window.webContents.send(DESKTOP_SETTINGS_CHANGED_CHANNEL, this.settings);
  }
}

function settingsEqual(a: DesktopSettings, b: DesktopSettings): boolean {
  return (
    a.notificationsEnabled === b.notificationsEnabled &&
    a.minimizeToTray === b.minimizeToTray &&
    a.notificationCheckIntervalMinutes === b.notificationCheckIntervalMinutes &&
    a.hasSeenNotificationPrompt === b.hasSeenNotificationPrompt
  );
}
