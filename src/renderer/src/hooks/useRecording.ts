// Recording hook for React components
import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  ScreenSource,
  RecordingOptions,
  RecordingState,
  RecordingQuality,
  MediaDeviceInfo
} from '../../../types/recording'

export interface UseRecordingOptions {
  onRecordingStart?: (options: RecordingOptions) => void
  onRecordingStopped?: (data: { filePath: string; duration: number }) => void
  onRecordingError?: (error: Error) => void
  onStateChanged?: (state: RecordingState) => void
}

export function useRecording(options: UseRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingType, setRecordingType] = useState<RecordingOptions['type'] | null>(null)
  const [quality, setQuality] = useState<RecordingOptions['quality']>('medium')
  const [error, setError] = useState<string | null>(null)
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null)
  const [qualitySettings, setQualitySettings] = useState<Record<string, RecordingQuality>>({})

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Load screen sources
  const loadScreenSources = useCallback(async () => {
    try {
      const sources = await (window.api as any).getScreenSources()
      setScreenSources(sources)
      setError(null)

      // Auto-select first screen source
      if (sources.length > 0 && !selectedSource) {
        const screenSource = sources.find((s: ScreenSource) => s.type === 'screen')
        if (screenSource) {
          setSelectedSource(screenSource.id)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load screen sources'
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [selectedSource, options])

  // Load audio devices
  const loadAudioDevices = useCallback(async () => {
    try {
      // Get system audio devices via navigator
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          kind: 'audioinput' as const,
          label: d.label || `Audio Input ${d.deviceId.substring(0, 5)}`
        }))
      setAudioDevices(audioInputs)
    } catch (err) {
      console.error('Failed to load audio devices:', err)
    }
  }, [])

  // Load quality settings
  const loadQualitySettings = useCallback(async () => {
    try {
      const settings = await (window.api as any).getRecordingQualitySettings()
      setQualitySettings(settings)
    } catch (err) {
      console.error('Failed to load quality settings:', err)
    }
  }, [])

  // Initialize
  useEffect(() => {
    loadScreenSources()
    loadAudioDevices()
    loadQualitySettings()
  }, [loadScreenSources, loadAudioDevices, loadQualitySettings])

  // Subscribe to recording state changes
  useEffect(() => {
    const unsubscribe = (window.api as any).onRecordingStateChanged((state: RecordingState) => {
      setIsRecording(state.isRecording)
      setRecordingType(state.recordingType)
      options.onStateChanged?.(state)
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe?.()
    }
  }, [options])

  // Handle recording stopped event
  useEffect(() => {
    const unsubscribe = (window.api as any).onRecordingStopped(
      (data: { filePath: string; duration: number }) => {
        setIsRecording(false)
        setRecordingDuration(0)
        setRecordingType(null)
        options.onRecordingStopped?.(data)
      }
    )

    return () => {
      unsubscribe?.()
    }
  }, [options])

  // Start duration timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [isRecording, isPaused])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)

      // Validate inputs
      if (recordingType === 'screen' && !selectedSource) {
        throw new Error('Please select a screen source')
      }

      const recordingOptions: RecordingOptions = {
        type: recordingType || 'screen',
        quality,
        sourceId: selectedSource || undefined,
        audioDeviceId: selectedAudioDevice || undefined
      }

      const result = await (window.api as any).startRecording(recordingOptions)

      if (!result.success) {
        throw new Error(result.error || 'Failed to start recording')
      }

      setIsRecording(true)
      setRecordingDuration(0)
      options.onRecordingStart?.(recordingOptions)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording'
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [recordingType, quality, selectedSource, selectedAudioDevice, options])

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      setError(null)
      const result = await (window.api as any).stopRecording()

      if (!result.success) {
        throw new Error(result.error || 'Failed to stop recording')
      }

      setIsRecording(false)
      setRecordingType(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording'
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [options])

  // Pause recording
  const pauseRecording = useCallback(async () => {
    try {
      setError(null)
      const result = await (window.api as any).pauseRecording()

      if (!result.success) {
        throw new Error(result.error || 'Failed to pause recording')
      }

      setIsPaused(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause recording'
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [options])

  // Resume recording
  const resumeRecording = useCallback(async () => {
    try {
      setError(null)
      const result = await (window.api as any).resumeRecording()

      if (!result.success) {
        throw new Error(result.error || 'Failed to resume recording')
      }

      setIsPaused(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume recording'
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [options])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.()
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [])

  return {
    // State
    isRecording,
    isPaused,
    recordingDuration,
    recordingType,
    quality,
    error,
    screenSources,
    audioDevices,
    selectedSource,
    selectedAudioDevice,
    qualitySettings,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearError,

    // Setters
    setRecordingType,
    setQuality,
    setSelectedSource,
    setSelectedAudioDevice,
    loadScreenSources,
    loadAudioDevices
  }
}
