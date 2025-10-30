/**
 * Subtitle Generation IPC Handlers
 * Handles OpenAI Whisper API calls for subtitle generation
 */

import { ipcMain } from 'electron'
import fs from 'fs'
import FormData from 'form-data'
import { extractAudioFromClip, cleanupAudioFile } from '../ffmpeg/audioExtraction'
import type { Subtitle, WhisperResponse } from '../../types/subtitles'

/**
 * Convert Whisper response to subtitle array with SRT formatting
 */
function convertWhisperToSubtitles(whisperResponse: WhisperResponse): Subtitle[] {
  return whisperResponse.segments.map((segment, index) => ({
    index: index + 1,
    startTime: formatTimeToSRT(segment.start),
    endTime: formatTimeToSRT(segment.end),
    text: segment.text.trim()
  }))
}

/**
 * Convert seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatTimeToSRT(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.round((seconds % 1) * 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

/**
 * Send audio file to OpenAI Whisper API and get transcription
 */
async function callWhisperAPI(
  audioPath: string,
  apiKey: string,
  onProgress: (progress: number, phase: string) => void
): Promise<WhisperResponse> {
  onProgress(50, 'Uploading to OpenAI...')

  const form = new FormData()

  // Read file as buffer instead of stream for better compatibility
  const fileBuffer = fs.readFileSync(audioPath)
  form.append('file', fileBuffer, {
    filename: 'audio.wav'
  })
  form.append('model', 'whisper-1')
  form.append('language', 'en')

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      body: form as any
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error (${response.status}): ${error}`)
    }

    onProgress(80, 'Processing transcription...')
    return (await response.json()) as WhisperResponse
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to call Whisper API')
  }
}

/**
 * Main handler for subtitle generation
 */
export function registerSubtitleHandlers(): void {
  ipcMain.handle(
    'clip:generateSubtitles',
    async (
      _event,
      {
        clipPath,
        trimStart,
        trimEnd,
        apiKey
      }: {
        clipPath: string
        trimStart: number
        trimEnd: number
        apiKey: string
      }
    ) => {
      try {
        // Validate API key
        if (!apiKey || !apiKey.startsWith('sk-')) {
          throw new Error('Invalid OpenAI API key')
        }

        // Step 1: Extract audio
        const onProgress = (progress: number, phase: string) => {
          // Emit progress through main window
          const mainWindow = require('electron').BrowserWindow.getFocusedWindow()
          if (mainWindow) {
            mainWindow.webContents.send('subtitle:progress', { progress, phase })
          }
        }

        onProgress(10, 'Extracting audio...')
        const audioPath = await extractAudioFromClip(clipPath, trimStart, trimEnd)

        try {
          // Step 2: Call Whisper API
          onProgress(30, 'Transcribing with Whisper...')
          const whisperResponse = await callWhisperAPI(audioPath, apiKey, onProgress)

          // Step 3: Convert to subtitle format
          onProgress(90, 'Formatting subtitles...')
          const subtitles = convertWhisperToSubtitles(whisperResponse)

          onProgress(100, 'Complete!')

          return {
            success: true,
            subtitles,
            text: whisperResponse.text
          }
        } finally {
          // Clean up audio file
          await cleanupAudioFile(audioPath)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Subtitle generation error:', errorMessage)
        throw new Error(`Subtitle generation failed: ${errorMessage}`)
      }
    }
  )
}

/**
 * Export subtitles as SRT string
 */
export function subtitlesToSRT(subtitles: Subtitle[]): string {
  return subtitles
    .map(
      (subtitle) =>
        `${subtitle.index}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}`
    )
    .join('\n\n')
}

/**
 * Export subtitles as VTT string (for burning into video)
 */
export function subtitlesToVTT(subtitles: Subtitle[]): string {
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
