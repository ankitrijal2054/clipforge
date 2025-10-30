import { ipcMain, IpcMainInvokeEvent, dialog, BrowserWindow } from 'electron'
import {
  getVideoMetadata,
  getVideoThumbnail,
  trimAndExport,
  convertVideo,
  type ExportProgress
} from '../ffmpeg'
import type { VideoMetadata, VideoThumbnailParams } from '../../types/video'
import { burnSubtitlesIntoVideo } from '../ffmpeg/subtitleBurn'
import type { Subtitle } from '../../types/subtitles'
import path from 'path'
import fs from 'fs'
import os from 'os'

/**
 * IPC handlers for video operations
 */

export interface VideoMetadataParams {
  filePath: string
}

export interface TrimExportParams {
  inputPath: string
  startTime: number
  endTime: number
  outputPath: string
  duration: number
}

export interface ConvertVideoParams {
  inputPath: string
  outputPath: string
  quality?: 'high' | 'medium' | 'low'
  format?: 'mp4' | 'mov' | 'avi'
  resolution?: { width: number; height: number }
}

/**
 * Register all video-related IPC handlers
 */
export function registerVideoHandlers(mainWindow: BrowserWindow): void {
  // Get video metadata
  ipcMain.handle(
    'video:getMetadata',
    async (_event: IpcMainInvokeEvent, params: VideoMetadataParams): Promise<VideoMetadata> => {
      try {
        return await getVideoMetadata(params.filePath)
      } catch (error) {
        throw new Error(
          `Failed to get video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  )

  // Generate video thumbnail
  ipcMain.handle(
    'video:getThumbnail',
    async (_event: IpcMainInvokeEvent, params: VideoThumbnailParams): Promise<string> => {
      try {
        return await getVideoThumbnail(params.filePath, params.timeInSeconds, params.outputPath)
      } catch (error) {
        throw new Error(
          `Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  )

  // Trim and export video
  ipcMain.handle(
    'video:trimExport',
    async (event: IpcMainInvokeEvent, params: TrimExportParams): Promise<string> => {
      try {
        return await trimAndExport(params, (progress: ExportProgress) => {
          // Send progress updates to renderer
          event.sender.send('video:exportProgress', {
            progress: progress.progress,
            currentTime: progress.currentTime,
            totalTime: progress.totalTime,
            speed: progress.speed
          })
        })
      } catch (error) {
        throw new Error(
          `Failed to trim and export video: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  )

  // Trim and export video with subtitle burning
  ipcMain.handle(
    'video:trimExportWithSubtitles',
    async (
      event: IpcMainInvokeEvent,
      params: TrimExportParams & {
        subtitles: Subtitle[]
        subtitleSettings: {
          textColor: string
          fontSize: number
          position: 'top' | 'center' | 'bottom'
        }
      }
    ): Promise<string> => {
      try {
        // Step 1: Trim and export without subtitles first
        const trimmedVideoPath = await trimAndExport(params, (progress: ExportProgress) => {
          event.sender.send('video:exportProgress', {
            progress: Math.floor(progress.progress * 0.5), // First 50% for trimming
            currentTime: progress.currentTime,
            totalTime: progress.totalTime,
            speed: progress.speed
          })
        })

        // Step 2: Burn subtitles into the trimmed video
        const tempDir = path.join(os.tmpdir(), 'clipforge', 'subtitle-export')
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
        }

        const finalOutputPath = params.outputPath
        const tempOutputPath = path.join(tempDir, `temp_${Date.now()}.mp4`)

        event.sender.send('video:exportProgress', {
          progress: 75,
          currentTime: 0,
          totalTime: 100,
          speed: 1
        })

        await burnSubtitlesIntoVideo(
          trimmedVideoPath,
          params.subtitles,
          tempOutputPath,
          params.subtitleSettings
        )

        // Step 3: Move the subtitle-burned video to final output path
        fs.copyFileSync(tempOutputPath, finalOutputPath)

        // Clean up temp files
        fs.unlinkSync(trimmedVideoPath)
        fs.unlinkSync(tempOutputPath)

        event.sender.send('video:exportProgress', {
          progress: 100,
          currentTime: 100,
          totalTime: 100,
          speed: 1
        })

        return finalOutputPath
      } catch (error) {
        throw new Error(
          `Failed to trim, export and burn subtitles: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  )

  // Convert video format/quality
  ipcMain.handle(
    'video:convert',
    async (event: IpcMainInvokeEvent, params: ConvertVideoParams): Promise<string> => {
      try {
        return await convertVideo(
          params.inputPath,
          params.outputPath,
          {
            quality: params.quality,
            format: params.format,
            resolution: params.resolution
          },
          (progress: ExportProgress) => {
            // Send progress updates to renderer
            event.sender.send('video:convertProgress', {
              progress: progress.progress,
              currentTime: progress.currentTime,
              totalTime: progress.totalTime,
              speed: progress.speed
            })
          }
        )
      } catch (error) {
        throw new Error(
          `Failed to convert video: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  )

  // File dialog for video selection
  ipcMain.handle('dialog:selectVideo', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          // Put combined Media first so audio (e.g., mp3) isn't disabled by default
          {
            name: 'Media',
            extensions: [
              'mp4',
              'mov',
              'webm',
              'avi',
              'mkv',
              'mp3',
              'wav',
              'm4a',
              'aac',
              'flac',
              'ogg'
            ]
          },
          { name: 'Videos', extensions: ['mp4', 'mov', 'webm', 'avi', 'mkv'] },
          { name: 'Audio', extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        title: 'Select Media Files'
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return result.filePaths
    } catch (error) {
      console.error('Failed to open file dialog:', error)
      throw error
    }
  })

  // File dialog for export path selection
  ipcMain.handle('dialog:selectExportPath', async (_, defaultFilename: string) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: defaultFilename,
        filters: [
          { name: 'MP4 Videos', extensions: ['mp4'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        title: 'Save Exported Video'
      })

      if (result.canceled || !result.filePath) {
        return null
      }

      return result.filePath
    } catch (error) {
      console.error('Failed to open save dialog:', error)
      throw error
    }
  })

  // Open folder in file explorer
  ipcMain.handle('dialog:openFolder', async (_, folderPath: string) => {
    try {
      const { shell } = require('electron')
      await shell.openPath(folderPath)
    } catch (error) {
      console.error('Failed to open folder:', error)
      throw error
    }
  })
}

/**
 * Unregister all video-related IPC handlers
 */
export function unregisterVideoHandlers(): void {
  ipcMain.removeAllListeners('video:getMetadata')
  ipcMain.removeAllListeners('video:getThumbnail')
  ipcMain.removeAllListeners('video:trimExport')
  ipcMain.removeAllListeners('video:trimExportWithSubtitles')
  ipcMain.removeAllListeners('video:convert')
  ipcMain.removeAllListeners('dialog:selectVideo')
  ipcMain.removeAllListeners('dialog:selectExportPath')
  ipcMain.removeAllListeners('dialog:openFolder')
}
