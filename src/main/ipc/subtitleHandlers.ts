/**
 * Subtitle Generation IPC Handlers
 * Handles OpenAI Whisper API calls for subtitle generation
 */

import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'
import FormData from 'form-data'
import axios from 'axios'
import https from 'https'
import { exec } from 'child_process'
import util from 'util'
import { extractAudioFromClip, cleanupAudioFile } from '../ffmpeg/audioExtraction'
import type { Subtitle, WhisperResponse } from '../../types/subtitles'

const execAsync = util.promisify(exec)

/* -------------------------------------------------------------
 *  Audio utilities
 * -------------------------------------------------------------*/

/**
 * Convert to 16 kHz mono WAV (Whisper-optimized)
 */
async function compressAudioToMono16k(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.wav$/, '_16k.wav')
  await execAsync(`ffmpeg -y -i "${inputPath}" -ac 1 -ar 16000 -c:a pcm_s16le "${outputPath}"`)
  return outputPath
}

/**
 * Split large audio into ~5 min chunks for long clips
 */
async function splitAudioIntoChunks(inputPath: string, chunkDuration = 300): Promise<string[]> {
  const tempDir = path.join(os.tmpdir(), 'clipforge', 'chunks')
  fs.mkdirSync(tempDir, { recursive: true })
  const outputPattern = path.join(tempDir, 'chunk_%03d.wav')
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -f segment -segment_time ${chunkDuration} -c copy "${outputPattern}"`
  )
  return fs
    .readdirSync(tempDir)
    .filter((f) => f.startsWith('chunk_'))
    .map((f) => path.join(tempDir, f))
}

/* -------------------------------------------------------------
 *  Subtitle helpers
 * -------------------------------------------------------------*/

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

  return whisperResponse.segments.map((segment, i) => ({
    index: i + 1,
    startTime: formatTimeToSRT(segment.start),
    endTime: formatTimeToSRT(segment.end),
    text: segment.text.trim()
  }))
}

function formatTimeToSRT(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(
    2,
    '0'
  )},${String(ms).padStart(3, '0')}`
}

/* -------------------------------------------------------------
 *  Whisper API Call (Axios + https.Agent + Retry)
 * -------------------------------------------------------------*/

async function callWhisperAPI(
  audioPath: string,
  apiKey: string,
  onProgress: (p: number, msg: string) => void
): Promise<WhisperResponse> {
  onProgress(50, 'Uploading to OpenAI...')

  const form = new FormData()
  form.append('file', fs.createReadStream(audioPath))
  form.append('model', 'whisper-1')
  form.append('language', 'en')
  form.append('response_format', 'verbose_json')

  const agent = new https.Agent({ keepAlive: false, maxSockets: 1 })

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: { Authorization: `Bearer ${apiKey}`, ...form.getHeaders() },
        httpsAgent: agent,
        maxBodyLength: Infinity,
        timeout: 300000,
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
        msg.includes('socket hang up') ||
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

/* -------------------------------------------------------------
 *  Main IPC Handler
 * -------------------------------------------------------------*/

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
      }: { clipPath: string; trimStart: number; trimEnd: number; apiKey: string }
    ) => {
      try {
        if (!apiKey || !apiKey.startsWith('sk-')) {
          throw new Error('Invalid OpenAI API key')
        }

        const onProgress = (progress: number, phase: string) => {
          const win = BrowserWindow.getFocusedWindow()
          if (win) win.webContents.send('subtitle:progress', { progress, phase })
        }

        onProgress(10, 'Extracting audio...')
        const rawAudioPath = await extractAudioFromClip(clipPath, trimStart, trimEnd)

        // Step 1: compress audio
        onProgress(20, 'Optimizing audio for Whisper...')
        const compressedPath = await compressAudioToMono16k(rawAudioPath)

        try {
          // Step 2: check file size & chunk if needed
          const sizeMB = fs.statSync(compressedPath).size / 1e6
          let whisperResponse: WhisperResponse

          if (sizeMB > 20) {
            onProgress(30, `Splitting large audio (${sizeMB.toFixed(1)} MB) into chunks...`)
            const chunks = await splitAudioIntoChunks(compressedPath)
            let allSegments: any[] = []
            let combinedText = ''

            for (const [i, chunk] of chunks.entries()) {
              onProgress(
                40 + (i / chunks.length) * 40,
                `Transcribing chunk ${i + 1}/${chunks.length}...`
              )
              const resp = await callWhisperAPI(chunk, apiKey, onProgress)
              if (resp.segments) allSegments.push(...resp.segments)
              combinedText += ' ' + resp.text
            }

            whisperResponse = { text: combinedText.trim(), segments: allSegments }
          } else {
            onProgress(30, 'Transcribing with Whisper...')
            whisperResponse = await callWhisperAPI(compressedPath, apiKey, onProgress)
          }

          // Step 3: convert to subtitles
          onProgress(90, 'Formatting subtitles...')
          const subtitles = convertWhisperToSubtitles(whisperResponse)

          onProgress(100, 'Complete!')

          return { success: true, subtitles, text: whisperResponse.text }
        } finally {
          await cleanupAudioFile(rawAudioPath)
          await cleanupAudioFile(compressedPath)
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        console.error('Subtitle generation error:', msg)
        throw new Error(`Subtitle generation failed: ${msg}`)
      }
    }
  )
}

/* -------------------------------------------------------------
 *  Export Helpers
 * -------------------------------------------------------------*/

export function subtitlesToSRT(subs: Subtitle[]): string {
  return subs.map((s) => `${s.index}\n${s.startTime} --> ${s.endTime}\n${s.text}`).join('\n\n')
}

export function subtitlesToVTT(subs: Subtitle[]): string {
  const vtt = subs.map((s) => ({
    ...s,
    startTime: s.startTime.replace(',', '.'),
    endTime: s.endTime.replace(',', '.')
  }))
  return 'WEBVTT\n\n' + vtt.map((s) => `${s.startTime} --> ${s.endTime}\n${s.text}`).join('\n\n')
}
