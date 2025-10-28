import { useCallback, useState } from 'react'
import { useEditorStore } from '../stores/editorStore'
import { VideoClip } from '../types/video'
import { isValidVideoFile } from '../utils/validators'

/**
 * Custom hook for media import functionality
 *
 * This hook manages video file import operations including:
 * - File validation
 * - Metadata extraction
 * - Drag and drop handling
 * - Error handling
 */
export function useMediaImport() {
  const { addClip, clips } = useEditorStore()
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // Import video file from path
  const importVideoFile = useCallback(
    async (filePath: string) => {
      try {
        setIsImporting(true)
        setImportError(null)

        // Validate file extension
        if (!isValidVideoFile(filePath)) {
          throw new Error('Invalid video file format. Supported formats: MP4, MOV, WebM')
        }

        // Check if file is already imported
        const existingClip = clips.find((clip) => clip.path === filePath)
        if (existingClip) {
          throw new Error('Video file is already imported')
        }

        // Get video metadata
        const metadata = await window.api.getVideoMetadata(filePath)

        // Create video clip object
        const clip: VideoClip = {
          id: crypto.randomUUID(),
          name: filePath.split('/').pop() || 'Unknown',
          path: filePath,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          fileSize: metadata.fileSize,
          bitRate: metadata.bitRate
        }

        // Add to store
        addClip(clip)

        return clip
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to import video file'
        setImportError(errorMessage)
        throw error
      } finally {
        setIsImporting(false)
      }
    },
    [addClip, clips]
  )

  // Import video file from file picker
  const importFromFilePicker = useCallback(async () => {
    try {
      // This would typically open a file dialog
      // For now, we'll simulate it
      throw new Error('File picker not implemented yet')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open file picker'
      setImportError(errorMessage)
      throw error
    }
  }, [])

  // Handle drag and drop
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()

      const files = Array.from(e.dataTransfer.files)
      const videoFile = files.find((file) => isValidVideoFile(file.name))

      if (!videoFile) {
        setImportError('No valid video files found in drop')
        return
      }

      try {
        await importVideoFile(videoFile.path)
      } catch (error) {
        // Error is already handled in importVideoFile
      }
    },
    [importVideoFile]
  )

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Clear import error
  const clearError = useCallback(() => {
    setImportError(null)
  }, [])

  return {
    // State
    isImporting,
    importError,
    clips,

    // Actions
    importVideoFile,
    importFromFilePicker,
    handleDrop,
    handleDragOver,
    clearError
  }
}
