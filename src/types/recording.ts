// Recording-related type definitions for Phase 2

export type RecordingType = 'screen' | 'webcam' | 'pip'

export interface RecordingOptions {
  type: RecordingType
  sourceId?: string // For screen recording
  audioDeviceId?: string // For audio input
  quality: 'high' | 'medium' | 'low'
  resolution?: {
    width: number
    height: number
  }
  frameRate?: number
  bitrate?: number
}

export interface RecordingState {
  isRecording: boolean
  recordingType: RecordingType | null
  recordingDuration: number
  recordingPath: string | null
  isPaused: boolean
  startTime: number | null
  pauseTime: number | null
  totalPauseDuration: number
}

export interface MediaDeviceInfo {
  deviceId: string
  kind: 'audioinput' | 'videoinput' | 'audiooutput'
  label: string
  groupId?: string
}

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
  type: 'screen' | 'window'
  display_id?: string
}

export interface RecordingQuality {
  name: 'high' | 'medium' | 'low'
  resolution: {
    width: number
    height: number
  }
  frameRate: number
  bitrate: number
  description: string
}

export const RECORDING_QUALITIES: Record<string, RecordingQuality> = {
  high: {
    name: 'high',
    resolution: { width: 1920, height: 1080 },
    frameRate: 60,
    bitrate: 5000000, // 5 Mbps
    description: 'High (1080p@60fps, 5Mbps)'
  },
  medium: {
    name: 'medium',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    bitrate: 2500000, // 2.5 Mbps
    description: 'Medium (1080p@30fps, 2.5Mbps)'
  },
  low: {
    name: 'low',
    resolution: { width: 1280, height: 720 },
    frameRate: 30,
    bitrate: 1000000, // 1 Mbps
    description: 'Low (720p@30fps, 1Mbps)'
  }
}

export interface RecordingProgress {
  duration: number
  fileSize: number
  isRecording: boolean
  isPaused: boolean
}

export interface RecordingError {
  code: string
  message: string
  details?: any
}

// Webcam-specific types
export interface WebcamConstraints {
  video: {
    deviceId?: { exact: string }
    width?: { ideal: number; min?: number; max?: number }
    height?: { ideal: number; min?: number; max?: number }
    frameRate?: { ideal: number; min?: number; max?: number }
  }
  audio?: {
    deviceId?: { exact: string }
    echoCancellation?: boolean
    noiseSuppression?: boolean
    autoGainControl?: boolean
  }
}

// Picture-in-Picture specific types
export interface PiPOptions {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size: {
    width: number
    height: number
  }
  borderRadius: number
  borderWidth: number
  borderColor: string
  shadow: boolean
}

export const DEFAULT_PIP_OPTIONS: PiPOptions = {
  position: 'bottom-right',
  size: { width: 320, height: 180 },
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#ffffff',
  shadow: true
}
