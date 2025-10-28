// Timeline-related type definitions for Phase 2

export interface TimelineClip {
  id: string
  sourceClipId: string // References VideoClip in media library
  trackId: string
  position: number // Start position on timeline (seconds)
  duration: number // Duration on timeline (after trim)
  trimStart: number // Trim in point (source video time)
  trimEnd: number // Trim out point (source video time)
  layer: number // Z-index for overlapping clips
  locked: boolean
  thumbnail?: string // First-frame thumbnail path
  name?: string // Display name (defaults to source clip name)
}

export interface Track {
  id: string
  type: 'video' | 'audio'
  name: string
  muted: boolean
  locked: boolean
  height: number // Track height in pixels
  order: number // Display order (0 = video, 1 = audio)
  volume: number // Track volume (0-1)
  solo: boolean // Solo mode (mute all other tracks)
}

export interface MultiClipExportParams {
  timelineClips: TimelineClip[]
  outputPath: string
  format: 'mp4' | 'mov' | 'webm' | 'avi' | 'mkv'
  quality: 'high' | 'medium' | 'low'
  // Note: Resolution normalization removed for Phase 2
}

export interface TimelineState {
  timelineClips: TimelineClip[]
  tracks: Track[]
  selectedTimelineClips: string[]
  snapToGrid: boolean
  zoomLevel: number
  scrollOffset: number
  playhead: number
  isPlaying: boolean
  duration: number
}

export interface ClipOperation {
  type: 'move' | 'resize' | 'split' | 'delete' | 'duplicate'
  clipId: string
  data: any // Operation-specific data
}

export interface SnapPoint {
  position: number
  type: 'clip-start' | 'clip-end' | 'playhead' | 'grid'
  clipId?: string
}

export interface DragState {
  isDragging: boolean
  draggedClipId: string | null
  dragStartPosition: number
  dragStartTrackId: string | null
  snapTarget: SnapPoint | null
}

// Timeline interaction types
export interface TimelineInteraction {
  type: 'click' | 'drag' | 'drop' | 'hover' | 'select'
  target: 'clip' | 'track' | 'timeline' | 'playhead'
  clipId?: string
  trackId?: string
  position?: number
  data?: any
}

// Track management types
export interface TrackOperation {
  type: 'add' | 'remove' | 'mute' | 'unmute' | 'lock' | 'unlock' | 'solo' | 'unsolo'
  trackId: string
  data?: any
}

// Clip selection types
export interface ClipSelection {
  primary: string | null // Primary selected clip
  secondary: string[] // Additional selected clips
  all: string[] // All selected clips
}

// Timeline viewport types
export interface TimelineViewport {
  startTime: number
  endTime: number
  pixelsPerSecond: number
  width: number
  height: number
}

// Default track configuration
export const DEFAULT_TRACKS: Track[] = [
  {
    id: 'video-track-1',
    type: 'video',
    name: 'Video Track 1',
    muted: false,
    locked: false,
    height: 120,
    order: 0,
    volume: 1.0,
    solo: false
  },
  {
    id: 'audio-track-1',
    type: 'audio',
    name: 'Audio Track 1',
    muted: false,
    locked: false,
    height: 80,
    order: 1,
    volume: 1.0,
    solo: false
  }
]

// Timeline constants
export const TIMELINE_CONSTANTS = {
  MIN_CLIP_DURATION: 0.1, // Minimum clip duration in seconds
  MAX_ZOOM_LEVEL: 10,
  MIN_ZOOM_LEVEL: 0.1,
  DEFAULT_ZOOM_LEVEL: 1,
  SNAP_THRESHOLD: 5, // Pixels
  TRACK_HEIGHT: {
    VIDEO: 120,
    AUDIO: 80,
    MIN: 60,
    MAX: 200
  },
  GRID_SNAP_INTERVALS: [0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60] // Seconds
} as const
