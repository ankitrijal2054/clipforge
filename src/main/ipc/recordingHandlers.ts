// Recording IPC handlers for Phase 2
import { ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises'
import { app } from 'electron'
import type { ScreenSource, RecordingOptions } from '../../types/recording'

// Import FFmpeg metadata extraction
import { getVideoMetadata } from '../ffmpeg'

// Recording state management
let recordingState = {
  isRecording: false,
  recordingType: null as string | null,
  recordingPath: null as string | null,
  startTime: null as number | null,
  pauseTime: null as number | null,
  totalPauseDuration: 0
}

// Recording metadata storage
interface RecordingMetadata {
  filePath: string
  startTime: number
  duration: number
  resolution: { width: number; height: number }
  frameRate: number
  bitrate: number
  recordingType: string
  audioSettings?: {
    deviceId?: string
    label?: string
  }
}

const recordingMetadata: Map<string, RecordingMetadata> = new Map()

// Get recordings directory
function getRecordingsDirectory(): string {
  return join(app.getPath('temp'), 'clipforge', 'recordings')
}

// Get recorded videos for import
ipcMain.handle('recording:getRecordedVideos', async (): Promise<any[]> => {
  try {
    const recordingsDir = getRecordingsDirectory()
    await mkdir(recordingsDir, { recursive: true })

    const files = await readdir(recordingsDir)
    const recordedVideos = []

    for (const file of files) {
      if (!file.endsWith('.webm') && !file.endsWith('.mp4')) continue

      const filePath = join(recordingsDir, file)
      const stats = await stat(filePath)

      try {
        const metadata = await getVideoMetadata(filePath)
        recordedVideos.push({
          name: file,
          path: filePath,
          fileSize: stats.size,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          bitRate: metadata.bitRate || 0,
          recordedAt: stats.mtimeMs
        })
      } catch (err) {
        console.warn(`Failed to extract metadata for ${file}:`, err)
      }
    }

    return recordedVideos.sort((a, b) => b.recordedAt - a.recordedAt)
  } catch (error) {
    console.error('Error getting recorded videos:', error)
    throw new Error('Failed to get recorded videos')
  }
})

// Import recording to media library
ipcMain.handle(
  'recording:importRecording',
  async (
    _event,
    filePath: string,
    metadata?: RecordingMetadata
  ): Promise<{ success: boolean; clipData?: any; error?: string }> => {
    try {
      // Extract metadata if not provided
      let clipMetadata = metadata
      if (!clipMetadata) {
        const videoMetadata = await getVideoMetadata(filePath)
        const stats = await stat(filePath)

        clipMetadata = {
          filePath,
          startTime: Date.now(),
          duration: videoMetadata.duration,
          resolution: { width: videoMetadata.width, height: videoMetadata.height },
          frameRate: videoMetadata.frameRate || 30,
          bitrate: videoMetadata.bitRate || 0,
          recordingType: recordingState.recordingType || 'unknown'
        }
      }

      // Store metadata
      recordingMetadata.set(filePath, clipMetadata)

      // Create clip data for media library
      const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const filename = filePath.split('/').pop() || 'recording.webm'

      const clipData = {
        id: clipId,
        name: filename,
        path: filePath,
        duration: clipMetadata.duration,
        width: clipMetadata.resolution.width,
        height: clipMetadata.resolution.height,
        fileSize: (await stat(filePath)).size,
        bitRate: clipMetadata.bitrate,
        recordingType: clipMetadata.recordingType,
        recordedAt: clipMetadata.startTime
      }

      console.log('✓ Recording imported to media library:', clipData)

      return { success: true, clipData }
    } catch (error) {
      console.error('Error importing recording:', error)
      return { success: false, error: 'Failed to import recording' }
    }
  }
)

// Get recording metadata
ipcMain.handle(
  'recording:getMetadata',
  async (_event, filePath: string): Promise<RecordingMetadata | null> => {
    try {
      const cached = recordingMetadata.get(filePath)
      if (cached) return cached

      const videoMetadata = await getVideoMetadata(filePath)
      const stats = await stat(filePath)

      const metadata: RecordingMetadata = {
        filePath,
        startTime: stats.mtimeMs,
        duration: videoMetadata.duration,
        resolution: { width: videoMetadata.width, height: videoMetadata.height },
        frameRate: videoMetadata.frameRate || 30,
        bitrate: videoMetadata.bitRate || 0,
        recordingType: recordingState.recordingType || 'unknown'
      }

      recordingMetadata.set(filePath, metadata)
      return metadata
    } catch (error) {
      console.error('Error getting recording metadata:', error)
      return null
    }
  }
)

// Cleanup old recordings (remove files older than 7 days)
ipcMain.handle(
  'recording:cleanup',
  async (): Promise<{ success: boolean; cleanedFiles?: number; error?: string }> => {
    try {
      const recordingsDir = getRecordingsDirectory()
      const files = await readdir(recordingsDir)

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      let cleanedCount = 0

      for (const file of files) {
        const filePath = join(recordingsDir, file)
        const stats = await stat(filePath)

        if (stats.mtimeMs < sevenDaysAgo) {
          await unlink(filePath)
          recordingMetadata.delete(filePath)
          cleanedCount++
          console.log(`Cleaned up old recording: ${file}`)
        }
      }

      return { success: true, cleanedFiles: cleanedCount }
    } catch (error) {
      console.error('Error cleaning up recordings:', error)
      return { success: false, error: 'Failed to cleanup recordings' }
    }
  }
)

// Delete specific recording
ipcMain.handle(
  'recording:delete',
  async (_event, filePath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await unlink(filePath)
      recordingMetadata.delete(filePath)
      console.log(`Deleted recording: ${filePath}`)
      return { success: true }
    } catch (error) {
      console.error('Error deleting recording:', error)
      return { success: false, error: 'Failed to delete recording' }
    }
  }
)

