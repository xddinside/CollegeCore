import fs from 'node:fs/promises';
import path from 'node:path';
import { URL } from 'node:url';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  Notification,
  shell,
  Tray,
  type WebContents,
  nativeImage,
} from 'electron';
import { loadEnvConfig } from '@next/env';
import {
  DEFAULT_DESKTOP_SETTINGS,
  DESKTOP_REMINDERS_POLL_CHANNEL,
  DESKTOP_REMINDERS_SUBMIT_CHANNEL,
  DESKTOP_SETTINGS_APPLY_CHANNEL,
  DESKTOP_SETTINGS_READ_STATE_CHANNEL,
  isValidReminderRoute,
  parseReminderMessages,
  parseSettingsCommand,
  type DesktopReminderMessage,
  type DesktopSettings,
} from './desktop-contract';
import { DesktopSettingsStore } from './desktop-settings';
import { startNextServer, type StartedNextServer } from './server';

const NOTIFICATION_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const DESKTOP_LAUNCH_ABORT = 'DESKTOP_LAUNCH_ABORT';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let localServer: StartedNextServer | null = null;
let scheduler: NodeJS.Timeout | null = null;
let isQuitting = false;
let appOrigin: string | null = null;
let settingsStore: DesktopSettingsStore | null = null;

const deliveredNotifications = new Map<string, number>();
const guardedContents = new WeakSet<WebContents>();
const projectRoot = path.resolve(__dirname, '../..');

app.setName('CollegeCore');
loadEnvConfig(projectRoot);
const clerkFrontendApi = getClerkFrontendApi(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function getClerkFrontendApi(publishableKey: string | undefined) {
  if (!publishableKey || (!publishableKey.startsWith('pk_live_') && !publishableKey.startsWith('pk_test_'))) {
    return null;
  }

  const encodedApi = publishableKey.split('_')[2];

  if (!encodedApi) {
    return null;
  }

  try {
    return Buffer.from(encodedApi, 'base64').toString('utf8').replace(/\$$/, '');
  } catch {
    return null;
  }
}

function getSettings(): DesktopSettings {
  return settingsStore?.getState().settings ?? { ...DEFAULT_DESKTOP_SETTINGS };
}

async function createMainWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (process.env.ELECTRON_DEVTOOLS === '1') {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('minimize', () => {
    if (!getSettings().minimizeToTray) {
      return;
    }

    mainWindow?.hide();
  });

  mainWindow.on('close', (event) => {
    if (isQuitting || !getSettings().minimizeToTray) {
      return;
    }

    event.preventDefault();
    mainWindow?.hide();
  });

  const launchUrl = await resolveLaunchUrl();
  appOrigin = new URL(launchUrl).origin;
  await mainWindow.loadURL(launchUrl);
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow?.webContents.send(DESKTOP_REMINDERS_POLL_CHANNEL);
  });
}

async function resolveLaunchUrl() {
  const configuredDesktopUrl = process.env.COLLEGECORE_DESKTOP_URL?.trim();

  if (configuredDesktopUrl) {
    return configuredDesktopUrl;
  }

  if (app.isPackaged) {
    const desktopUrl = await readPackagedDesktopUrl();

    if (!desktopUrl) {
      dialog.showErrorBox(
        'Missing desktop URL',
        'The packaged app is missing COLLEGECORE_DESKTOP_URL. Rebuild the desktop app with that environment variable set.'
      );
      app.quit();
      return 'about:blank';
    }

    return desktopUrl;
  }

  const port = clampPort(process.env.NEXT_PUBLIC_ELECTRON_PORT);
  localServer = await startNextServer(port);
  await ensureDesktopUrlIsReachable(localServer.url);
  return localServer.url;
}

async function readPackagedDesktopUrl() {
  try {
    const packageJsonPath = path.join(app.getAppPath(), 'package.json');
    const raw = await fs.readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(raw) as { desktopUrl?: string };
    return pkg.desktopUrl;
  } catch (error) {
    console.error('Could not read packaged desktop URL:', error);
    return undefined;
  }
}

function clampPort(value: string | undefined) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 1024 || numeric > 65535) {
    return 3120;
  }

  return Math.round(numeric);
}

function attachNavigationGuards(contents: WebContents) {
  if (guardedContents.has(contents)) {
    return;
  }

  guardedContents.add(contents);

  contents.setWindowOpenHandler(({ url }) => {
    if (isInAppNavigationAllowed(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
          },
        },
      };
    }

    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const maybeOpenExternally = (event: Electron.Event, url: string) => {
    if (isInAppNavigationAllowed(url)) {
      return;
    }

    event.preventDefault();
    void shell.openExternal(url);
  };

  contents.on('will-navigate', maybeOpenExternally);
  contents.on('will-redirect', maybeOpenExternally);
}

function isInAppNavigationAllowed(url: string) {
  try {
    const target = new URL(url);

    if (!['http:', 'https:'].includes(target.protocol)) {
      return false;
    }

    if (appOrigin && target.origin === appOrigin) {
      return true;
    }

    if (clerkFrontendApi && target.hostname === clerkFrontendApi) {
      return true;
    }

    return (
      target.hostname === 'accounts.google.com' ||
      target.hostname.endsWith('.google.com') ||
      target.hostname.endsWith('.googleusercontent.com') ||
      target.hostname.endsWith('.gstatic.com') ||
      target.hostname.endsWith('.clerk.accounts.dev') ||
      target.hostname.endsWith('.accounts.dev') ||
      target.hostname.endsWith('.clerkstage.dev') ||
      target.hostname.endsWith('.clerk.com')
    );
  } catch {
    return false;
  }
}

