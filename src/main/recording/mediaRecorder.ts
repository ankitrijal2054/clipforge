// MediaRecorder wrapper for recording functionality
import { app } from 'electron'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import type { RecordingOptions } from '../../types/recording'
import { RECORDING_QUALITIES } from '../../types/recording'

export interface MediaRecorderConfig {
  mimeType: string
  videoBitsPerSecond: number
  audioBitsPerSecond?: number
}

export interface RecordingResult {
  filePath: string
  duration: number
  fileSize: number
  mimeType: string
}

/**
 * Get MediaRecorder configuration based on quality settings
 */
export function getMediaRecorderConfig(quality: RecordingOptions['quality']): MediaRecorderConfig {
  const qualitySettings = RECORDING_QUALITIES[quality]

  return {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: qualitySettings.bitrate,
    audioBitsPerSecond: 128000 // 128 kbps for audio
  }
}

/**
 * Generate unique recording filename
 */
export function generateRecordingFileName(type: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('-').slice(0, -1).join('-')
  const random = Math.random().toString(36).substring(2, 8)
  return `recording-${type}-${timestamp}-${random}.webm`
}

/**
 * Get recording output directory
 */
export async function getRecordingOutputPath(fileName: string): Promise<string> {
  const recordingsDir = join(app.getPath('temp'), 'clipforge', 'recordings')
  await mkdir(recordingsDir, { recursive: true })
  return join(recordingsDir, fileName)
}

/**
 * Save recording blob to file
 */
export async function saveRecordingBlob(blob: Blob, fileName: string): Promise<RecordingResult> {
  try {
    const outputPath = await getRecordingOutputPath(fileName)
    const buffer = await blob.arrayBuffer()
    await writeFile(outputPath, Buffer.from(buffer))

    return {
      filePath: outputPath,
      duration: 0, // Will be set by recorder
      fileSize: blob.size,
      mimeType: blob.type
    }
  } catch (error) {
    throw new Error(
      `Failed to save recording: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Validate MediaRecorder support for a given mime type
 */
export function isMediaRecorderSupported(): boolean {
  // This will be checked in the renderer process
  // For now, return true as we're in the main process
  return true
}

/**
 * Get supported mime types for MediaRecorder
 */
export function getSupportedMimeTypes(): string[] {
  return ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
}

/**
 * Recording state management
 */
export interface RecorderState {
  isRecording: boolean
  isPaused: boolean
  startTime: number
  pausedTime: number
  chunks: Blob[]
  recordingStream: MediaStream | null
}

/**
 * Initialize recorder state
 */
export function initializeRecorderState(): RecorderState {
  return {
    isRecording: false,
    isPaused: false,
    startTime: 0,
    pausedTime: 0,
    chunks: [],
    recordingStream: null
  }
}

/**
 * Calculate actual recording duration accounting for pauses
 */
export function calculateRecordingDuration(
  startTime: number,
  endTime: number,
  totalPauseDuration: number
): number {
  return (endTime - startTime - totalPauseDuration) / 1000 // Convert to seconds
}

/**
 * Format recording duration for display
 */
export function formatRecordingDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`)
  parts.push(`${secs}s`)

  return parts.join(' ')
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * Estimate file size based on duration and bitrate
 */
export function estimateFileSize(durationSeconds: number, bitrate: number): number {
  return (durationSeconds * bitrate) / 8 // Bitrate is in bps, convert to bytes
}

/**
 * Quality presets with descriptions
 */
export const QUALITY_PRESETS = {
  high: {
    name: 'High Quality',
    description: '1080p @ 60fps, 5 Mbps',
    resolution: '1920x1080',
    frameRate: 60,
    bitrate: 5000000
  },
  medium: {
    name: 'Medium Quality',
    description: '1080p @ 30fps, 2.5 Mbps',
    resolution: '1920x1080',
    frameRate: 30,
    bitrate: 2500000
  },
  low: {
    name: 'Low Quality',
    description: '720p @ 30fps, 1 Mbps',
    resolution: '1280x720',
    frameRate: 30,
    bitrate: 1000000
  }
} as const
