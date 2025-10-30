/**
 * Subtitle Burning Module
 * Burns subtitles into video files using FFmpeg text overlay
 */

import { spawn } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { getFFmpegPath } from './platform'
import type { Subtitle } from '../../types/subtitles'

/**
 * Burn subtitles into a video file
 * Creates a temporary VTT file and uses FFmpeg drawtext filter
 */
export async function burnSubtitlesIntoVideo(
  inputVideoPath: string,
  subtitles: Subtitle[],
  outputPath: string,
  settings: {
    textColor?: string // hex color like #FFFFFF
    fontSize?: number // default 32
    position?: 'top' | 'center' | 'bottom' // default bottom
  } = {}
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Default settings
      const fontSize = settings.fontSize || 32
      const textColor = settings.textColor || 'white'

      // Create temp VTT file
      const tempDir = path.join(os.tmpdir(), 'clipforge', 'subtitles-burn')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      const vttPath = path.join(tempDir, `subtitles_${Date.now()}.vtt`)

      // Convert subtitles to VTT format
      const vttContent = subtitlesToVTT(subtitles)
      fs.writeFileSync(vttPath, vttContent)

      try {
        // FFmpeg command with subtitle overlay
        const ffmpegPath = getFFmpegPath()
        const args = [
          '-i',
          inputVideoPath,
          '-vf',
          `subtitles='${vttPath.replace(/\\/g, '/')}':force_style='FontSize=${fontSize},PrimaryColour=&H${hexToFFmpegColor(textColor)}&,OutlineColour=&H000000&,Outline=1'`,
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          outputPath
        ]

        const ffmpeg = spawn(ffmpegPath, args)

        let errorOutput = ''
        ffmpeg.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })

        ffmpeg.on('close', (code) => {
          // Clean up VTT file
          fs.unlink(vttPath, () => {})

          if (code === 0) {
            resolve()
          } else {
            reject(new Error(`FFmpeg subtitle burning failed: ${errorOutput}`))
          }
        })

        ffmpeg.on('error', (err) => {
          fs.unlink(vttPath, () => {})
          reject(new Error(`Failed to start FFmpeg: ${err.message}`))
        })
      } catch (error) {
        fs.unlink(vttPath, () => {})
        throw error
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Convert hex color to FFmpeg ASS format (BGR instead of RGB)
 * #FFFFFF -> &HFFFFFF&
 */
function hexToFFmpegColor(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')

  // If 6 chars, convert RGB to BGR
  if (hex.length === 6) {
    const r = hex.substring(0, 2)
    const g = hex.substring(2, 4)
    const b = hex.substring(4, 6)
    return b + g + r
  }

  return hex
}

/**
 * Convert subtitles to VTT format for FFmpeg subtitles filter
 */
function subtitlesToVTT(subtitles: Subtitle[]): string {
  const vttSubtitles = subtitles.map((s) => ({
    ...s,
    startTime: s.startTime.replace(',', '.'), // VTT uses . instead of ,
    endTime: s.endTime.replace(',', '.')
  }))

  return (
    'WEBVTT\n\n' +
    vttSubtitles
      .map((subtitle) => `${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}`)
      .join('\n\n')
  )
}

/**
 * Create temporary VTT file and return path
 */
export function createVTTFile(subtitles: Subtitle[]): string {
  const tempDir = path.join(os.tmpdir(), 'clipforge', 'subtitles-temp')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const vttPath = path.join(tempDir, `subtitles_${Date.now()}.vtt`)
  const vttContent = subtitlesToVTT(subtitles)
  fs.writeFileSync(vttPath, vttContent)

  return vttPath
}

/**
 * Clean up temporary VTT file
 */
export function cleanupVTTFile(vttPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.unlink(vttPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