async function ensureDesktopUrlIsReachable(baseUrl: string) {
  const signInUrl = new URL('/sign-in', baseUrl).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(signInUrl, {
      signal: controller.signal,
      redirect: 'manual',
    });

    if (response.status >= 200 && response.status < 500) {
      return;
    }
  } catch (error) {
    if (!(error instanceof Error && error.name === 'AbortError')) {
      console.error('Desktop URL health check failed:', error);
    }
  } finally {
    clearTimeout(timeout);
  }

  await shutdownLocalServer();

  dialog.showErrorBox(
    'CollegeCore desktop could not reach the app',
    [
      `The local app at ${baseUrl} did not respond in time.`,
      'This repo currently hangs on authenticated app routes when served locally.',
      'For now, set COLLEGECORE_DESKTOP_URL in your environment to your deployed CollegeCore URL and rerun electron:dev.',
    ].join('\n\n')
  );

  app.quit();
  throw new Error(DESKTOP_LAUNCH_ABORT);
}

function syncTray() {
  if (tray) {
    return;
  }

  tray = new Tray(createTrayIcon());
  tray.setToolTip('CollegeCore');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Show CollegeCore',
        click: () => showMainWindow(),
      },
      {
        label: 'Open Settings',
        click: () => openDesktopSettings(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );
}

function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect x="8" y="12" width="48" height="40" rx="12" fill="#1c1917"/>
      <path d="M19 27.5L32 20l13 7.5L32 35l-13-7.5Zm4.5 3.5V38c0 3.9 6.1 7 8.5 7s8.5-3.1 8.5-7v-7"
        stroke="#fafaf9" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  `.trim();

  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
}

function showMainWindow() {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function openDesktopSettings() {
  showMainWindow();
  void mainWindow?.webContents.executeJavaScript("window.location.assign('/dashboard/settings')");
}

function syncReminderScheduler() {
  if (scheduler) {
    clearInterval(scheduler);
    scheduler = null;
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  scheduler = setInterval(() => {
    mainWindow?.webContents.send(DESKTOP_REMINDERS_POLL_CHANNEL);
  }, getSettings().notificationCheckIntervalMinutes * 60 * 1000);
}

function handleReminderSubmission(reminders: DesktopReminderMessage[]) {
  if (!getSettings().notificationsEnabled || reminders.length === 0) {
    return;
  }

  const now = Date.now();

  for (const reminder of reminders) {
    const lastDeliveredAt = deliveredNotifications.get(reminder.id);

    if (lastDeliveredAt && now - lastDeliveredAt < NOTIFICATION_COOLDOWN_MS) {
      continue;
    }

    deliveredNotifications.set(reminder.id, now);
    const notification = new Notification({
      title: reminder.title,
      body: reminder.body,
    });

    notification.on('click', () => {
      showMainWindow();

      if (reminder.route && isValidReminderRoute(reminder.route)) {
        void mainWindow?.webContents.executeJavaScript(
          `window.location.assign(${JSON.stringify(reminder.route)})`
        );
      }
    });

    notification.show();
  }
}

function registerIpc() {
  ipcMain.handle(DESKTOP_SETTINGS_READ_STATE_CHANNEL, () => settingsStore?.getState());

  ipcMain.handle(DESKTOP_SETTINGS_APPLY_CHANNEL, async (_event, command: unknown) => {
    if (!settingsStore) {
      throw new Error('Settings store is not initialized');
    }

    const previousSettings = getSettings();
    const parsedCommand = parseSettingsCommand(command);
    const nextState = await settingsStore.apply(parsedCommand);

    if (previousSettings.notificationCheckIntervalMinutes !== nextState.settings.notificationCheckIntervalMinutes) {
      syncReminderScheduler();
    }

    return nextState;
  });

  ipcMain.handle(DESKTOP_REMINDERS_SUBMIT_CHANNEL, (_event, reminders: unknown) => {
    handleReminderSubmission(parseReminderMessages(reminders));
  });
}

async function shutdownLocalServer() {
  if (!localServer) {
    return;
  }

  await localServer.close();
  localServer = null;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !getSettings().minimizeToTray) {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  void shutdownLocalServer();
});

app.on('activate', async () => {
  if (!mainWindow) {
    await createMainWindow();
    syncReminderScheduler();
    return;
  }

  showMainWindow();
});

app.on('web-contents-created', (_event, contents) => {
  attachNavigationGuards(contents);
});

app.whenReady().then(async () => {
  settingsStore = new DesktopSettingsStore({
    userDataPath: app.getPath('userData'),
    getMainWindow: () => mainWindow,
  });

  await settingsStore.load();
  registerIpc();
  syncTray();
  await createMainWindow();
  syncReminderScheduler();
}).catch((error) => {
  if (error instanceof Error && error.message === DESKTOP_LAUNCH_ABORT) {
    return;
  }
  console.error(error);
  app.quit();
});

app.on('quit', () => {
  if (scheduler) {
    clearInterval(scheduler);
  }
});

process.on('exit', () => {
  void shutdownLocalServer();
});

process.on('SIGINT', () => {
  void shutdownLocalServer().finally(() => process.exit(0));
});
