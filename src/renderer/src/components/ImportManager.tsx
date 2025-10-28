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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Import</h3>
        <div className="text-xs text-gray-400">{isImporting ? 'Processing...' : ''}</div>
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
          {isImporting ? 'Importing...' : 'Drop video or'}
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
