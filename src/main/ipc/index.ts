/**
 * IPC handlers module
 *
 * This module registers all IPC handlers for communication between
 * the main process and renderer process.
 */

import { registerVideoHandlers } from './videoHandlers'
import { registerExportHandlers } from './exportHandlers'
import './recordingHandlers' // Import to register handlers

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers(): void {
  registerVideoHandlers()
  registerExportHandlers()
  // Recording handlers are already registered via ipcMain.handle() calls in recordingHandlers.ts
  console.log('Recording IPC handlers registered')
}

/**
 * Unregister all IPC handlers
 */
export function unregisterIpcHandlers(): void {
  // Video handlers will be unregistered individually
  // Export handlers will be unregistered individually
  // Add other handler unregistration here as needed
}
