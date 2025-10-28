import { useCallback, useEffect } from 'react'
import { useEditorStore } from '../stores/editorStore'
import { ExportProgress } from '../types/video'

/**
 * Custom hook for export functionality
 *
 * This hook manages video export operations including:
 * - Export progress tracking
 * - Error handling
 * - Integration with FFmpeg operations
 * - File system operations
 */
export function useExport() {
  const {
    selectedClip,
    trimStart,
    trimEnd,
    isExporting,
    exportProgress,
    exportSettings,
    startExport,
    setActiveModal
  } = useEditorStore()

  // Validate export parameters
  const validateExportParams = useCallback(() => {
    if (!selectedClip) {
      throw new Error('No video selected for export')
    }

    if (trimStart >= trimEnd) {
      throw new Error('Invalid trim range: start time must be less than end time')
    }

    if (trimEnd - trimStart < 0.1) {
      throw new Error('Trim duration must be at least 0.1 seconds')
    }

    return true
  }, [selectedClip, trimStart, trimEnd])

  // Export video with progress tracking
  const exportVideo = useCallback(
    async (outputPath: string) => {
      try {
        validateExportParams()

        if (!selectedClip) {
          throw new Error('No video selected')
        }

        // Set up progress listener
        const progressListener = (progress: ExportProgress) => {
          // Progress is already handled by the store
          console.log(`Export progress: ${progress.progress.toFixed(1)}%`)
        }

        // Call the IPC handler for video export
        const result = await window.api.trimExport({
          inputPath: selectedClip.path,
          startTime: trimStart,
          endTime: trimEnd,
          outputPath,
          duration: trimEnd - trimStart
        })

        return result
      } catch (error) {
        console.error('Export failed:', error)
        throw error
      }
    },
    [selectedClip, trimStart, trimEnd, validateExportParams]
  )

  // Convert video with different settings
  const convertVideo = useCallback(
    async (
      inputPath: string,
      outputPath: string,
      options?: {
        quality?: 'high' | 'medium' | 'low'
        format?: 'mp4' | 'mov' | 'avi'
        resolution?: { width: number; height: number }
      }
    ) => {
      try {
        const result = await window.api.convertVideo({
          inputPath,
          outputPath,
          quality: options?.quality || exportSettings.quality,
          format: options?.format || exportSettings.format,
          resolution: options?.resolution
        })

        return result
      } catch (error) {
        console.error('Video conversion failed:', error)
        throw error
      }
    },
    [exportSettings]
  )

  // Get export duration
  const getExportDuration = useCallback(() => {
    return trimEnd - trimStart
  }, [trimStart, trimEnd])

  // Check if export is ready
  const isExportReady = useCallback(() => {
    return selectedClip && trimStart < trimEnd && !isExporting
  }, [selectedClip, trimStart, trimEnd, isExporting])

  // Open export modal
  const openExportModal = useCallback(() => {
    if (!isExportReady()) {
      throw new Error('Export not ready: select a video and set trim points')
    }
    setActiveModal('export')
  }, [isExportReady, setActiveModal])

  // Close export modal
  const closeExportModal = useCallback(() => {
    setActiveModal(null)
  }, [setActiveModal])

  return {
    // State
    selectedClip,
    trimStart,
    trimEnd,
    isExporting,
    exportProgress,
    exportSettings,
    exportDuration: getExportDuration(),
    isExportReady: isExportReady(),

    // Actions
    exportVideo,
    convertVideo,
    openExportModal,
    closeExportModal,
    validateExportParams
  }
}
