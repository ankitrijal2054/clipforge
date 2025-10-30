/**
 * Subtitle Generation IPC Handlers
 * Handles OpenAI Whisper API calls for subtitle generation
 */

import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import FormData from 'form-data'
import axios from 'axios'
import https from 'https'
import { extractAudioFromClip, cleanupAudioFile } from '../ffmpeg/audioExtraction'
import type { Subtitle, WhisperResponse } from '../../types/subtitles'

/**
 * Convert Whisper response to subtitle array with SRT formatting
 */
function convertWhisperToSubtitles(whisperResponse: WhisperResponse): Subtitle[] {
  if (!whisperResponse.segments) {
    return [
      {
        index: 1,
        startTime: '00:00:00,000',
        endTime: '00:00:00,000',
        text: whisperResponse.text || '(no segments found)'
      }
    ]
  }

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

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    secs
  ).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

/**
 * Send audio file to OpenAI Whisper API and get transcription
 * Uses Axios with https.Agent + retries to prevent SSL issues
 */
async function callWhisperAPI(
  audioPath: string,
  apiKey: string,
  onProgress: (progress: number, phase: string) => void
): Promise<WhisperResponse> {
  onProgress(50, 'Uploading to OpenAI...')

  const form = new FormData()
  form.append('file', fs.createReadStream(audioPath))
  form.append('model', 'whisper-1')
  form.append('language', 'en')
  form.append('response_format', 'verbose_json')

  const agent = new https.Agent({ keepAlive: false, maxSockets: 1 })

  // Retry logic for transient SSL or 502 errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...form.getHeaders()
        },
        httpsAgent: agent,
        maxBodyLength: Infinity,
        timeout: 90000, // 90 seconds
        validateStatus: () => true
      })

      if (!response.data || response.status >= 400) {
        throw new Error(
          `OpenAI API error (${response.status}): ${JSON.stringify(response.data, null, 2)}`
        )
      }

      onProgress(80, 'Processing transcription...')
      return response.data as WhisperResponse
    } catch (err) {
      const msg = String(err)
      if (
        msg.includes('SSLV3_ALERT_BAD_RECORD_MAC') ||
        msg.includes('ECONNRESET') ||
        msg.includes('502') ||
        msg.includes('network')
      ) {
        console.warn(`Whisper upload attempt ${attempt} failed — retrying...`)
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }
      console.error('Whisper API call failed:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to call Whisper API')
    }
  }

  throw new Error('Whisper upload failed after 3 retries')
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
          const mainWindow = BrowserWindow.getFocusedWindow()
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
          // Clean up temp audio file
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
    startTime: s.startTime.replace(',', '.'),
    endTime: s.endTime.replace(',', '.')
  }))

  return (
    'WEBVTT\n\n' +
    vttSubtitles
      .map((subtitle) => `${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}`)
      .join('\n\n')
  )
}
