import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { EditorStore } from '../types/store'
import { VideoClip, ExportSettings } from '../types/video'
import { TimelineClip } from '../types/timeline'
import { createPersistenceStorage } from './persistence'

/**
 * Helper function to generate random colors for clips
 */
const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F38181',
    '#AA96DA',
    '#FCBAD3'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Helper function to recalculate positions for all clips in a track
 */
const recalculatePositions = (clips: TimelineClip[]): TimelineClip[] => {
  let cumulativePosition = 0
  return clips.map((clip) => ({
    ...clip,
    position: (cumulativePosition += clip.effectiveDuration) - clip.effectiveDuration,
    effectiveDuration: clip.trimEnd - clip.trimStart
  }))
}

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
        // Shared timeline playback state (Phase 2C)
        timelineCurrentTime: 0,
        timelineIsPlaying: false,
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

        // Multi-clip timeline state (Phase 2B/2C)
        timelineVideoClips: [],
        timelineAudioClips: [],
        selectedClipId: null,
        isMuted: {
          video: false,
          audio: false
        },

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
            isMuted: volume === 0 ? { video: true, audio: true } : { video: false, audio: false }
          }),

        toggleMute: () =>
          set((state) => ({
            isMuted: {
              video: !state.isMuted.video,
              audio: !state.isMuted.audio
            },
            volume: state.isMuted.video && state.isMuted.audio ? state.volume : 0
          })),

        // Multi-Clip Timeline Actions (Phase 2B/2C)
        addClipToTrack: (trackType: 'video' | 'audio', libraryClip: VideoClip) =>
          set((state) => {
            const trackClips =
              trackType === 'video' ? state.timelineVideoClips : state.timelineAudioClips

            // Calculate position = sum of all effective durations in track
            const position = trackClips.reduce((sum, clip) => sum + clip.effectiveDuration, 0)

            // Create new timeline clip
            const newTimelineClip: TimelineClip = {
              id: `clip-${Date.now()}`,
              libraryId: libraryClip.id,
              name: libraryClip.name || 'Untitled',
              trackType,
              duration: libraryClip.duration,
              trimStart: 0,
              trimEnd: libraryClip.duration,
              effectiveDuration: libraryClip.duration,
              position,
              color: getRandomColor()
            }

            const updatedClips =
              trackType === 'video'
                ? [...state.timelineVideoClips, newTimelineClip]
                : [...state.timelineAudioClips, newTimelineClip]

            return trackType === 'video'
              ? { timelineVideoClips: updatedClips }
              : { timelineAudioClips: updatedClips }
          }),

        removeClipFromTrack: (trackType: 'video' | 'audio', clipId: string) =>
          set((state) => {
            const trackClips =
              trackType === 'video'
                ? state.timelineVideoClips.filter((c) => c.id !== clipId)
                : state.timelineAudioClips.filter((c) => c.id !== clipId)

            // Recalculate positions for remaining clips
            const updatedClips = recalculatePositions(trackClips)

            // Clear selection if deleted clip was selected
            const selectedClipId = state.selectedClipId === clipId ? null : state.selectedClipId

            return trackType === 'video'
              ? { timelineVideoClips: updatedClips, selectedClipId }
              : { timelineAudioClips: updatedClips, selectedClipId }
          }),

        moveClip: (trackType: 'video' | 'audio', clipId: string, newPosition: number) =>
          set((state) => {
            const trackClips =
              trackType === 'video' ? state.timelineVideoClips : state.timelineAudioClips

            // Find clip being moved
            const clipIndex = trackClips.findIndex((c) => c.id === clipId)
            if (clipIndex === -1) return state

            const clip = trackClips[clipIndex]

            // For now, just reorder clips (simplified - no collision detection)
            // Find target position in array
            let targetIndex = 0
            let cumulativePos = 0

            for (let i = 0; i < trackClips.length; i++) {
              if (i === clipIndex) continue
              if (cumulativePos + trackClips[i].effectiveDuration <= newPosition) {
                cumulativePos += trackClips[i].effectiveDuration
                targetIndex = i + 1
              }
            }

            // Remove from current position and insert at target
            const updatedClips = [...trackClips]
            updatedClips.splice(clipIndex, 1)
            updatedClips.splice(targetIndex, 0, clip)

            // Recalculate all positions
            const repositionedClips = recalculatePositions(updatedClips)

            return trackType === 'video'
              ? { timelineVideoClips: repositionedClips }
              : { timelineAudioClips: repositionedClips }
          }),

        updateClipTrim: (clipId: string, trimStart: number, trimEnd: number) =>
          set((state) => {
            // Validate trim points
            const finalTrimStart = Math.max(0, Math.min(trimStart, trimEnd - 0.05))
            const finalTrimEnd = Math.max(trimStart + 0.05, trimEnd)

            // Update in video track or audio track
            let updatedVideoClips = state.timelineVideoClips
            let updatedAudioClips = state.timelineAudioClips

            const videoClipIndex = state.timelineVideoClips.findIndex((c) => c.id === clipId)
            if (videoClipIndex !== -1) {
              updatedVideoClips = [...state.timelineVideoClips]
              updatedVideoClips[videoClipIndex] = {
                ...updatedVideoClips[videoClipIndex],
                trimStart: finalTrimStart,
                trimEnd: finalTrimEnd,
                effectiveDuration: finalTrimEnd - finalTrimStart
              }
              updatedVideoClips = recalculatePositions(updatedVideoClips)
            } else {
              const audioClipIndex = state.timelineAudioClips.findIndex((c) => c.id === clipId)
              if (audioClipIndex !== -1) {
                updatedAudioClips = [...state.timelineAudioClips]
                updatedAudioClips[audioClipIndex] = {
                  ...updatedAudioClips[audioClipIndex],
                  trimStart: finalTrimStart,
                  trimEnd: finalTrimEnd,
                  effectiveDuration: finalTrimEnd - finalTrimStart
                }
                updatedAudioClips = recalculatePositions(updatedAudioClips)
              }
            }

            return {
              timelineVideoClips: updatedVideoClips,
              timelineAudioClips: updatedAudioClips
            }
          }),

        splitClip: (clipId: string, splitTime: number) =>
          set((state) => {
            // Find which track contains this clip
            const videoClipIndex = state.timelineVideoClips.findIndex((c) => c.id === clipId)
            const isInVideoTrack = videoClipIndex !== -1

            const clips = isInVideoTrack ? state.timelineVideoClips : state.timelineAudioClips
            const clip =
              clips[
                videoClipIndex !== -1
                  ? videoClipIndex
                  : state.timelineAudioClips.findIndex((c) => c.id === clipId)
              ]

            if (!clip) return state

            // Calculate split point relative to clip trim boundaries
            const splitPointInClip = splitTime - clip.position + clip.trimStart

            // Validate split is within clip bounds
            if (splitPointInClip <= clip.trimStart || splitPointInClip >= clip.trimEnd) {
              return state
            }

            // Create two clips from original
            const clip1: TimelineClip = {
              ...clip,
              id: `clip-${Date.now()}`,
              trimEnd: splitPointInClip,
              effectiveDuration: splitPointInClip - clip.trimStart
            }

            const clip2: TimelineClip = {
              ...clip,
              id: `clip-${Date.now()}-split`,
              trimStart: splitPointInClip,
              effectiveDuration: clip.trimEnd - splitPointInClip
            }

            // Insert both clips at original position
            const updatedClips = [...clips]
            updatedClips.splice(
              videoClipIndex !== -1
                ? videoClipIndex
                : state.timelineAudioClips.findIndex((c) => c.id === clipId),
              1,
              clip1,
              clip2
            )

            // Recalculate positions
            const repositionedClips = recalculatePositions(updatedClips)

            return isInVideoTrack
              ? { timelineVideoClips: repositionedClips }
              : { timelineAudioClips: repositionedClips }
          }),

        selectTimelineClip: (clipId: string | null) => set({ selectedClipId: clipId }),

        toggleTrackMute: (trackType: 'video' | 'audio') =>
          set((state) => ({
            isMuted: {
              ...state.isMuted,
              [trackType]: !state.isMuted[trackType]
            }
          })),

        // Shared timeline playback controls
        setTimelineCurrentTime: (time: number) =>
          set(() => ({
            timelineCurrentTime: Math.max(0, time)
          })),
        setTimelinePlaying: (isPlaying: boolean) => set(() => ({ timelineIsPlaying: isPlaying })),

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

