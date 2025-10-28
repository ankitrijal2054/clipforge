// Recording IPC handlers for Phase 2
import { ipcMain, desktopCapturer, dialog } from 'electron'
import { join } from 'path'
import { writeFile, mkdir, stat } from 'fs/promises'
import { app } from 'electron'
import type { ScreenSource, RecordingOptions, MediaDeviceInfo } from '../../types/recording'

// Recording state management
let recordingState = {
  isRecording: false,
  recordingType: null as string | null,
  recordingPath: null as string | null,
  startTime: null as number | null,
  pauseTime: null as number | null,
  totalPauseDuration: 0
}

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
ipcMain.handle('recording:getAudioDevices', async (): Promise<MediaDeviceInfo[]> => {
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
  async (event, options: RecordingOptions): Promise<{ success: boolean; error?: string }> => {
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
      event.sender.send('recording:stateChanged', recordingState)

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
    event,
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

// Clean up old recordings
ipcMain.handle(
  'recording:cleanup',
  async (): Promise<{ success: boolean; cleanedFiles?: number; error?: string }> => {
    try {
      const recordingsDir = join(app.getPath('temp'), 'clipforge', 'recordings')

      // This would implement cleanup logic for old recording files
      // For now, just return success
      return { success: true, cleanedFiles: 0 }
    } catch (error) {
      console.error('Error cleaning up recordings:', error)
      return { success: false, error: 'Failed to cleanup recordings' }
    }
  }
)

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
  'recording:cleanup': 'recording:cleanup'
}
