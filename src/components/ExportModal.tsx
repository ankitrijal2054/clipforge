import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FolderOpen, CheckCircle, AlertCircle } from 'lucide-react'
import { useEditorStore } from '../stores/editorStore'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Progress } from './ui/progress'

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error'
type ExportMode = 'single-clip' | 'timeline'

/**
 * ExportModal Component
 *
 * Supports both:
 * 1. Single-clip trim export (legacy MVP mode)
 * 2. Multi-clip timeline export (Phase 2D)
 *
 * Automatically detects mode based on timeline clip count.
 */
export function ExportModal(): React.JSX.Element | null {
  // Store state
  const {
    selectedClip,
    isExporting,
    exportProgress,
    activeModal,
    setActiveModal,
    timelineVideoClips,
    timelineAudioClips,
    isMuted,
    clips: libraryClips,
    trimStart,
    trimEnd,
    timelineExportProgress
  } = useEditorStore()

  // Local modal state
  const [filename, setFilename] = useState('clip_trimmed.mp4')
  const [exportPath, setExportPath] = useState('')
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Detect export mode: timeline if any clips on timeline, otherwise single-clip
  const hasTimelineClips = timelineVideoClips.length > 0 || timelineAudioClips.length > 0
  const exportMode: ExportMode = hasTimelineClips ? 'timeline' : 'single-clip'

  // Auto-populate filename based on mode
  useEffect(() => {
    if (exportMode === 'timeline') {
      setFilename('timeline_export.mp4')
    } else if (selectedClip) {
      const baseName = selectedClip.name.replace(/\.[^/.]+$/, '')
      setFilename(`${baseName}_trimmed.mp4`)
    }
  }, [selectedClip, exportMode])

  // Update export status based on store state (single-clip path)
  useEffect(() => {
    if (isExporting) {
      setExportStatus('exporting')
    } else if (exportProgress === 100 && exportStatus === 'exporting') {
      setExportStatus('success')
    }
  }, [isExporting, exportProgress, exportStatus])

  /**
   * Handle browse button click - open file picker
   */
  const handleBrowse = async (): Promise<void> => {
    try {
      const selectedPath = await window.api.selectExportPath(filename)
      if (selectedPath) {
        setExportPath(selectedPath)
        setErrorMessage('')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open file picker')
    }
  }

  /**
   * Handle export button click - route to appropriate export handler
   */
  const handleExport = async (): Promise<void> => {
    // Validation
    if (!filename.trim()) {
      setErrorMessage('Please enter a filename')
      return
    }

    if (!exportPath.trim()) {
      setErrorMessage('Please choose a save location')
      return
    }

    // Additional validation: check for valid filename characters
    const invalidChars = /[<>:"|?*]/
    if (invalidChars.test(filename)) {
      setErrorMessage('Filename contains invalid characters')
      return
    }

    try {
      setExportStatus('exporting')
      setErrorMessage('')

      if (exportMode === 'timeline') {
        // Timeline export: Multi-clip with concat demuxer
        await handleTimelineExport()
      } else {
        // Single-clip export: Traditional trim workflow
        await handleSingleClipExport()
      }

      setExportStatus('success')
    } catch (error) {
      setExportStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Export failed')
    }
  }

  /**
   * Handle single-clip trim export
   */
  const handleSingleClipExport = async (): Promise<void> => {
    if (!selectedClip) {
      throw new Error('No video selected')
    }

    const trimmedDuration = trimEnd - trimStart

    // Call the actual FFmpeg export via IPC
    await (window.api as any).trimExport({
      inputPath: selectedClip.path,
      startTime: trimStart,
      endTime: trimEnd,
      outputPath: exportPath,
      duration: trimmedDuration
    })
  }

  /**
   * Handle multi-clip timeline export
   */
  const handleTimelineExport = async (): Promise<void> => {
    // Reset and set up progress listeners for timeline export
    useEditorStore.getState().setTimelineExportProgress(0)
    const unsubscribeProgress = (window.api as any).onTimelineExportProgress?.((data: any) => {
      useEditorStore.getState().setTimelineExportProgress(Math.floor(data.progress))
    })
    const unsubscribeError = (window.api as any).onTimelineExportError?.((data: any) => {
      setExportStatus('error')
      setErrorMessage(data?.error || 'Timeline export failed')
    })

    try {
      // Call timeline export with all necessary data
      await (window.api as any).timelineExport({
        videoClips: timelineVideoClips,
        audioClips: timelineAudioClips,
        isMuted,
        outputPath: exportPath,
        quality: 'high', // Could be made configurable in future
        clips: libraryClips
      })
    } finally {
      unsubscribeProgress?.()
      unsubscribeError?.()
    }
  }

  /**
   * Handle open folder button click
   */
  const handleOpenFolder = async (): Promise<void> => {
    try {
      const folderPath = exportPath.substring(0, exportPath.lastIndexOf('/'))
      await window.api.openFolder(folderPath)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open folder')
    }
  }

  /**
   * Handle close button or modal dismiss
   */
  const handleClose = (): void => {
    setActiveModal(null)
    // Reset local state
    setExportStatus('idle')
    setErrorMessage('')
  }

  // Only render if modal is active
  if (activeModal !== 'export') return null

  // Get display info based on mode
  const headerTitle = exportMode === 'timeline' ? 'Export Timeline' : 'Export Video'
  const clipCountText =
    exportMode === 'timeline'
      ? `${timelineVideoClips.length} video clips × ${timelineAudioClips.length} audio clips`
      : null

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        {/* Modal Content - responsive width with proper constraints */}
        <motion.div
          className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto
                     border border-gray-700 shadow-2xl
                     mx-4 md:mx-0"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{headerTitle}</h2>
              {clipCountText && <p className="text-xs text-gray-400 mt-1">{clipCountText}</p>}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body - space-y-4 for consistent spacing */}
          <div className="space-y-4">
            {/* Mute status for timeline mode */}
            {exportMode === 'timeline' && (
              <div className="text-xs text-gray-400 space-y-1">
                {isMuted.video && <p>⚠️ Video track is muted (no video audio)</p>}
                {isMuted.audio && <p>⚠️ Audio track is muted</p>}
              </div>
            )}

            {/* Filename Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filename</label>
              <Input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="clip_export.mp4"
                disabled={isExporting}
                className="w-full bg-gray-800 text-white border-gray-600 placeholder-gray-400"
              />
            </div>

            {/* Save Location Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Save Location</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={exportPath}
                  onChange={(e) => setExportPath(e.target.value)}
                  placeholder="Choose export location"
                  disabled={isExporting}
                  className="flex-1 bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                />
                <Button
                  onClick={handleBrowse}
                  disabled={isExporting}
                  variant="outline"
                  className="px-4 py-2 min-h-10 bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                >
                  Browse
                </Button>
              </div>
            </div>

            {/* Progress Bar - shown during export */}
            {exportStatus === 'exporting' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Exporting...</span>
                  <span className="font-medium">
                    {exportMode === 'timeline' ? timelineExportProgress : exportProgress}%
                  </span>
                </div>
                <Progress
                  value={exportMode === 'timeline' ? timelineExportProgress : exportProgress}
                  className="w-full h-2"
                />
              </div>
            )}

            {/* Success Message */}
            {exportStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-green-400 text-sm">Export completed successfully!</span>
              </motion.div>
            )}

            {/* Error Message */}
            {exportStatus === 'error' && errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{errorMessage}</span>
              </motion.div>
            )}
          </div>

          {/* Footer - Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
            {/* Close/Cancel Button */}
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isExporting}
              className="flex-1 min-h-10 bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
            >
              {exportStatus === 'success' ? 'Close' : 'Cancel'}
            </Button>

            {/* Open Folder Button - shown on success */}
            {exportStatus === 'success' && (
              <Button
                onClick={handleOpenFolder}
                variant="outline"
                className="flex-1 min-h-10 bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Open Folder
              </Button>
            )}

            {/* Export Button - main action */}
            {exportStatus !== 'success' && (
              <Button
                onClick={handleExport}
                disabled={isExporting || !exportPath || !filename}
                className="flex-1 min-h-10 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            Supports MP4, MOV, WebM, AVI, and MKV formats
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
