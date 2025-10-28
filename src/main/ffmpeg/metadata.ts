import { spawn } from 'child_process'
import { getFFprobePath, validateFFprobeBinary, getMissingBinaryError } from './platform'
import { VideoMetadata } from '../../types/video'

/**
 * Video metadata extraction using FFprobe
 */

export interface FFprobeFormat {
  duration: string
  size: string
  bit_rate: string
  filename: string
}

export interface FFprobeStream {
  width: number
  height: number
  bit_rate: string
  codec_name: string
  codec_type: string
  r_frame_rate: string
}

export interface FFprobeOutput {
  format: FFprobeFormat
  streams: FFprobeStream[]
}

/**
 * Extract video metadata using FFprobe
 */
export async function getVideoMetadata(filePath: string): Promise<VideoMetadata> {
  if (!validateFFprobeBinary()) {
    throw new Error(getMissingBinaryError())
  }

  return new Promise((resolve, reject) => {
    const ffprobe = spawn(getFFprobePath(), [
      '-v',
      'error',
      '-show_entries',
      'format=duration,size,bit_rate,filename:stream=width,height,bit_rate,codec_name,codec_type,r_frame_rate',
      '-of',
      'json',
      filePath
    ])

    let output = ''
    let errorOutput = ''

    ffprobe.stdout.on('data', (data) => {
      output += data.toString()
    })

    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const metadata: FFprobeOutput = JSON.parse(output)
          const format = metadata.format
          const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video')

          if (!videoStream) {
            reject(new Error('No video stream found in file'))
            return
          }

          const duration = parseFloat(format.duration)
          const width = videoStream.width
          const height = videoStream.height
          const fileSize = parseInt(format.size) || 0
          const bitRate = parseInt(format.bit_rate) || parseInt(videoStream.bit_rate) || 0
          const frameRate = parseFrameRate(videoStream.r_frame_rate)

          resolve({
            duration,
            width,
            height,
            fileSize,
            bitRate,
            frameRate,
            codec: videoStream.codec_name,
            filename: format.filename
          })
        } catch (error) {
          reject(
            new Error(
              `Failed to parse metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          )
        }
      } else {
        reject(new Error(`FFprobe failed with code ${code}: ${errorOutput}`))
      }
    })

    ffprobe.on('error', (error) => {
      reject(new Error(`Failed to start FFprobe: ${error.message}`))
    })
  })
}

/**
 * Parse frame rate string (e.g., "30/1" or "29.97") to number
 */
function parseFrameRate(frameRateStr: string): number {
  if (!frameRateStr) return 0

  if (frameRateStr.includes('/')) {
    const [numerator, denominator] = frameRateStr.split('/').map(Number)
    return denominator !== 0 ? numerator / denominator : 0
  }

  return parseFloat(frameRateStr) || 0
}

/**
 * Get video thumbnail at specific time
 */
export async function getVideoThumbnail(
  filePath: string,
  timeInSeconds: number,
  outputPath: string
): Promise<string> {
  if (!validateFFprobeBinary()) {
    throw new Error(getMissingBinaryError())
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getFFprobePath().replace('ffprobe', 'ffmpeg'), [
      '-i',
      filePath,
      '-ss',
      timeInSeconds.toString(),
      '-vframes',
      '1',
      '-q:v',
      '2',
      outputPath
    ])

    let errorOutput = ''

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath)
      } else {
        reject(new Error(`Failed to generate thumbnail: ${errorOutput}`))
      }
    })

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg for thumbnail: ${error.message}`))
    })
  })
}
