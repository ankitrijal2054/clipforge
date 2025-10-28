export const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.mov', '.webm'] as const

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const

export const DEFAULT_EXPORT_SETTINGS = {
  format: 'mp4' as const,
  quality: 'high' as const
}

export const UI_CONSTANTS = {
  TIMELINE_HEIGHT: 80,
  TRIM_HANDLE_WIDTH: 8,
  PLAYHEAD_WIDTH: 2,
  MIN_TRIM_DURATION: 0.1, // 100ms
  MAX_ZOOM_LEVEL: 10,
  MIN_ZOOM_LEVEL: 0.1
} as const

export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: 'Space',
  RESET_TRIM: 'KeyR',
  TRIM_IN: 'KeyI',
  TRIM_OUT: 'KeyO',
  ESCAPE: 'Escape'
} as const
