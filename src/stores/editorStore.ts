import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { EditorStore } from '../types/store'
import { VideoClip, TimelineClip, ExportSettings } from '../types/video'
import { createPersistenceStorage } from './persistence'

/**
 * Zustand store for ClipForge editor state management
 *
 * This store manages all application state including:
 * - Media management (clips, selection, import history)
 * - Timeline state (clips, playhead, duration, zoom)
 * - Playback controls (playing, rate, volume, mute)
 * - Trim operations (start/end points, dragging)
 * - Export functionality (progress, settings)
 * - UI state (modals, sidebar, theme)
 */
export const useEditorStore = create<EditorStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        clips: [],
        selectedClip: null,
        importHistory: [],
        timelineClips: [],
        playhead: 0,
        duration: 0,
        zoomLevel: 1,
        timelineScrollOffset: 0,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        trimStart: 0,
        trimEnd: 0,
        isDragging: false,
        isExporting: false,
        exportProgress: 0,
        exportSettings: { format: 'mp4', quality: 'high' },
        activeModal: null,
        sidebarCollapsed: false,
        theme: 'dark',

        // Media management actions
        addClip: (clip: VideoClip) =>
          set((state) => ({
            clips: [...state.clips, clip],
            selectedClip: clip,
            duration: clip.duration,
            trimEnd: clip.duration,
            importHistory: [...state.importHistory, clip.path]
          })),

        selectClip: (id: string) =>
          set((state) => {
            const clip = state.clips.find((c) => c.id === id)
            if (!clip) return state

            return {
              selectedClip: clip,
              duration: clip.duration,
              trimEnd: clip.duration,
              playhead: 0,
              trimStart: 0,
              isPlaying: false,
              zoomLevel: 1,
              timelineScrollOffset: 0
            }
          }),

        removeClip: (id: string) =>
          set((state) => {
            const newClips = state.clips.filter((c) => c.id !== id)
            const isSelectedClip = state.selectedClip?.id === id

            return {
              clips: newClips,
              selectedClip: isSelectedClip ? null : state.selectedClip,
              duration: isSelectedClip ? 0 : state.duration,
              trimStart: isSelectedClip ? 0 : state.trimStart,
              trimEnd: isSelectedClip ? 0 : state.trimEnd,
              playhead: isSelectedClip ? 0 : state.playhead,
              isPlaying: false,
              zoomLevel: isSelectedClip ? 1 : state.zoomLevel,
              timelineScrollOffset: isSelectedClip ? 0 : state.timelineScrollOffset
            }
          }),

        // Timeline actions
        setTrimPoints: (start: number, end: number) =>
          set((state) => ({
            trimStart: Math.max(0, Math.min(start, state.duration)),
            trimEnd: Math.max(start + 0.1, Math.min(end, state.duration))
          })),

        setPlayhead: (time: number) =>
          set((state) => ({
            playhead: Math.max(0, Math.min(time, state.duration))
          })),

        setZoomLevel: (zoomLevel: number) =>
          set({
            zoomLevel: Math.max(0.5, Math.min(10, zoomLevel))
          }),

        setTimelineScrollOffset: (offset: number) =>
          set({
            timelineScrollOffset: Math.max(0, offset)
          }),

        // Playback actions
        togglePlayback: () =>
          set((state) => ({
            isPlaying: !state.isPlaying
          })),

        setVolume: (volume: number) =>
          set({
            volume: Math.max(0, Math.min(1, volume)),
            isMuted: volume === 0
          }),

        toggleMute: () =>
          set((state) => ({
            isMuted: !state.isMuted,
            volume: state.isMuted ? state.volume : 0
          })),

        // Trim actions
        resetTrim: () =>
          set((state) => ({
            trimStart: 0,
            trimEnd: state.duration,
            playhead: 0,
            isPlaying: false
          })),

        setIsDragging: (isDragging: boolean) => set({ isDragging }),

        // Export actions
        startExport: async () => {
          const state = get()
          if (!state.selectedClip) {
            throw new Error('No video selected for export')
          }

          set({ isExporting: true, exportProgress: 0 })

          try {
            // This will be implemented when we integrate with the IPC handlers
            // For now, we'll simulate the export process
            const exportParams = {
              inputPath: state.selectedClip.path,
              startTime: state.trimStart,
              endTime: state.trimEnd,
              outputPath: '', // Will be set by the export modal
              duration: state.trimEnd - state.trimStart
            }

            // Simulate progress updates
            for (let i = 0; i <= 100; i += 10) {
              await new Promise((resolve) => setTimeout(resolve, 100))
              set({ exportProgress: i })
            }

            set({ isExporting: false, exportProgress: 100 })
          } catch (error) {
            set({ isExporting: false, exportProgress: 0 })
            throw error
          }
        },

        // UI actions
        setActiveModal: (modal: string | null) => set({ activeModal: modal }),

        toggleSidebar: () =>
          set((state) => ({
            sidebarCollapsed: !state.sidebarCollapsed
          }))
      }),
      {
        name: 'clipforge-editor-store',
        storage: createPersistenceStorage(),
        partialize: (state) => ({
          importHistory: state.importHistory,
          exportSettings: state.exportSettings,
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          volume: state.volume,
          isMuted: state.isMuted
        })
      }
    ),
    {
      name: 'clipforge-editor-store',
      // Only log actions in development
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

/**
 * Selector hooks for optimized re-renders
 * These hooks only re-render when specific parts of the state change
 */

// Media selectors
export const useClips = () => useEditorStore((state) => state.clips)
export const useSelectedClip = () => useEditorStore((state) => state.selectedClip)
export const useImportHistory = () => useEditorStore((state) => state.importHistory)

// Timeline selectors
export const useTimeline = () => {
  const playhead = useEditorStore((state) => state.playhead)
  const duration = useEditorStore((state) => state.duration)
  const zoomLevel = useEditorStore((state) => state.zoomLevel)
  const timelineScrollOffset = useEditorStore((state) => state.timelineScrollOffset)
  const trimStart = useEditorStore((state) => state.trimStart)
  const trimEnd = useEditorStore((state) => state.trimEnd)

  return { playhead, duration, zoomLevel, timelineScrollOffset, trimStart, trimEnd }
}

// Playback selectors
export const usePlayback = () => {
  const isPlaying = useEditorStore((state) => state.isPlaying)
  const playbackRate = useEditorStore((state) => state.playbackRate)
  const volume = useEditorStore((state) => state.volume)
  const isMuted = useEditorStore((state) => state.isMuted)

  return { isPlaying, playbackRate, volume, isMuted }
}

// Trim selectors
export const useTrim = () => {
  const trimStart = useEditorStore((state) => state.trimStart)
  const trimEnd = useEditorStore((state) => state.trimEnd)
  const isDragging = useEditorStore((state) => state.isDragging)

  return { trimStart, trimEnd, isDragging }
}

// Export selectors
export const useExport = () => {
  const isExporting = useEditorStore((state) => state.isExporting)
  const exportProgress = useEditorStore((state) => state.exportProgress)
  const exportSettings = useEditorStore((state) => state.exportSettings)

  return { isExporting, exportProgress, exportSettings }
}

// UI selectors
export const useUI = () => {
  const activeModal = useEditorStore((state) => state.activeModal)
  const sidebarCollapsed = useEditorStore((state) => state.sidebarCollapsed)
  const theme = useEditorStore((state) => state.theme)

  return { activeModal, sidebarCollapsed, theme }
}

// Action selectors
export const useMediaActions = () => {
  const addClip = useEditorStore((state) => state.addClip)
  const selectClip = useEditorStore((state) => state.selectClip)
  const removeClip = useEditorStore((state) => state.removeClip)

  return { addClip, selectClip, removeClip }
}

export const usePlaybackActions = () => {
  const togglePlayback = useEditorStore((state) => state.togglePlayback)
  const setVolume = useEditorStore((state) => state.setVolume)
  const toggleMute = useEditorStore((state) => state.toggleMute)
  const setPlayhead = useEditorStore((state) => state.setPlayhead)

  return { togglePlayback, setVolume, toggleMute, setPlayhead }
}

export const useTrimActions = () => {
  const setTrimPoints = useEditorStore((state) => state.setTrimPoints)
  const resetTrim = useEditorStore((state) => state.resetTrim)
  const setIsDragging = useEditorStore((state) => state.setIsDragging)

  return { setTrimPoints, resetTrim, setIsDragging }
}

export const useTimelineActions = () => {
  const setPlayhead = useEditorStore((state) => state.setPlayhead)
  const setZoomLevel = useEditorStore((state) => state.setZoomLevel)
  const setTimelineScrollOffset = useEditorStore((state) => state.setTimelineScrollOffset)

  return { setPlayhead, setZoomLevel, setTimelineScrollOffset }
}

export const useExportActions = () => {
  const startExport = useEditorStore((state) => state.startExport)

  return { startExport }
}

export const useUIActions = () => {
  const setActiveModal = useEditorStore((state) => state.setActiveModal)
  const toggleSidebar = useEditorStore((state) => state.toggleSidebar)

  return { setActiveModal, toggleSidebar }
}
