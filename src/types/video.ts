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
  frameRate?: number
  codec?: string
  filename?: string
}

export interface TimelineClip {
  clipId: string
  startTime: number
  endTime: number
  trimStart: number
  trimEnd: number
}

export interface ExportSettings {
  format: 'mp4' | 'mov' | 'avi'
  quality: 'high' | 'medium' | 'low'
  bitrate?: number
  resolution?: { width: number; height: number }
}

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

export interface VideoThumbnailParams {
  filePath: string
  timeInSeconds: number
  outputPath: string
}

export interface ConvertVideoParams {
  inputPath: string
  outputPath: string
  quality?: 'high' | 'medium' | 'low'
  format?: 'mp4' | 'mov' | 'avi'
  resolution?: { width: number; height: number }
}
