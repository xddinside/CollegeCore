import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampNotificationInterval,
  DEFAULT_DESKTOP_SETTINGS,
  DesktopSettingsError,
  isValidReminderRoute,
  MAX_NOTIFICATION_INTERVAL,
  MIN_NOTIFICATION_INTERVAL,
  normalizeSettings,
  parseReminderMessages,
  parseSettingsCommand,
  type DesktopReminderMessage,
} from './desktop-contract';
import {
  DesktopSettingsStore,
  InMemoryDesktopSettingsStorage,
} from './desktop-settings';

describe('clampNotificationInterval', () => {
  test('clamps values below the minimum to the minimum', () => {
    assert.equal(clampNotificationInterval(0), MIN_NOTIFICATION_INTERVAL);
    assert.equal(clampNotificationInterval(4), MIN_NOTIFICATION_INTERVAL);
    assert.equal(clampNotificationInterval(-10), MIN_NOTIFICATION_INTERVAL);
  });

  test('clamps values above the maximum to the maximum', () => {
    assert.equal(clampNotificationInterval(61), MAX_NOTIFICATION_INTERVAL);
    assert.equal(clampNotificationInterval(120), MAX_NOTIFICATION_INTERVAL);
  });

  test('rounds to the nearest integer', () => {
    assert.equal(clampNotificationInterval(12.4), 12);
    assert.equal(clampNotificationInterval(12.5), 13);
  });

  test('returns the default for non-finite inputs', () => {
    assert.equal(clampNotificationInterval(NaN), DEFAULT_DESKTOP_SETTINGS.notificationCheckIntervalMinutes);
    assert.equal(clampNotificationInterval(Infinity), DEFAULT_DESKTOP_SETTINGS.notificationCheckIntervalMinutes);
    assert.equal(clampNotificationInterval('not a number'), DEFAULT_DESKTOP_SETTINGS.notificationCheckIntervalMinutes);
  });

  test('preserves valid inputs unchanged', () => {
    assert.equal(clampNotificationInterval(5), 5);
    assert.equal(clampNotificationInterval(15), 15);
    assert.equal(clampNotificationInterval(60), 60);
  });
});

describe('normalizeSettings', () => {
  test('returns defaults for a non-object value', () => {
    assert.deepEqual(normalizeSettings(null), DEFAULT_DESKTOP_SETTINGS);
    assert.deepEqual(normalizeSettings('settings'), DEFAULT_DESKTOP_SETTINGS);
    assert.deepEqual(normalizeSettings(42), DEFAULT_DESKTOP_SETTINGS);
  });

  test('preserves fully valid settings', () => {
    const settings = {
      notificationsEnabled: false,
      minimizeToTray: true,
      notificationCheckIntervalMinutes: 30,
      hasSeenNotificationPrompt: true,
    };
    assert.deepEqual(normalizeSettings(settings), settings);
  });

  test('fills missing fields from defaults', () => {
    assert.deepEqual(normalizeSettings({}), DEFAULT_DESKTOP_SETTINGS);
  });

  test('normalizes a corrupt interval while preserving valid booleans', () => {
    const result = normalizeSettings({
      notificationsEnabled: true,
      minimizeToTray: false,
      notificationCheckIntervalMinutes: 500,
    });
    assert.equal(result.notificationCheckIntervalMinutes, MAX_NOTIFICATION_INTERVAL);
    assert.equal(result.notificationsEnabled, true);
    assert.equal(result.minimizeToTray, false);
  });

  test('rejects non-boolean fields and falls back to defaults', () => {
    const result = normalizeSettings({
      notificationsEnabled: 'yes',
      minimizeToTray: 1,
      hasSeenNotificationPrompt: 0,
    });
    assert.equal(result.notificationsEnabled, DEFAULT_DESKTOP_SETTINGS.notificationsEnabled);
    assert.equal(result.minimizeToTray, DEFAULT_DESKTOP_SETTINGS.minimizeToTray);
    assert.equal(result.hasSeenNotificationPrompt, DEFAULT_DESKTOP_SETTINGS.hasSeenNotificationPrompt);
  });
});

describe('isValidReminderRoute', () => {
  test('accepts the dashboard root and nested dashboard routes', () => {
    assert.equal(isValidReminderRoute('/dashboard'), true);
    assert.equal(isValidReminderRoute('/dashboard/assignments'), true);
    assert.equal(isValidReminderRoute('/dashboard/sprints/active-sprint'), true);
  });

  test('rejects invalid routes while allowing deep dashboard nesting', () => {
    assert.equal(isValidReminderRoute('/'), false);
    assert.equal(isValidReminderRoute('/onboarding'), false);
    assert.equal(isValidReminderRoute('/dashboard?query=1'), false);
    assert.equal(isValidReminderRoute('/dashboard/assignments/extra/segment'), true);
  });

  test('rejects non-string values', () => {
    assert.equal(isValidReminderRoute(42), false);
    assert.equal(isValidReminderRoute(null), false);
    assert.equal(isValidReminderRoute(undefined), false);
  });
});

