import React, { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileVideo, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useEditorStore } from '../../../stores/editorStore'
import { isValidMediaFile } from '../../../utils/validators'
import { VideoClip } from '../../../types/video'
import { useToast } from '../../../hooks/use-toast'

interface ImportProgress {
  fileName: string
  status: 'pending' | 'importing' | 'success' | 'error'
  error?: string
}

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
export function ImportManager() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress[]>([])
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
        return true
      } catch (error) {
        console.error('Failed to import video:', error)
        return false
      }
    },
    [addClip]
  )

  const handleMultipleFileImport = useCallback(
    async (filePaths: string[]) => {
      if (filePaths.length === 0) return

      setIsImporting(true)
      const progress: ImportProgress[] = filePaths.map((filePath) => ({
        fileName: filePath.split('/').pop() || filePath,
        status: 'pending'
      }))
      setImportProgress(progress)

      let successCount = 0
      let failureCount = 0
      const failedFiles: { name: string; error: string }[] = []

      // Import files sequentially
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i]
        const fileName = filePath.split('/').pop() || filePath

        // Update current file to importing
        setImportProgress((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'importing' }
          return updated
        })

        // Validate file
        if (!isValidMediaFile(filePath)) {
          setImportProgress((prev) => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              status: 'error',
              error: 'Invalid file type'
            }
            return updated
          })
          failureCount++
          failedFiles.push({ name: fileName, error: 'Invalid file type' })
          continue
        }

        // Import file
        const success = await handleFileImport(filePath)

        if (success) {
          setImportProgress((prev) => {
            const updated = [...prev]
            updated[i] = { ...updated[i], status: 'success' }
            return updated
          })
          successCount++
        } else {
          setImportProgress((prev) => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              status: 'error',
              error: 'Failed to import'
            }
            return updated
          })
          failureCount++
          failedFiles.push({ name: fileName, error: 'Failed to import' })
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

      // Clear progress after 2 seconds if all successful
      if (failureCount === 0) {
        setTimeout(() => setImportProgress([]), 2000)
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
          {isImporting
            ? `Importing... (${importProgress.filter((p) => p.status === 'success').length}/${importProgress.length})`
            : ''}
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

      {/* Import progress list */}
      {importProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 p-2 bg-gray-800/50 rounded-lg space-y-1 max-h-40 overflow-y-auto"
        >
          {importProgress.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs text-gray-300 p-1.5 bg-gray-700/30 rounded"
            >
              {item.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-blue-400 animate-spin" />
              )}
              {item.status === 'importing' && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-blue-400 animate-spin" />
              )}
              {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
              <span className="flex-1 truncate">{item.fileName}</span>
              {item.error && <span className="text-red-400 text-xs">{item.error}</span>}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
