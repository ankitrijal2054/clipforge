import { spawn } from 'child_process'
import { getFFmpegPath, validateFFmpegBinary, getMissingBinaryError } from './platform'

/**
 * Video processing operations using FFmpeg
 */

export interface TrimExportParams {
  inputPath: string
  startTime: number
  endTime: number
  outputPath: string
  duration: number
}

export interface ExportProgress {
  progress: number
  currentTime: number
  totalTime: number
  speed: number
}

/**
 * Trim and export video segment
 */
export async function trimAndExport(
  params: TrimExportParams,
  onProgress?: (progress: ExportProgress) => void
): Promise<string> {
  if (!validateFFmpegBinary()) {
    throw new Error(getMissingBinaryError())
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getFFmpegPath(), [
      '-i',
      params.inputPath,
      '-ss',
      params.startTime.toString(),
      '-to',
      params.endTime.toString(),
      '-c',
      'copy', // Use stream copy for faster processing
      '-avoid_negative_ts',
      'make_zero',
      params.outputPath
    ])

    let errorOutput = ''

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString()
      errorOutput += output

      // Parse progress from FFmpeg output
      if (onProgress) {
        const progress = parseFFmpegProgress(output, params.duration)
        if (progress) {
          onProgress(progress)
        }
      }
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(params.outputPath)
      } else {
        reject(new Error(`FFmpeg export failed with code ${code}: ${errorOutput}`))
      }
    })

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg: ${error.message}`))
    })
  })
}

/**
 * Convert video to different format/quality
 */
export async function convertVideo(
  inputPath: string,
  outputPath: string,
  options: {
    quality?: 'high' | 'medium' | 'low'
    format?: 'mp4' | 'mov' | 'avi'
    resolution?: { width: number; height: number }
  },
  onProgress?: (progress: ExportProgress) => void
): Promise<string> {
  if (!validateFFmpegBinary()) {
    throw new Error(getMissingBinaryError())
  }

  const args = ['-i', inputPath]

  // Add quality settings
  if (options.quality === 'high') {
    args.push('-crf', '18', '-preset', 'slow')
  } else if (options.quality === 'medium') {
    args.push('-crf', '23', '-preset', 'medium')
  } else if (options.quality === 'low') {
    args.push('-crf', '28', '-preset', 'fast')
  }

  // Add resolution scaling
  if (options.resolution) {
    args.push('-vf', `scale=${options.resolution.width}:${options.resolution.height}`)
  }

  // Add output format
  if (options.format === 'mp4') {
    args.push('-f', 'mp4', '-c:v', 'libx264', '-c:a', 'aac')
  } else if (options.format === 'mov') {
    args.push('-f', 'mov', '-c:v', 'libx264', '-c:a', 'aac')
  } else if (options.format === 'avi') {
    args.push('-f', 'avi', '-c:v', 'libx264', '-c:a', 'mp3')
  }

  args.push(outputPath)

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getFFmpegPath(), args)

    let errorOutput = ''

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString()
      errorOutput += output

      if (onProgress) {
        const progress = parseFFmpegProgress(output)
        if (progress) {
          onProgress(progress)
        }
      }
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath)
      } else {
        reject(new Error(`FFmpeg conversion failed with code ${code}: ${errorOutput}`))
      }
    })

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg: ${error.message}`))
    })
  })
}

/**
 * Parse FFmpeg progress output
 */
function parseFFmpegProgress(output: string, totalDuration?: number): ExportProgress | null {
  // Parse time from FFmpeg output (format: time=00:01:23.45)
  const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
  if (!timeMatch) return null

  const hours = parseInt(timeMatch[1])
  const minutes = parseInt(timeMatch[2])
  const seconds = parseInt(timeMatch[3])
  const centiseconds = parseInt(timeMatch[4])

  const currentTime = hours * 3600 + minutes * 60 + seconds + centiseconds / 100

  // Parse speed (format: speed=1.23x)
  const speedMatch = output.match(/speed=([\d.]+)x/)
  const speed = speedMatch ? parseFloat(speedMatch[1]) : 1

  let progress = 0
  if (totalDuration && totalDuration > 0) {
    progress = Math.min((currentTime / totalDuration) * 100, 100)
  }

  return {
    progress,
    currentTime,
    totalTime: totalDuration || 0,
    speed
  }
}

/**
 * Parse time string to seconds
 */
export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    const hours = parseInt(parts[0]) || 0
    const minutes = parseInt(parts[1]) || 0
    const seconds = parseFloat(parts[2]) || 0
    return hours * 3600 + minutes * 60 + seconds
  }
  return 0
}

/**
 * Format seconds to time string (HH:MM:SS)
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}