describe('parseReminderMessages', () => {
  test('returns an empty array for non-array input', () => {
    assert.deepEqual(parseReminderMessages(null), []);
    assert.deepEqual(parseReminderMessages({}), []);
    assert.deepEqual(parseReminderMessages('messages'), []);
  });

  test('skips items missing required fields', () => {
    const result = parseReminderMessages([
      { id: 'r1', title: 'Title' },
      { id: 'r2', body: 'Body' },
      { title: 'No id', body: 'Body' },
    ]);
    assert.equal(result.length, 0);
  });

  test('keeps valid messages without a route', () => {
    const message: DesktopReminderMessage = { id: 'r1', title: 'Hi', body: 'Hello' };
    assert.deepEqual(parseReminderMessages([message]), [message]);
  });

  test('keeps valid messages with a valid route', () => {
    const result = parseReminderMessages([
      { id: 'r1', title: 'Hi', body: 'Hello', route: '/dashboard/assignments' },
    ]);
    assert.equal(result[0].route, '/dashboard/assignments');
  });

  test('drops invalid routes from otherwise valid messages', () => {
    const result = parseReminderMessages([
      { id: 'r1', title: 'Hi', body: 'Hello', route: '/onboarding' },
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].route, undefined);
  });
});

describe('parseSettingsCommand', () => {
  test('throws for non-object commands', () => {
    assert.throws(() => parseSettingsCommand(null), DesktopSettingsError);
    assert.throws(() => parseSettingsCommand('change'), DesktopSettingsError);
  });

  test('parses a dismiss-notification-prompt command', () => {
    assert.deepEqual(parseSettingsCommand({ type: 'dismiss-notification-prompt' }), {
      type: 'dismiss-notification-prompt',
    });
  });

  test('throws when a change command is missing changes', () => {
    assert.throws(() => parseSettingsCommand({ type: 'change' }), DesktopSettingsError);
    assert.throws(() => parseSettingsCommand({ type: 'change', changes: null }), DesktopSettingsError);
  });

  test('parses a change command with allowed fields', () => {
    const command = parseSettingsCommand({
      type: 'change',
      changes: {
        notificationsEnabled: false,
        minimizeToTray: true,
        notificationCheckIntervalMinutes: 10,
      },
    });
    assert.deepEqual(command, {
      type: 'change',
      changes: {
        notificationsEnabled: false,
        minimizeToTray: true,
        notificationCheckIntervalMinutes: 10,
      },
    });
  });

  test('clamps and ignores invalid fields in a change command', () => {
    const command = parseSettingsCommand({
      type: 'change',
      changes: {
        notificationCheckIntervalMinutes: 200,
        unknownField: 'ignored',
      },
    });
    assert.deepEqual(command, {
      type: 'change',
      changes: { notificationCheckIntervalMinutes: MAX_NOTIFICATION_INTERVAL },
    });
  });

  test('throws for an unknown command type', () => {
    assert.throws(() => parseSettingsCommand({ type: 'reset' }), DesktopSettingsError);
  });
});

describe('DesktopSettingsStore storage seam', () => {
  test('loads and persists settings through the in-memory adapter', async () => {
    const storage = new InMemoryDesktopSettingsStorage();
    const store = new DesktopSettingsStore({
      storage,
      getMainWindow: () => null,
    });

    await store.load();
    assert.deepEqual(store.getState(), {
      settings: DEFAULT_DESKTOP_SETTINGS,
      shouldShowNotificationPrompt: true,
    });

    await store.apply({
      type: 'change',
      changes: {
        notificationsEnabled: false,
        notificationCheckIntervalMinutes: 30,
      },
    });

    const reloaded = new DesktopSettingsStore({
      storage,
      getMainWindow: () => null,
    });
    await reloaded.load();

    assert.deepEqual(reloaded.getState(), {
      settings: {
        ...DEFAULT_DESKTOP_SETTINGS,
        notificationsEnabled: false,
        notificationCheckIntervalMinutes: 30,
      },
      shouldShowNotificationPrompt: true,
    });
  });

  test('broadcasts persisted changes to the desktop window', async () => {
    const sent: unknown[] = [];
    const storage = new InMemoryDesktopSettingsStorage();
    const window = {
      isDestroyed: () => false,
      webContents: { send: (_channel: string, value: unknown) => sent.push(value) },
    } as never;
    const store = new DesktopSettingsStore({
      storage,
      getMainWindow: () => window,
    });

    await store.apply({ type: 'dismiss-notification-prompt' });

    assert.deepEqual(sent, [{ ...DEFAULT_DESKTOP_SETTINGS, hasSeenNotificationPrompt: true }]);
  });
});
