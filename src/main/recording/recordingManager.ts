// Recording manager for coordinating all recording operations
import type { RecordingOptions, RecordingState } from '../../types/recording'
import { getScreenSources, validateScreenRecordingSetup } from './screenRecorder'
import { getMediaRecorderConfig } from './mediaRecorder'

export interface RecordingManager {
  isRecording: boolean
  recordingType: RecordingOptions['type'] | null
  recordingState: RecordingState
  startRecording(options: RecordingOptions): Promise<void>
  stopRecording(): Promise<void>
  pauseRecording(): Promise<void>
  resumeRecording(): Promise<void>
  getState(): RecordingState
}

/**
 * Create a recording manager instance
 */
export function createRecordingManager(): RecordingManager {
  let state: RecordingState = {
    isRecording: false,
    recordingType: null,
    recordingDuration: 0,
    recordingPath: null,
    isPaused: false,
    startTime: null,
    pauseTime: null,
    totalPauseDuration: 0
  }

  return {
    isRecording: false,
    recordingType: null,
    recordingState: state,

    async startRecording(options: RecordingOptions): Promise<void> {
      if (state.isRecording) {
        throw new Error('Recording is already in progress')
      }

      // Validate recording options
      if (!options.type) {
        throw new Error('Recording type is required')
      }

      if (!options.quality) {
        throw new Error('Quality setting is required')
      }

      // Validate screen recording setup if needed
      if (options.type === 'screen') {
        if (!options.sourceId) {
          throw new Error('Screen source is required for screen recording')
        }

        const sources = await getScreenSources()
        const validation = validateScreenRecordingSetup(options.sourceId, sources, options.quality)
        if (!validation.valid) {
          throw new Error(validation.error || 'Screen recording validation failed')
        }
      }

      // Get media recorder config
      getMediaRecorderConfig(options.quality)

      // Update state
      state = {
        isRecording: true,
        recordingType: options.type,
        recordingDuration: 0,
        recordingPath: null,
        isPaused: false,
        startTime: Date.now(),
        pauseTime: null,
        totalPauseDuration: 0
      }

      this.isRecording = true
      this.recordingType = options.type
      this.recordingState = state
    },

    async stopRecording(): Promise<void> {
      if (!state.isRecording) {
        throw new Error('No recording in progress')
      }

      // Calculate duration
      const now = Date.now()
      const totalDuration = now - (state.startTime || now) - state.totalPauseDuration

      // Reset state
      state = {
        isRecording: false,
        recordingType: null,
        recordingDuration: totalDuration / 1000, // Convert to seconds
        recordingPath: null,
        isPaused: false,
        startTime: null,
        pauseTime: null,
        totalPauseDuration: 0
      }

      this.isRecording = false
      this.recordingType = null
      this.recordingState = state
    },

    async pauseRecording(): Promise<void> {
      if (!state.isRecording) {
        throw new Error('No recording in progress')
      }

      if (state.isPaused) {
        throw new Error('Recording is already paused')
      }

      state.isPaused = true
      state.pauseTime = Date.now()
      this.recordingState = state
    },

    async resumeRecording(): Promise<void> {
      if (!state.isRecording) {
        throw new Error('No recording in progress')
      }

      if (!state.isPaused) {
        throw new Error('Recording is not paused')
      }

      // Add pause duration to total
      if (state.pauseTime) {
        state.totalPauseDuration += Date.now() - state.pauseTime
      }

      state.isPaused = false
      state.pauseTime = null
      this.recordingState = state
    },

    getState(): RecordingState {
      return { ...state }
    }
  }
}

// Default recording manager instance
export let recordingManager = createRecordingManager()

/**
 * Reset recording manager
 */
export function resetRecordingManager(): void {
  recordingManager = createRecordingManager()
}
