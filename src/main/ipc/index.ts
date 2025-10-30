/**
 * IPC handlers module
 *
 * This module registers all IPC handlers for communication between
 * the main process and renderer process.
 */

import { BrowserWindow } from 'electron'
import { registerVideoHandlers } from './videoHandlers'
import { registerExportHandlers } from './exportHandlers'
import { registerSubtitleHandlers } from './subtitleHandlers'
import './recordingHandlers' // Import to register handlers

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  registerVideoHandlers(mainWindow)
  registerExportHandlers()
  registerSubtitleHandlers()
  // Recording handlers are already registered via ipcMain.handle() calls in recordingHandlers.ts
  console.log('All IPC handlers registered (video, export, subtitles, recording)')
}

/**
 * Unregister all IPC handlers
 */
export function unregisterIpcHandlers(): void {
  // Video handlers will be unregistered individually
  // Export handlers will be unregistered individually
  // Add other handler unregistration here as needed
}
