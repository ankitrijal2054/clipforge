/**
 * Export Handler Module
 *
 * Manages export-specific IPC communication.
 * Note: File dialog handlers (selectExportPath, openFolder) are
 * already registered in videoHandlers.ts to avoid duplication.
 *
 * This module is reserved for future export-specific handlers.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { exportTimeline, ExportProgress, TimelineExportParams } from '../ffmpeg/concat'

export interface ExportParams {
  inputPath: string
  outputPath: string
  trimStart: number
  trimEnd: number
  quality: 'high' | 'medium' | 'low'
}

/**
 * Timeline export parameters from renderer
 */
export interface TimelineExportRequest {
  videoClips: any[]
  audioClips: any[]
  isMuted: { video: boolean; audio: boolean }
  outputPath: string
  quality: 'high' | 'medium' | 'low'
  clips: any[] // Library clips for resolving paths
}

/**
 * Register export-specific IPC handlers
 */
export function registerExportHandlers(): void {
  // Handler for multi-clip timeline export
  ipcMain.handle(
    'timeline:export',
    async (event: IpcMainInvokeEvent, request: TimelineExportRequest) => {
      try {
        const params: TimelineExportParams & { clips: any[] } = {
          videoClips: request.videoClips,
          audioClips: request.audioClips,
          isMuted: request.isMuted,
          outputPath: request.outputPath,
          quality: request.quality,
          clips: request.clips
        }

        // Export with progress tracking
        return await exportTimeline(params, (progress: ExportProgress) => {
          // Send progress updates back to renderer
          event.sender.send('timeline:export-progress', {
            progress: progress.progress,
            phase: progress.phase,
            totalPhases: progress.totalPhases
          })
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown export error'
        event.sender.send('timeline:export-error', { error: errorMessage })
        throw error
      }
    }
  )

  console.log('Timeline export IPC handler registered')
}

/**
 * Unregister export-specific IPC handlers
 */
export function unregisterExportHandlers(): void {
  ipcMain.removeHandler('timeline:export')
}
