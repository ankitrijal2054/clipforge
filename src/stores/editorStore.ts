import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { EditorStore } from '../types/store'
import { VideoClip, ExportSettings } from '../types/video'
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
        activeHandle: null,
        dragStartX: 0,
        dragStartTrimValue: 0,
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
            importHistory: [...state.importHistory, clip.path],
            zoomLevel: 1,
            timelineScrollOffset: 0
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

        // Trim handle control actions
        updateTrimStart: (time: number) =>
          set((state) => {
            const clampedTime = Math.max(0, Math.min(time, state.duration))
            const minGap = 0.05
            const newStart = Math.min(clampedTime, state.trimEnd - minGap)
            return { trimStart: newStart }
          }),

        updateTrimEnd: (time: number) =>
          set((state) => {
            const clampedTime = Math.max(0, Math.min(time, state.duration))
            const minGap = 0.05
            const newEnd = Math.max(clampedTime, state.trimStart + minGap)
            return { trimEnd: newEnd }
          }),

        setActiveHandle: (handle: 'start' | 'end' | null) => set({ activeHandle: handle }),

        setDragStartValues: (x: number, trimValue: number) =>
          set({
            dragStartX: x,
            dragStartTrimValue: trimValue
          }),

        // Export actions
        startExport: async () => {
          const state = get()
          if (!state.selectedClip) {
            throw new Error('No video selected for export')
          }

          set({ isExporting: true, exportProgress: 0 })

          try {
            // Get the output path from the export modal (will be passed separately)
            // For now, construct it from the selected clip
            const videoMetadata = state.selectedClip
            const trimmedDuration = state.trimEnd - state.trimStart

            // Call the FFmpeg export via IPC
            await window.api.trimExport({
              inputPath: videoMetadata.path,
              startTime: state.trimStart,
              endTime: state.trimEnd,
              outputPath: '', // This needs to be passed from the modal
              duration: trimmedDuration
            })

            // On success, set progress to 100
            set({ isExporting: false, exportProgress: 100 })
          } catch (error) {
            set({ isExporting: false, exportProgress: 0 })
            throw error
          }
        },

        setExportSettings: (settings: Partial<ExportSettings>) =>
          set((state) => ({
            exportSettings: { ...state.exportSettings, ...settings }
          })),

        // UI actions
        setActiveModal: (modal: string | null) => set({ activeModal: modal }),

        toggleSidebar: () =>
          set((state) => ({
            sidebarCollapsed: !state.sidebarCollapsed
          }))
      }),
      {
        name: 'clipforge-editor-store',
        storage: createPersistenceStorage() as any,
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

// Trim handle selectors
export const useTrimHandle = () => {
  const activeHandle = useEditorStore((state) => state.activeHandle)
  const dragStartX = useEditorStore((state) => state.dragStartX)
  const dragStartTrimValue = useEditorStore((state) => state.dragStartTrimValue)

  return { activeHandle, dragStartX, dragStartTrimValue }
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
  const updateTrimStart = useEditorStore((state) => state.updateTrimStart)
  const updateTrimEnd = useEditorStore((state) => state.updateTrimEnd)
  const setActiveHandle = useEditorStore((state) => state.setActiveHandle)
  const setDragStartValues = useEditorStore((state) => state.setDragStartValues)

  return {
    setTrimPoints,
    resetTrim,
    setIsDragging,
    updateTrimStart,
    updateTrimEnd,
    setActiveHandle,
    setDragStartValues
  }
}

export const useTimelineActions = () => {
  const setPlayhead = useEditorStore((state) => state.setPlayhead)
  const setZoomLevel = useEditorStore((state) => state.setZoomLevel)
  const setTimelineScrollOffset = useEditorStore((state) => state.setTimelineScrollOffset)

  return { setPlayhead, setZoomLevel, setTimelineScrollOffset }
}

export const useExportActions = () => {
  const startExport = useEditorStore((state) => state.startExport)
  const setExportSettings = useEditorStore((state) => state.setExportSettings)

  return { startExport, setExportSettings }
}

export const useUIActions = () => {
  const setActiveModal = useEditorStore((state) => state.setActiveModal)
  const toggleSidebar = useEditorStore((state) => state.toggleSidebar)

  return { setActiveModal, toggleSidebar }
}