// Multi-clip timeline selectors (Phase 2B/2C)
export const useTimelineClips = () => {
  const timelineVideoClips = useEditorStore((state) => state.timelineVideoClips)
  const timelineAudioClips = useEditorStore((state) => state.timelineAudioClips)
  const selectedClipId = useEditorStore((state) => state.selectedClipId)

  return { timelineVideoClips, timelineAudioClips, selectedClipId }
}

export const useTimelineTrackMute = () => {
  const isMuted = useEditorStore((state) => state.isMuted)

  return isMuted
}

export const useMultiClipTimelineActions = () => {
  const addClipToTrack = useEditorStore((state) => state.addClipToTrack)
  const removeClipFromTrack = useEditorStore((state) => state.removeClipFromTrack)
  const moveClip = useEditorStore((state) => state.moveClip)
  const updateClipTrim = useEditorStore((state) => state.updateClipTrim)
  const splitClip = useEditorStore((state) => state.splitClip)
  const selectTimelineClip = useEditorStore((state) => state.selectTimelineClip)
  const toggleTrackMute = useEditorStore((state) => state.toggleTrackMute)

  return {
    addClipToTrack,
    removeClipFromTrack,
    moveClip,
    updateClipTrim,
    splitClip,
    selectTimelineClip,
    toggleTrackMute
  }
}
