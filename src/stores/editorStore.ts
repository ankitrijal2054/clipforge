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
              isPlaying: false
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
              isPlaying: false
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
export const useTimeline = () =>
  useEditorStore((state) => ({
    playhead: state.playhead,
    duration: state.duration,
    zoomLevel: state.zoomLevel,
    timelineClips: state.timelineClips
  }))

// Playback selectors
export const usePlayback = () =>
  useEditorStore((state) => ({
    isPlaying: state.isPlaying,
    playbackRate: state.playbackRate,
    volume: state.volume,
    isMuted: state.isMuted
  }))

// Trim selectors
export const useTrim = () =>
  useEditorStore((state) => ({
    trimStart: state.trimStart,
    trimEnd: state.trimEnd,
    isDragging: state.isDragging
  }))

// Export selectors
export const useExport = () =>
  useEditorStore((state) => ({
    isExporting: state.isExporting,
    exportProgress: state.exportProgress,
    exportSettings: state.exportSettings
  }))

// UI selectors
export const useUI = () =>
  useEditorStore((state) => ({
    activeModal: state.activeModal,
    sidebarCollapsed: state.sidebarCollapsed,
    theme: state.theme
  }))

// Action selectors
export const useMediaActions = () =>
  useEditorStore((state) => ({
    addClip: state.addClip,
    selectClip: state.selectClip,
    removeClip: state.removeClip
  }))

export const usePlaybackActions = () =>
  useEditorStore((state) => ({
    togglePlayback: state.togglePlayback,
    setVolume: state.setVolume,
    toggleMute: state.toggleMute,
    setPlayhead: state.setPlayhead
  }))

export const useTrimActions = () =>
  useEditorStore((state) => ({
    setTrimPoints: state.setTrimPoints,
    resetTrim: state.resetTrim,
    setIsDragging: state.setIsDragging
  }))

export const useExportActions = () =>
  useEditorStore((state) => ({
    startExport: state.startExport
  }))

export const useUIActions = () =>
  useEditorStore((state) => ({
    setActiveModal: state.setActiveModal,
    toggleSidebar: state.toggleSidebar
  }))
