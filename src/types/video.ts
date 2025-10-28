export interface VideoClip {
  id: string
  name: string
  path: string
  duration: number
  width: number
  height: number
  fileSize: number
  bitRate: number
  thumbnail?: string
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fileSize: number
  bitRate: number
}

export interface TimelineClip {
  clipId: string
  startTime: number
  endTime: number
  trimStart: number
  trimEnd: number
}

export interface ExportSettings {
  format: 'mp4'
  quality: 'high' | 'medium' | 'low'
  bitrate?: number
}

export interface TrimExportParams {
  inputPath: string
  startTime: number
  endTime: number
  outputPath: string
  duration: number
}
