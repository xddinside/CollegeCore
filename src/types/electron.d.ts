import type { DesktopBridge } from '../../electron/desktop-contract';

declare global {
  interface Window {
    collegeCoreDesktop?: DesktopBridge;
  }
}

export {};
