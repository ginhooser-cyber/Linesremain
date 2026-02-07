// ─── Debug Logger ───
// Only logs when showFps (debug mode) is enabled in settings.
// Prevents noisy console output in production.

import { useSettingsStore } from '../stores/useSettingsStore';

function isDebugEnabled(): boolean {
  return useSettingsStore.getState().showFps;
}

export const debugLog = {
  log(message: string, ...args: unknown[]): void {
    if (isDebugEnabled()) {
      console.log(message, ...args);
    }
  },
  warn(message: string, ...args: unknown[]): void {
    if (isDebugEnabled()) {
      console.warn(message, ...args);
    }
  },
  error(message: string, ...args: unknown[]): void {
    // Errors always log regardless of debug flag
    console.error(message, ...args);
  },
};