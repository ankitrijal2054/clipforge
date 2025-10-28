import React, { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileVideo, AlertCircle, Loader2 } from 'lucide-react'
import { useEditorStore } from '../../../stores/editorStore'
import { isValidVideoFile } from '../../../utils/validators'
import { VideoClip } from '../../../types/video'
import { useToast } from '../../../hooks/use-toast'

/**
 * ImportManager component for importing video files
 *
 * Features:
 * - Drag and drop functionality
 * - File picker integration
 * - Video validation
 * - Loading states
 * - Error handling
 */
export function ImportManager() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { addClip } = useEditorStore()
  const { toast } = useToast()

  const handleFileImport = useCallback(
    async (filePath: string) => {
      if (!isValidVideoFile(filePath)) {
        toast({
          title: 'Invalid File',
          description: 'Please select a valid video file (MP4, MOV, WebM, AVI, MKV)',
          variant: 'destructive'
        })
        return
      }

      setIsImporting(true)
      try {
        // Get video metadata
        const metadata = await window.api.getVideoMetadata(filePath)

        // Create video clip object
        const clip: VideoClip = {
          id: crypto.randomUUID(),
          name: filePath.split('/').pop() || 'Unknown Video',
          path: filePath,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          fileSize: metadata.fileSize,
          bitRate: metadata.bitRate
        }

        // Add to store
        addClip(clip)

        toast({
          title: 'Video Imported',
          description: `Successfully imported ${clip.name}`,
          variant: 'default'
        })
      } catch (error) {
        console.error('Failed to import video:', error)
        toast({
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'Failed to import video',
          variant: 'destructive'
        })
      } finally {
        setIsImporting(false)
      }
    },
    [addClip, toast]
  )

  const handleFilePicker = useCallback(async () => {
    try {
      const filePath = await window.api.selectVideoFile()
      if (filePath) {
        await handleFileImport(filePath)
      }
    } catch (error) {
      console.error('File picker error:', error)
      toast({
        title: 'File Picker Error',
        description: 'Failed to open file picker',
        variant: 'destructive'
      })
    }
  }, [handleFileImport, toast])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const videoFile = files.find((f) => isValidVideoFile(f.name))

      if (videoFile) {
        // In Electron, we need to get the file path from the file object
        // For now, we'll use the file name and let the user select via file picker
        handleFilePicker()
      } else {
        toast({
          title: 'Invalid File',
          description: 'Please drop a valid video file',
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
    <motion.div
      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      animate={{
        borderColor: isDragOver ? '#3b82f6' : '#4b5563',
        backgroundColor: isDragOver ? '#1e3a8a20' : '#1f293720'
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div animate={{ scale: isDragOver ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
        {isImporting ? (
          <Loader2 className="w-12 h-12 text-blue-400 mb-4 animate-spin" />
        ) : (
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
        )}
      </motion.div>

      <h3 className="text-lg font-semibold text-white mb-2">
        {isImporting ? 'Importing Video...' : 'Import Video'}
      </h3>

      <p className="text-gray-400 text-center mb-6 max-w-md">
        Drag and drop a video file here or click the button below to browse your files
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleFilePicker}
          disabled={isImporting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <FileVideo className="w-4 h-4" />
          {isImporting ? 'Importing...' : 'Browse Files'}
        </button>

        <div className="text-xs text-gray-500 text-center sm:text-left">
          Supported formats: MP4, MOV, WebM, AVI, MKV
        </div>
      </div>
    </motion.div>
  )
}
