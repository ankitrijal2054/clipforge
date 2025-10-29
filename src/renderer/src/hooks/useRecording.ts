// Recording hook for React components - UPDATED with actual capture
import { useState, useCallback, useEffect, useRef } from 'react'
import { useScreenRecorder } from './useScreenRecorder'
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

export interface WebcamDevice {
  deviceId: string
  label: string
}

export function useRecording(options: UseRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingType, setRecordingType] = useState<RecordingOptions['type'] | null>(null)
  const [quality, setQuality] = useState<RecordingOptions['quality']>('medium')
  const [error, setError] = useState<string | null>(null)
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
  const [webcamDevices, setWebcamDevices] = useState<WebcamDevice[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedWebcam, setSelectedWebcam] = useState<string | null>(null)
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null)
  const [qualitySettings, setQualitySettings] = useState<Record<string, RecordingQuality>>({})
  const [cameraPermission, setCameraPermission] = useState(false)
  const [microphonePermission, setMicrophonePermission] = useState(false)
  const [pipPosition, setPipPosition] = useState<
    'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  >('bottom-right')
  const [pipSize, setPipSize] = useState<{ width: number; height: number }>({
    width: 320,
    height: 180
  })

  // Use the screen recorder hook for actual capture
  const screenRecorder = useScreenRecorder()

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Load screen sources
  const loadScreenSources = useCallback(async () => {
    try {
      const sources = await (window.api as any).getScreenSources()
      setScreenSources(sources)
      setError(null)

      // Auto-select first screen source
      if (sources.length > 0) {
        const screenSource = sources.find((s: ScreenSource) => s.type === 'screen')
        if (screenSource) {
          setSelectedSource(screenSource.id)
        } else if (sources.length > 0) {
          // If no screen found, select first source
          setSelectedSource(sources[0].id)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load screen sources'
      setError(errorMessage)
      console.error('Failed to load screen sources:', errorMessage)
    }
  }, [])

  // Load webcam devices
  const loadWebcamDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.substring(0, 5)}`
        }))
      setWebcamDevices(videoInputs)

      // Auto-select first webcam if available
      if (videoInputs.length > 0) {
        setSelectedWebcam(videoInputs[0].deviceId)
      }
    } catch (err) {
      console.error('Failed to load webcam devices:', err)
    }
  }, [])

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

  // Initialize once on mount
  useEffect(() => {
    // Only run once - use ref to track if initialized
    const initialized = { current: false }

    if (!initialized.current) {
      initialized.current = true
      loadScreenSources()
      loadWebcamDevices()
      loadAudioDevices()
      loadQualitySettings()
      // Set permissions to true by default - Electron will handle granting them
      setCameraPermission(true)
      setMicrophonePermission(true)
    }
  }, [])

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

      // Log current state for debugging
      console.log('Starting recording with state:', {
        recordingType,
        selectedSource,
        selectedWebcam,
        cameraPermission,
        screenSourcesCount: screenSources.length
      })

      // Validate inputs based on recording type
      if (!recordingType) {
        throw new Error('Please select a recording mode (Screen, Webcam, or PiP)')
      }

      if (recordingType === 'screen' && !selectedSource) {
        throw new Error('Please select a screen source')
      }

      if (recordingType === 'webcam' && !selectedWebcam) {
        throw new Error('Please select a webcam device')
      }

      if ((recordingType === 'webcam' || recordingType === 'pip') && !cameraPermission) {
        throw new Error('Camera permission denied. Please enable camera access.')
      }

      if (recordingType === 'pip' && !selectedSource) {
        throw new Error('Please select a screen source for PiP')
      }

      if (recordingType === 'pip' && !selectedWebcam) {
        throw new Error('Please select a webcam for PiP')
      }

      const recordingOptions: RecordingOptions = {
        type: recordingType,
        quality,
        sourceId:
          (recordingType === 'screen' || recordingType === 'pip') && selectedSource
            ? selectedSource
            : undefined,
        audioDeviceId: selectedAudioDevice || undefined,
        webcamDeviceId:
          (recordingType === 'webcam' || recordingType === 'pip') && selectedWebcam
            ? selectedWebcam
            : undefined
      }

      console.log('Recording options:', recordingOptions)

      // Use actual screen recorder to capture data
      await screenRecorder.startScreenRecording(recordingOptions)

      setIsRecording(true)
      setRecordingDuration(0)
      startTimeRef.current = Date.now()
      options.onRecordingStart?.(recordingOptions)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording'
      console.error('Recording start error details:', err)
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [
    recordingType,
    quality,
    selectedSource,
    selectedWebcam,
    selectedAudioDevice,
    cameraPermission,
    options,
    screenRecorder,
    screenSources
  ])

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      setError(null)
      await screenRecorder.stopScreenRecording()

      setIsRecording(false)
      setRecordingType(null)
      setRecordingDuration(0)

      // Calculate duration
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0
      options.onRecordingStopped?.({ filePath: '', duration })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording'
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [options, screenRecorder])

  // Pause recording
  const pauseRecording = useCallback(async () => {
    try {
      setError(null)
      screenRecorder.pauseScreenRecording()
      setIsPaused(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause recording'
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [options, screenRecorder])

  // Resume recording
  const resumeRecording = useCallback(async () => {
    try {
      setError(null)
      screenRecorder.resumeScreenRecording()
      setIsPaused(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume recording'
      setError(errorMessage)
      options.onRecordingError?.(new Error(errorMessage))
    }
  }, [options, screenRecorder])

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
    webcamDevices,
    audioDevices,
    selectedSource,
    selectedWebcam,
    selectedAudioDevice,
    qualitySettings,
    cameraPermission,
    microphonePermission,
    pipPosition,
    pipSize,

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
    setSelectedWebcam,
    setSelectedAudioDevice,
    loadScreenSources,
    loadWebcamDevices,
    loadAudioDevices,
    setPipPosition,
    setPipSize
  }
}
