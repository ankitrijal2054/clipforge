import { VideoClip, ExportSettings } from './video'
import { TimelineClip, TimelineState } from './timeline'

export interface EditorStore extends TimelineState {
  // Media
  clips: VideoClip[]
  selectedClip: VideoClip | null
  importHistory: string[]

  // Timeline (single-clip, legacy)
  timelineClips: TimelineClip[]
  playhead: number
  duration: number
  zoomLevel: number
  timelineScrollOffset: number

  // Playback
  isPlaying: boolean
  playbackRate: number
  volume: number
  // isMuted is now part of TimelineState for track-specific muting

  // Timeline playback (Phase 2C, shared across components)
  timelineCurrentTime: number
  timelineIsPlaying: boolean

  // Trim
  trimStart: number
  trimEnd: number
  isDragging: boolean
  activeHandle: 'start' | 'end' | null
  dragStartX: number
  dragStartTrimValue: number

  // Export
  isExporting: boolean
  exportProgress: number
  exportSettings: ExportSettings

  // UI State
  activeModal: string | null
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'

  // Media Actions
  addClip: (clip: VideoClip) => void
  selectClip: (id: string) => void
  removeClip: (id: string) => void

  // Timeline Actions (single-clip, legacy)
  setTrimPoints: (start: number, end: number) => void
  updateTrimStart: (time: number) => void
  updateTrimEnd: (time: number) => void
  setActiveHandle: (handle: 'start' | 'end' | null) => void
  setDragStartValues: (x: number, trimValue: number) => void
  setPlayhead: (time: number) => void
  setZoomLevel: (zoomLevel: number) => void
  setTimelineScrollOffset: (offset: number) => void
  resetTrim: () => void

  // Multi-Clip Timeline Actions (Phase 2B/2C)
  addClipToTrack: (trackType: 'video' | 'audio', libraryClip: VideoClip) => void
  removeClipFromTrack: (trackType: 'video' | 'audio', clipId: string) => void
  moveClip: (trackType: 'video' | 'audio', clipId: string, newPosition: number) => void
  updateClipTrim: (clipId: string, trimStart: number, trimEnd: number) => void
  splitClip: (clipId: string, splitTime: number) => void
  selectTimelineClip: (clipId: string | null) => void
  toggleTrackMute: (trackType: 'video' | 'audio') => void

  // Playback
  togglePlayback: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  startExport: () => Promise<void>

  // Timeline playback controls (shared)
  setTimelineCurrentTime: (time: number) => void
  setTimelinePlaying: (isPlaying: boolean) => void

  // UI
  setActiveModal: (modal: string | null) => void
  toggleSidebar: () => void
  setIsDragging: (isDragging: boolean) => void
  setExportSettings: (settings: Partial<ExportSettings>) => void
}
