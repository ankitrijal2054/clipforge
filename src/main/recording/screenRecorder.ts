// Screen recording implementation using desktopCapturer API
import { desktopCapturer } from 'electron'
import type { ScreenSource, RecordingOptions } from '../../types/recording'
import { generateRecordingFileName } from './mediaRecorder'

export interface ScreenRecordingSession {
  sourceId: string
  sourceName: string
  audioDeviceId?: string
  quality: RecordingOptions['quality']
  startTime: number
  chunks: Blob[]
}

/**
 * Get available screen and window sources for recording
 */
export async function getScreenSources(): Promise<ScreenSource[]> {
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
}

/**
 * Validate screen source
 */
export function validateScreenSource(sourceId: string, sources: ScreenSource[]): boolean {
  return sources.some((source) => source.id === sourceId)
}

/**
 * Get screen source by ID
 */
export function getScreenSourceById(
  sourceId: string,
  sources: ScreenSource[]
): ScreenSource | null {
  return sources.find((source) => source.id === sourceId) || null
}

/**
 * Get media stream constraints for screen recording
 */
export function getScreenRecordingConstraints(
  sourceId: string,
  quality: RecordingOptions['quality']
) {
  const qualityMap: Record<string, { width: number; height: number; frameRate: number }> = {
    high: { width: 1920, height: 1080, frameRate: 60 },
    medium: { width: 1920, height: 1080, frameRate: 30 },
    low: { width: 1280, height: 720, frameRate: 30 }
  }

  const qualitySettings = qualityMap[quality] || qualityMap.medium

  return {
    audio: false, // We'll handle audio separately
    video: {
      mandatory: {
        chromeMediaSource: 'desktop' as any,
        chromeMediaSourceId: sourceId,
        maxWidth: qualitySettings.width,
        maxHeight: qualitySettings.height,
        maxFrameRate: qualitySettings.frameRate
      }
    }
  }
}

/**
 * Get audio constraints for microphone or system audio
 */
export function getAudioConstraints(audioDeviceId?: string) {
  return {
    audio: audioDeviceId
      ? {
          deviceId: { exact: audioDeviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      : false,
    video: false
  }
}

/**
 * Create composite media stream combining screen and audio
 */
export function createCompositeStream(
  screenStream: MediaStream,
  audioStream: MediaStream | null,
  audioContext: AudioContext | null
): MediaStream {
  // If no audio stream, just return screen stream
  if (!audioStream || !audioContext) {
    return screenStream
  }

  // Get video track from screen
  const videoTrack = screenStream.getVideoTracks()[0]
  if (!videoTrack) {
    return screenStream
  }

  // Get audio track from audio stream
  const audioTrack = audioStream.getAudioTracks()[0]
  if (!audioTrack) {
    return screenStream
  }

  // Create new media stream with video from screen and audio from audio stream
  const compositeStream = new MediaStream()
  compositeStream.addTrack(videoTrack)
  compositeStream.addTrack(audioTrack)

  return compositeStream
}

/**
 * Get recording filename based on type
 */
export function getRecordingFileName(sourceType: string): string {
  const type = sourceType.startsWith('screen:') ? 'screen' : 'window'
  return generateRecordingFileName(type)
}

/**
 * Estimate recording file size
 */
export function estimateRecordingSize(
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

/**
 * Get supported audio devices
 */
export async function getAudioDevices(): Promise<
  Array<{
    deviceId: string
    label: string
    kind: string
  }>
> {
  try {
    // This will be called from the renderer process
    // We return empty array here as enumeration happens in renderer
    return []
  } catch (error) {
    console.error('Error getting audio devices:', error)
    return []
  }
}

/**
 * Validate screen recording setup
 */
export function validateScreenRecordingSetup(
  sourceId: string,
  sources: ScreenSource[],
  quality: RecordingOptions['quality']
): { valid: boolean; error?: string } {
  // Validate source
  if (!sourceId || sourceId.length === 0) {
    return { valid: false, error: 'No screen source selected' }
  }

  // Validate source exists
  if (!validateScreenSource(sourceId, sources)) {
    return { valid: false, error: 'Selected screen source is not available' }
  }

  // Validate quality
  const validQualities = ['high', 'medium', 'low']
  if (!validQualities.includes(quality)) {
    return { valid: false, error: 'Invalid quality setting' }
  }

  return { valid: true }
}

/**
 * Get screen recording display info
 */
export function getDisplayInfo(
  sourceId: string,
  sources: ScreenSource[]
): { displayId?: string; type: string } {
  const source = getScreenSourceById(sourceId, sources)
  if (!source) {
    return { type: 'unknown' }
  }

  return {
    displayId: source.display_id,
    type: source.type
  }
}
