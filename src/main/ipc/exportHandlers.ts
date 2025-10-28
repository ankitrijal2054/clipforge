/**
 * Export Handler Module
 *
 * Manages export-specific IPC communication.
 * Note: File dialog handlers (selectExportPath, openFolder) are
 * already registered in videoHandlers.ts to avoid duplication.
 *
 * This module is reserved for future export-specific handlers.
 */

export interface ExportParams {
  inputPath: string
  outputPath: string
  trimStart: number
  trimEnd: number
  quality: 'high' | 'medium' | 'low'
}

/**
 * Register export-specific IPC handlers
 * Currently empty as core export handlers are in videoHandlers.ts
 */
export function registerExportHandlers(): void {
  // Export-specific handlers will be added here in future phases
  // File dialog handlers are managed in videoHandlers.ts
}

/**
 * Unregister export-specific IPC handlers
 */
export function unregisterExportHandlers(): void {
  // Export-specific unregistration will be added here if needed
}