// Get available screen and window sources
ipcMain.handle('recording:getSources', async (): Promise<ScreenSource[]> => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 150, height: 100 }
    })

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      type: source.id.startsWith('screen:') ? 'screen' : 'window',
      display_id: source.display_id
    }))
  } catch (error) {
    console.error('Error getting screen sources:', error)
    throw new Error('Failed to get screen sources')
  }
})

// Get available audio devices
ipcMain.handle('recording:getAudioDevices', async (): Promise<any[]> => {
  try {
    // This will be handled in the renderer process using navigator.mediaDevices.enumerateDevices()
    // We return an empty array here as the actual device enumeration happens in the renderer
    return []
  } catch (error) {
    console.error('Error getting audio devices:', error)
    throw new Error('Failed to get audio devices')
  }
})

// Start recording
ipcMain.handle(
  'recording:start',
  async (_event, options: RecordingOptions): Promise<{ success: boolean; error?: string }> => {
    try {
      if (recordingState.isRecording) {
        return { success: false, error: 'Recording is already in progress' }
      }

      // Update recording state
      recordingState = {
        isRecording: true,
        recordingType: options.type,
        recordingPath: null,
        startTime: Date.now(),
        pauseTime: null,
        totalPauseDuration: 0
      }

      // Send recording started event to renderer
      // event.sender.send('recording:stateChanged', recordingState) // This line was removed as per the edit hint

      return { success: true }
    } catch (error) {
      console.error('Error starting recording:', error)
      return { success: false, error: 'Failed to start recording' }
    }
  }
)

