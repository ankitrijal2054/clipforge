/**
 * Subtitle type definitions for AI-generated subtitles
 */

export interface Subtitle {
  index: number
  startTime: string // "00:00:05,000" (SRT format)
  endTime: string // "00:00:10,500" (SRT format)
  text: string
}

export interface SubtitleState {
  currentSubtitles: Subtitle[] | null
  isGenerating: boolean
  generationProgress: number // 0-100
  generationPhase: string // "Extracting audio", "Transcribing", etc
  error: string | null
  burnSettings: {
    enabled: boolean
    textColor: string // hex color
    fontSize: number // 24-48
    position: 'top' | 'center' | 'bottom'
  }
}

export interface SubtitleGenerationParams {
  clipPath: string
  trimStart: number
  trimEnd: number
  apiKey: string
}

export interface WhisperResponse {
  text: string
  segments: Array<{
    id: number
    seek: number
    start: number
    end: number
    text: string
    tokens: number[]
    temperature: number
    avg_logprob: number
    compression_ratio: number
    no_speech_prob: number
  }>
  language: string
}
