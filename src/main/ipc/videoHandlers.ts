import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { getVideoMetadata, getVideoThumbnail } from '../ffmpeg/metadata'
import { trimAndExport, convertVideo, ExportProgress } from '../ffmpeg/operations'
import { VideoMetadata } from '../../types/video'

/**
 * IPC handlers for video operations
 */

export interface VideoMetadataParams {
  filePath: string
}

export interface VideoThumbnailParams {
  filePath: string
  timeInSeconds: number
  outputPath: string
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
export function registerVideoHandlers(): void {
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
}

/**
 * Unregister all video-related IPC handlers
 */
export function unregisterVideoHandlers(): void {
  ipcMain.removeAllListeners('video:getMetadata')
  ipcMain.removeAllListeners('video:getThumbnail')
  ipcMain.removeAllListeners('video:trimExport')
  ipcMain.removeAllListeners('video:convert')
}