// Stop recording
ipcMain.handle(
  'recording:stop',
  async (event): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    try {
      if (!recordingState.isRecording) {
        return { success: false, error: 'No recording in progress' }
      }

      // Calculate total recording duration
      const now = Date.now()
      const totalDuration =
        now - (recordingState.startTime || now) - recordingState.totalPauseDuration

      // Generate output file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `recording-${timestamp}.webm`
      const outputPath = join(app.getPath('temp'), 'clipforge', 'recordings', fileName)

      // Ensure directory exists
      await mkdir(join(app.getPath('temp'), 'clipforge', 'recordings'), { recursive: true })

      // Reset recording state
      recordingState = {
        isRecording: false,
        recordingType: null,
        recordingPath: outputPath,
        startTime: null,
        pauseTime: null,
        totalPauseDuration: 0
      }

      // Send recording stopped event to renderer
      event.sender.send('recording:stateChanged', recordingState)
      event.sender.send('recording:stopped', { filePath: outputPath, duration: totalDuration })

      return { success: true, filePath: outputPath }
    } catch (error) {
      console.error('Error stopping recording:', error)
      return { success: false, error: 'Failed to stop recording' }
    }
  }
)

// Pause recording
ipcMain.handle('recording:pause', async (event): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!recordingState.isRecording) {
      return { success: false, error: 'No recording in progress' }
    }

    if (recordingState.pauseTime) {
      return { success: false, error: 'Recording is already paused' }
    }

    recordingState.pauseTime = Date.now()
    event.sender.send('recording:stateChanged', recordingState)

    return { success: true }
  } catch (error) {
    console.error('Error pausing recording:', error)
    return { success: false, error: 'Failed to pause recording' }
  }
})

// Resume recording
ipcMain.handle('recording:resume', async (event): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!recordingState.isRecording) {
      return { success: false, error: 'No recording in progress' }
    }

    if (!recordingState.pauseTime) {
      return { success: false, error: 'Recording is not paused' }
    }

    // Add pause duration to total
    recordingState.totalPauseDuration += Date.now() - recordingState.pauseTime
    recordingState.pauseTime = null

    event.sender.send('recording:stateChanged', recordingState)

    return { success: true }
  } catch (error) {
    console.error('Error resuming recording:', error)
    return { success: false, error: 'Failed to resume recording' }
  }
})

// Get current recording state
ipcMain.handle('recording:getState', async (): Promise<typeof recordingState> => {
  return recordingState
})

// Save recording data (called from renderer with blob data)
ipcMain.handle(
  'recording:saveData',
  async (
    _event,
    data: ArrayBuffer,
    fileName: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    try {
      const outputPath = join(app.getPath('temp'), 'clipforge', 'recordings', fileName)

      // Ensure directory exists
      await mkdir(join(app.getPath('temp'), 'clipforge', 'recordings'), { recursive: true })

      // Write the recording data
      const buffer = Buffer.from(data)
      await writeFile(outputPath, buffer)

      return { success: true, filePath: outputPath }
    } catch (error) {
      console.error('Error saving recording data:', error)
      return { success: false, error: 'Failed to save recording data' }
    }
  }
)

// Get recording quality settings
ipcMain.handle('recording:getQualitySettings', async (): Promise<any> => {
  try {
    const { RECORDING_QUALITIES } = await import('../../types/recording')
    return RECORDING_QUALITIES
  } catch (error) {
    console.error('Error getting quality settings:', error)
    return {}
  }
})

// Export the handlers for registration
export const recordingHandlers = {
  'recording:getSources': 'recording:getSources',
  'recording:getAudioDevices': 'recording:getAudioDevices',
  'recording:start': 'recording:start',
  'recording:stop': 'recording:stop',
  'recording:pause': 'recording:pause',
  'recording:resume': 'recording:resume',
  'recording:getState': 'recording:getState',
  'recording:saveData': 'recording:saveData',
  'recording:getQualitySettings': 'recording:getQualitySettings',
  'recording:cleanup': 'recording:cleanup',
  'recording:getRecordedVideos': 'recording:getRecordedVideos',
  'recording:importRecording': 'recording:importRecording',
  'recording:getMetadata': 'recording:getMetadata',
  'recording:delete': 'recording:delete'
}
