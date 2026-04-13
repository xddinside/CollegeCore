import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

const desktopApi = {
  isDesktop: true,
  getSettings: () => ipcRenderer.invoke('desktop:get-settings'),
  updateSettings: (update: unknown) => ipcRenderer.invoke('desktop:update-settings', update),
  getLaunchState: () => ipcRenderer.invoke('desktop:get-launch-state'),
  dismissNotificationPrompt: () => ipcRenderer.invoke('desktop:dismiss-notification-prompt'),
  submitReminders: (reminders: unknown) => ipcRenderer.invoke('desktop:submit-reminders', reminders),
  onSettingsChanged: (callback: (settings: unknown) => void) => {
    const listener = (...[, settings]: [IpcRendererEvent, unknown]) => {
      callback(settings);
    };

    ipcRenderer.on('desktop:settings-changed', listener);

    return () => {
      ipcRenderer.removeListener('desktop:settings-changed', listener);
    };
  },
  onReminderPoll: (callback: () => void | Promise<void>) => {
    const listener = () => {
      void callback();
    };

    ipcRenderer.on('desktop:poll-reminders', listener);

    return () => {
      ipcRenderer.removeListener('desktop:poll-reminders', listener);
    };
  },
};

contextBridge.exposeInMainWorld('collegeCoreDesktop', desktopApi);
