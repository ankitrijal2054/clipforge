// Recording Importer Component
// Displays recent recordings and allows importing them to the media library
import React, { useEffect, useState, useCallback } from 'react'
import { useRecordingImport } from '../../hooks/useRecordingImport'
import { Button } from '../../../../components/ui/button'
import { FileVideo, Download, Trash2, Loader2 } from 'lucide-react'
import { formatDuration, formatFileSize } from '../../../../utils/formatters'
import { motion } from 'framer-motion'

interface RecordedVideo {
  name: string
  path: string
  fileSize: number
  duration: number
  width: number
  height: number
  recordedAt: number
}

export const RecordingImporter: React.FC = () => {
  const { importRecording, getRecordedVideos, deleteRecording, isImporting } = useRecordingImport()
  const [recordedVideos, setRecordedVideos] = useState<RecordedVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [importingPath, setImportingPath] = useState<string | null>(null)

  // Load recorded videos
  const loadRecordings = useCallback(async () => {
    setIsLoading(true)
    try {
      const videos = await getRecordedVideos()
      setRecordedVideos(videos || [])
    } catch (err) {
      console.error('Failed to load recordings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [getRecordedVideos])

  // Load recordings on component mount
  useEffect(() => {
    loadRecordings()
  }, [loadRecordings])

  // Listen for recording stopped events and auto-refresh
  useEffect(() => {
    const unsubscribe = (window.api as any).onRecordingStopped(
      async (data: { filePath: string; duration: number }) => {
        console.log('Recording stopped, refreshing recent recordings list:', data)
        // Wait a bit for file system to be ready, then refresh
        setTimeout(() => {
          loadRecordings()
        }, 500)
      }
    )

    return () => {
      unsubscribe?.()
    }
  }, [loadRecordings])

  // Listen for recording data saved events (from useScreenRecorder)
  useEffect(() => {
    // Check if the function exists before trying to use it
    if (typeof (window.api as any)?.onRecordingDataSaved !== 'function') {
      console.log('onRecordingDataSaved not available yet, skipping listener setup')
      return
    }

    const unsubscribe = (window.api as any).onRecordingDataSaved(
      async (data: { filePath: string }) => {
        console.log('✓ Recording data saved, refreshing recent recordings:', data.filePath)
        // Wait a bit for file system to be ready, then refresh
        setTimeout(() => {
          loadRecordings()
        }, 300)
      }
    )

    return () => {
      unsubscribe?.()
    }
  }, [loadRecordings])

  // Handle import
  const handleImport = useCallback(
    async (video: RecordedVideo) => {
      setImportingPath(video.path)
      try {
        const result = await importRecording(video.path)
        if (result) {
          // Recording imported successfully
          // Note: We intentionally keep it in the recent list
          // since it's still in the temp directory and user might want to import again
        }
      } finally {
        setImportingPath(null)
      }
    },
    [importRecording]
  )

  // Handle delete
  const handleDelete = useCallback(
    async (video: RecordedVideo) => {
      const success = await deleteRecording(video.path)
      if (success) {
        setRecordedVideos((prev) => prev.filter((v) => v.path !== video.path))
      }
    },
    [deleteRecording]
  )

  if (recordedVideos.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <FileVideo className="w-8 h-8 mx-auto mb-2 text-gray-600" />
        <p className="text-xs">No recent recordings</p>
        {!isLoading && (
          <Button variant="outline" size="sm" className="mt-2" onClick={loadRecordings}>
            Refresh
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4 py-2">
        <h4 className="text-xs font-semibold text-white">Recent Recordings</h4>
        <span className="text-xs text-gray-400">{recordedVideos.length}</span>
      </div>

      <div className="space-y-1 px-2 max-h-64 overflow-y-auto">
        {recordedVideos.map((video, index) => (
          <motion.div
            key={video.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{video.name}</p>
                <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{formatDuration(video.duration)}</span>
                  <span>•</span>
                  <span>{formatFileSize(video.fileSize)}</span>
                </div>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleImport(video)}
                  disabled={isImporting || importingPath === video.path}
                  className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Import to library"
                >
                  {importingPath === video.path && isImporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(video)}
                  disabled={isImporting || importingPath === video.path}
                  className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete recording"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
