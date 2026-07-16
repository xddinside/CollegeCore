import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  DESKTOP_REMINDERS_POLL_CHANNEL,
  DESKTOP_REMINDERS_SUBMIT_CHANNEL,
  DESKTOP_SETTINGS_APPLY_CHANNEL,
  DESKTOP_SETTINGS_CHANGED_CHANNEL,
  DESKTOP_SETTINGS_READ_STATE_CHANNEL,
  type DesktopBridge,
  type DesktopReminderMessage,
  type DesktopSettingsChange,
  type DesktopSettingsState,
} from './desktop-contract';

const desktopApi = {
  isDesktop: true,
  readSettingsState: async () => {
    const result = await ipcRenderer.invoke(DESKTOP_SETTINGS_READ_STATE_CHANNEL);
    return result as DesktopSettingsState;
  },
  applySettings: async (command: DesktopSettingsChange) => {
    const result = await ipcRenderer.invoke(DESKTOP_SETTINGS_APPLY_CHANNEL, command);
    return result as DesktopSettingsState;
  },
  onSettingsChanged: (callback: (settings: DesktopSettingsState['settings']) => void) => {
    const listener = (_event: IpcRendererEvent, settings: DesktopSettingsState['settings']) => {
      callback(settings);
    };

    ipcRenderer.on(DESKTOP_SETTINGS_CHANGED_CHANNEL, listener);

    return () => {
      ipcRenderer.removeListener(DESKTOP_SETTINGS_CHANGED_CHANNEL, listener);
    };
  },
  submitReminders: async (reminders: DesktopReminderMessage[]) => {
    await ipcRenderer.invoke(DESKTOP_REMINDERS_SUBMIT_CHANNEL, reminders);
  },
  onReminderPoll: (callback: () => void | Promise<void>) => {
    const listener = () => {
      void callback();
    };

    ipcRenderer.on(DESKTOP_REMINDERS_POLL_CHANNEL, listener);

    return () => {
      ipcRenderer.removeListener(DESKTOP_REMINDERS_POLL_CHANNEL, listener);
    };
  },
} satisfies DesktopBridge;

contextBridge.exposeInMainWorld('collegeCoreDesktop', desktopApi);
