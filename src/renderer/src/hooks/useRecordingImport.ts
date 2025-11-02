// Recording import and file management hook
import { useCallback, useState } from 'react'
import { useEditorStore } from '../../../stores/editorStore'
import { useToast } from '../../../hooks/use-toast'
import type { VideoClip } from '../../../types/video'

export interface UseRecordingImportOptions {
  onImportStart?: () => void
  onImportSuccess?: (clip: VideoClip) => void
  onImportError?: (error: Error) => void
  autoImport?: boolean
}

export function useRecordingImport(options: UseRecordingImportOptions = {}) {
  const { autoImport = true } = options
  const { addClip } = useEditorStore()
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Import a recorded video file to the media library
   * Automatically adds it to the store and optionally to the timeline
   */
  const importRecording = useCallback(
    async (filePath: string) => {
      try {
        setIsImporting(true)
        setError(null)
        options.onImportStart?.()

        // Import recording via IPC
        const result = await (window.api as any).importRecording(filePath)

        if (!result.success) {
          throw new Error(result.error || 'Failed to import recording')
        }

        const clipData = result.clipData
        if (!clipData) {
          throw new Error('No clip data returned from import')
        }

        // Convert clip data to VideoClip format
        const videoClip: VideoClip = {
          id: clipData.id,
          name: clipData.name,
          path: clipData.path,
          duration: clipData.duration,
          width: clipData.width,
          height: clipData.height,
          fileSize: clipData.fileSize,
          bitRate: clipData.bitRate
        }

        // Add to media library
        addClip(videoClip)

        setIsImporting(false)
        options.onImportSuccess?.(videoClip)

        toast({
          title: 'Recording Imported',
          description: `${clipData.name} has been added to your media library`,
          variant: 'default'
        })

        console.log('✓ Recording imported successfully:', videoClip)
        return videoClip
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to import recording'
        setError(errorMessage)
        setIsImporting(false)
        options.onImportError?.(new Error(errorMessage))

        toast({
          title: 'Import Failed',
          description: errorMessage,
          variant: 'destructive'
        })

        console.error('Recording import error:', err)
        return null
      }
    },
    [addClip, options, toast]
  )

  /**
   * Get all recorded videos available for import
   */
  const getRecordedVideos = useCallback(async () => {
    try {
      const videos = await (window.api as any).getRecordedVideos()
      return videos
    } catch (err) {
      console.error('Failed to get recorded videos:', err)
      return []
    }
  }, [])

  /**
   * Get metadata for a specific recording
   */
  const getRecordingMetadata = useCallback(async (filePath: string) => {
    try {
      const metadata = await (window.api as any).getRecordingMetadata(filePath)
      return metadata
    } catch (err) {
      console.error('Failed to get recording metadata:', err)
      return null
    }
  }, [])

  /**
   * Delete a recording file
   */
  const deleteRecording = useCallback(
    async (filePath: string) => {
      try {
        const result = await (window.api as any).deleteRecording(filePath)
        if (result.success) {
          toast({
            title: 'Recording Deleted',
            description: 'Recording has been removed',
            variant: 'default'
          })
          return true
        } else {
          throw new Error(result.error || 'Failed to delete recording')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete recording'
        toast({
          title: 'Delete Failed',
          description: errorMessage,
          variant: 'destructive'
        })
        return false
      }
    },
    [toast]
  )

  /**
   * Cleanup old recordings (files older than 7 days)
   */
  const cleanupOldRecordings = useCallback(async () => {
    try {
      const result = await (window.api as any).cleanupRecordings()
      if (result.success) {
        const count = result.cleanedFiles || 0
        if (count > 0) {
          toast({
            title: 'Cleanup Complete',
            description: `Removed ${count} old recording(s)`,
            variant: 'default'
          })
        }
        return count
      } else {
        throw new Error(result.error || 'Failed to cleanup recordings')
      }
    } catch (err) {
      console.error('Cleanup error:', err)
      return 0
    }
  }, [toast])

  return {
    // State
    isImporting,
    error,

    // Actions
    importRecording,
    getRecordedVideos,
    getRecordingMetadata,
    deleteRecording,
    cleanupOldRecordings,

    // Utils
    autoImport
  }
}
