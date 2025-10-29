// Webcam recording implementation using getUserMedia API
import type { RecordingOptions } from '../../types/recording'
import { generateRecordingFileName } from './mediaRecorder'

export interface WebcamDevice {
  deviceId: string
  label: string
  kind: 'videoinput' | 'audioinput'
  capabilities?: {
    width?: { min: number; max: number; ideal: number }
    height?: { min: number; max: number; ideal: number }
    frameRate?: { min: number; max: number; ideal: number }
  }
}

export interface WebcamRecordingSession {
  deviceId: string
  deviceLabel: string
  audioDeviceId?: string
  quality: RecordingOptions['quality']
  startTime: number
  chunks: Blob[]
}

/**
 * Get supported video constraints based on quality
 */
export function getWebcamConstraints(
  quality: RecordingOptions['quality'],
  deviceId?: string
): MediaStreamConstraints {
  const qualityMap: Record<string, { width: number; height: number; frameRate: number }> = {
    high: { width: 1920, height: 1080, frameRate: 60 },
    medium: { width: 1920, height: 1080, frameRate: 30 },
    low: { width: 1280, height: 720, frameRate: 30 }
  }

  const qualitySettings = qualityMap[quality] || qualityMap.medium

  return {
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: {
        min: 320,
        ideal: qualitySettings.width,
        max: qualitySettings.width
      },
      height: {
        min: 240,
        ideal: qualitySettings.height,
        max: qualitySettings.height
      },
      frameRate: {
        ideal: qualitySettings.frameRate,
        max: qualitySettings.frameRate
      },
      facingMode: 'user' // Front-facing camera
    },
    audio: true // Include audio from webcam
  }
}

/**
 * Get audio-only constraints for webcam microphone
 */
export function getWebcamAudioConstraints(deviceId?: string): MediaStreamConstraints {
  return {
    audio: deviceId
      ? {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
    video: false
  }
}

/**
 * Get combined audio/video constraints for webcam
 */
export function getWebcamAudioVideoConstraints(
  quality: RecordingOptions['quality'],
  videoDeviceId?: string,
  audioDeviceId?: string
): MediaStreamConstraints {
  const qualityMap: Record<string, { width: number; height: number; frameRate: number }> = {
    high: { width: 1920, height: 1080, frameRate: 60 },
    medium: { width: 1920, height: 1080, frameRate: 30 },
    low: { width: 1280, height: 720, frameRate: 30 }
  }

  const qualitySettings = qualityMap[quality] || qualityMap.medium

  return {
    video: {
      deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
      width: {
        min: 320,
        ideal: qualitySettings.width,
        max: qualitySettings.width
      },
      height: {
        min: 240,
        ideal: qualitySettings.height,
        max: qualitySettings.height
      },
      frameRate: {
        ideal: qualitySettings.frameRate,
        max: qualitySettings.frameRate
      },
      facingMode: 'user'
    },
    audio: audioDeviceId
      ? {
          deviceId: { exact: audioDeviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
  }
}

/**
 * Get recording filename for webcam
 */
export function getWebcamRecordingFileName(): string {
  return generateRecordingFileName('webcam')
}

/**
 * Validate webcam recording setup
 */
export function validateWebcamRecordingSetup(
  deviceId: string,
  devices: WebcamDevice[],
  quality: RecordingOptions['quality']
): { valid: boolean; error?: string } {
  // Validate device ID
  if (!deviceId || deviceId.length === 0) {
    return { valid: false, error: 'No webcam device selected' }
  }

  // Validate device exists
  const deviceExists = devices.some((device) => device.deviceId === deviceId)
  if (!deviceExists) {
    return { valid: false, error: 'Selected webcam device is not available' }
  }

  // Validate quality
  const validQualities = ['high', 'medium', 'low']
  if (!validQualities.includes(quality)) {
    return { valid: false, error: 'Invalid quality setting' }
  }

  return { valid: true }
}

/**
 * Get available video input devices
 */
export async function getVideoInputDevices(): Promise<WebcamDevice[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices
      .filter((device) => device.kind === 'videoinput')
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.substring(0, 5)}`,
        kind: 'videoinput' as const
      }))
  } catch (error) {
    console.error('Error enumerating video devices:', error)
    return []
  }
}

/**
 * Check if device supports specific resolution
 */
export async function checkWebcamCapabilities(
  deviceId: string,
  targetResolution: { width: number; height: number }
): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: targetResolution.width },
        height: { ideal: targetResolution.height }
      }
    })

    // Get actual video settings
    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      const settings = videoTrack.getSettings()
      stream.getTracks().forEach((track) => track.stop())

      const width = settings.width || 0
      const height = settings.height || 0
      return (
        Math.abs(width - targetResolution.width) < 10 &&
        Math.abs(height - targetResolution.height) < 10
      )
    }

    stream.getTracks().forEach((track) => track.stop())
    return false
  } catch (error) {
    console.error('Error checking webcam capabilities:', error)
    return false
  }
}

/**
 * Get actual webcam capabilities
 */
export async function getWebcamCapabilities(deviceId: string): Promise<{
  width: number
  height: number
  frameRate: number
} | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } }
    })

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      const settings = videoTrack.getSettings()
      stream.getTracks().forEach((track) => track.stop())

      return {
        width: settings.width || 1280,
        height: settings.height || 720,
        frameRate: settings.frameRate || 30
      }
    }

    stream.getTracks().forEach((track) => track.stop())
    return null
  } catch (error) {
    console.error('Error getting webcam capabilities:', error)
    return null
  }
}

/**
 * Check microphone permissions
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as any })
    return result.state === 'granted' || result.state === 'prompt'
  } catch (error) {
    console.error('Error checking microphone permission:', error)
    return false
  }
}

/**
 * Check camera permissions
 */
export async function checkCameraPermission(): Promise<boolean> {
  try {
    const result = await navigator.permissions.query({ name: 'camera' as any })
    return result.state === 'granted' || result.state === 'prompt'
  } catch (error) {
    console.error('Error checking camera permission:', error)
    return false
  }
}

/**
 * Request camera and microphone permissions
 */
export async function requestWebcamPermissions(): Promise<{
  camera: boolean
  microphone: boolean
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })

    // Stop the stream after we got permission
    stream.getTracks().forEach((track) => track.stop())

    return { camera: true, microphone: true }
  } catch (error) {
    console.error('Error requesting permissions:', error)
    return { camera: false, microphone: false }
  }
}

/**
 * Estimate webcam file size
 */
export function estimateWebcamFileSize(
  durationSeconds: number,
  quality: RecordingOptions['quality']
): string {
  const bitrateMap: Record<string, number> = {
    high: 5000000,
    medium: 2500000,
    low: 1000000
  }

  const bitrate = bitrateMap[quality] || bitrateMap.medium
  const bytes = (durationSeconds * bitrate) / 8
  const mb = bytes / (1024 * 1024)

  return `~${mb.toFixed(1)} MB`
}
