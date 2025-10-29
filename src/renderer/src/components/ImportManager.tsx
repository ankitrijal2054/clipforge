import React, { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileVideo, Loader2 } from 'lucide-react'
import { useEditorStore } from '../../../stores/editorStore'
import { isValidMediaFile, isValidVideoFile, isValidAudioFile } from '../../../utils/validators'
import { VideoClip } from '../../../types/video'
import { useToast } from '../../../hooks/use-toast'

/**
 * ImportManager component for importing video files
 *
 * Features:
 * - Drag and drop functionality
 * - Multiple file selection and import
 * - Batch import with progress tracking
 * - File validation
 * - Loading states
 * - Error handling
 */
export function ImportManager(): React.ReactElement {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importCount, setImportCount] = useState({ current: 0, total: 0 })
  const { addClip } = useEditorStore()
  const { toast } = useToast()

  const handleFileImport = useCallback(
    async (filePath: string): Promise<boolean> => {
      if (!isValidMediaFile(filePath)) {
        return false
      }

      try {
        // Get media metadata (video or audio)
        const metadata = await window.api.getVideoMetadata(filePath)

        let thumbnail: string | undefined

        // Check if it's a video file and generate thumbnail
        if (isValidVideoFile(filePath)) {
          try {
            // Get first frame as thumbnail
            const tempThumbnailPath = `/tmp/thumbnail_${Date.now()}.png`

            // Use a frame from ~1 second in or 25% into the video to avoid black intro frames
            // This gives a better representative thumbnail of actual content
            const thumbnailTime = Math.min(1, metadata.duration * 0.25)

            const thumbnailPath = await window.api.getVideoThumbnail({
              filePath,
              timeInSeconds: thumbnailTime,
              outputPath: tempThumbnailPath
            })
            // Convert file path to clipforge:// URL for loading in img tag
            thumbnail = `clipforge://${thumbnailPath}`
          } catch (error) {
            console.warn('Failed to generate thumbnail:', error)
            // Continue without thumbnail if generation fails
          }
        } else if (isValidAudioFile(filePath)) {
          // Create a simple audio icon as data URL
          // Using a blue audio waveform SVG
          thumbnail = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect fill='%231e293b' width='160' height='90'/%3E%3Cpath fill='%233b82f6' d='M50 45 L50 35 L55 45 L55 35 L60 45 L60 40 L65 45 L65 35'/%3E%3Cpath fill='%233b82f6' d='M75 45 L75 30 L80 45 L80 30 L85 45 L85 25 L90 45 L90 30'/%3E%3Cpath fill='%233b82f6' d='M100 45 L100 35 L105 45 L105 35 L110 45 L110 40 L115 45 L115 35'/%3E%3C/svg%3E`
        }

        // Create video clip object
        const clip: VideoClip = {
          id: crypto.randomUUID(),
          name: filePath.split('/').pop() || 'Unknown Video',
          path: filePath,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          fileSize: metadata.fileSize,
          bitRate: metadata.bitRate,
          thumbnail
        }

        // Add to store
        addClip(clip)
        return true
      } catch (error) {
        console.error('Failed to import video:', error)
        return false
      }
    },
    [addClip]
  )

  const handleMultipleFileImport = useCallback(
    async (filePaths: string[]): Promise<void> => {
      if (filePaths.length === 0) return

      setIsImporting(true)
      setImportCount({ current: 0, total: filePaths.length })

      let successCount = 0
      let failureCount = 0

      // Import files sequentially
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i]

        // Update counter
        setImportCount({ current: i + 1, total: filePaths.length })

        // Validate file
        if (!isValidMediaFile(filePath)) {
          failureCount++
          continue
        }

        // Import file
        const success = await handleFileImport(filePath)

        if (success) {
          successCount++
        } else {
          failureCount++
        }
      }

      setIsImporting(false)

      // Show summary toast
      if (successCount > 0 && failureCount === 0) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${successCount} file${successCount === 1 ? '' : 's'}`,
          variant: 'default'
        })
      } else if (successCount > 0 && failureCount > 0) {
        toast({
          title: 'Partial Import',
          description: `Imported ${successCount} file${successCount === 1 ? '' : 's'}, ${failureCount} failed`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Import Failed',
          description: `Failed to import ${failureCount} file${failureCount === 1 ? '' : 's'}`,
          variant: 'destructive'
        })
      }
    },
    [handleFileImport, toast]
  )

  const handleFilePicker = useCallback(async () => {
    try {
      const filePaths = await window.api.selectVideoFile()
      if (filePaths && Array.isArray(filePaths) && filePaths.length > 0) {
        await handleMultipleFileImport(filePaths)
      }
    } catch (error) {
      console.error('File picker error:', error)
      toast({
        title: 'File Picker Error',
        description: 'Failed to open file picker',
        variant: 'destructive'
      })
    }
  }, [handleMultipleFileImport, toast])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const validFiles = files.filter((f) => isValidMediaFile(f.name))

      if (validFiles.length > 0) {
        // For web drag-drop, we need to use file picker or IPC
        // Since these are local files in Electron, trigger file picker
        // The app's main process handles file drops via IPC
        handleFilePicker()
      } else {
        toast({
          title: 'Invalid Files',
          description: 'Please drop valid video or audio files',
          variant: 'destructive'
        })
      }
    },
    [handleFilePicker, toast]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Import</h3>
        <div className="text-xs text-gray-400">
          {isImporting ? `Importing... (${importCount.current}/${importCount.total})` : ''}
        </div>
      </div>

      <motion.div
        className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        animate={{
          borderColor: isDragOver ? '#3b82f6' : '#4b5563',
          backgroundColor: isDragOver ? '#1e3a8a30' : '#1f293730'
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          animate={{ scale: isDragOver ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
          className="mb-2"
        >
          {isImporting ? (
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
          )}
        </motion.div>

        <h4 className="text-xs font-semibold text-white mb-1 text-center">
          {isImporting ? 'Importing...' : 'Drop videos or'}
        </h4>

        <button
          onClick={handleFilePicker}
          disabled={isImporting}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
        >
          <FileVideo className="w-3 h-3" />
          {isImporting ? 'Importing...' : 'Browse'}
        </button>
      </motion.div>
    </div>
  )
}
