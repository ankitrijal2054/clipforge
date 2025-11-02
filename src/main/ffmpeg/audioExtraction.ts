/**
 * Audio Extraction Module
 * Extracts audio from video clips for Whisper transcription
 */

import { spawn } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { getFFmpegPath } from './platform'

/**
 * Extract audio from a video clip between trim points
 * Returns path to extracted audio file (WAV format, required by Whisper)
 */
export async function extractAudioFromClip(
  videoPath: string,
  trimStart: number,
  trimEnd: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create temp directory for audio extraction
    const tempDir = path.join(os.tmpdir(), 'clipforge', 'audio-extraction')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Generate output path with timestamp
    const outputPath = path.join(tempDir, `audio_${Date.now()}.wav`)

    // FFmpeg command: extract audio between trim points
    const ffmpegPath = getFFmpegPath()
    const args = [
      '-i',
      videoPath,
      '-ss',
      trimStart.toString(),
      '-to',
      trimEnd.toString(),
      '-vn', // No video
      '-acodec',
      'pcm_s16le', // WAV codec
      '-ar',
      '16000', // 16kHz sample rate (good for speech recognition)
      '-ac',
      '1', // Mono audio
      outputPath
    ]

    const ffmpeg = spawn(ffmpegPath, args)

    // Capture any errors
    let errorOutput = ''
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        // Success - file extracted
        resolve(outputPath)
      } else {
        reject(new Error(`FFmpeg audio extraction failed: ${errorOutput}`))
      }
    })

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`))
    })
  })
}

/**
 * Clean up extracted audio files
 */
export function cleanupAudioFile(audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.unlink(audioPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
