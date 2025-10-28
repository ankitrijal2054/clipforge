import { VideoClip, TimelineClip, ExportSettings } from './video'

export interface EditorStore {
  // Media
  clips: VideoClip[]
  selectedClip: VideoClip | null
  importHistory: string[]

  // Timeline
  timelineClips: TimelineClip[]
  playhead: number
  duration: number
  zoomLevel: number

  // Playback
  isPlaying: boolean
  playbackRate: number
  volume: number
  isMuted: boolean

  // Trim
  trimStart: number
  trimEnd: number
  isDragging: boolean

  // Export
  isExporting: boolean
  exportProgress: number
  exportSettings: ExportSettings

  // UI State
  activeModal: string | null
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'

  // Actions
  addClip: (clip: VideoClip) => void
  selectClip: (id: string) => void
  removeClip: (id: string) => void
  setTrimPoints: (start: number, end: number) => void
  setPlayhead: (time: number) => void
  togglePlayback: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  startExport: () => Promise<void>
  resetTrim: () => void
  setActiveModal: (modal: string | null) => void
  toggleSidebar: () => void
  setIsDragging: (isDragging: boolean) => void
}
