import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FolderOpen, CheckCircle, AlertCircle } from 'lucide-react'
import { useEditorStore } from '../stores/editorStore'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Progress } from './ui/progress'

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error'

/**
 * ExportModal Component
 *
 * Responsive modal for exporting trimmed videos
 * Features:
 * - Filename input with auto-population
 * - Location picker with native file dialog
 * - Real-time progress tracking (0-100%)
 * - Success/error messages
 * - Smooth animations
 * - Touch-friendly on mobile
 * - Fully responsive (mobile to desktop)
 *
 * Layout:
 * - Desktop (>1024px): max-w-md centered
 * - Tablet (768-1024px): max-w-md centered
 * - Mobile (<768px): max-w-sm with margins
 * - All screens: max-h-[90vh] with internal scroll
 *
 * CSS Strategy: No overflow at any screen size
 * - Modal: fixed positioning, max-height constraint
 * - Content: overflow-y-auto for internal scrolling
 * - All inputs: full width, responsive padding
 * - Buttons: touch-friendly (min-h-10)
 */
export function ExportModal(): JSX.Element | null {
  // Store state
  const { selectedClip, isExporting, exportProgress, activeModal, setActiveModal } =
    useEditorStore()

  // Local modal state
  const [filename, setFilename] = useState('clip_trimmed.mp4')
  const [exportPath, setExportPath] = useState('')
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Auto-populate filename when clip is selected
  useEffect(() => {
    if (selectedClip) {
      const baseName = selectedClip.name.replace(/\.[^/.]+$/, '')
      setFilename(`${baseName}_trimmed.mp4`)
    }
  }, [selectedClip])

  // Update export status based on store state
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
      const selectedPath = await (window.electronAPI as any).selectExportPath(filename)
      if (selectedPath) {
        setExportPath(selectedPath)
        setErrorMessage('')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open file picker')
    }
  }

  /**
   * Handle export button click - validate and start export
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

    if (!selectedClip) {
      setErrorMessage('No video selected')
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

      // Get store state for export
      const state = useEditorStore.getState()
      const trimmedDuration = state.trimEnd - state.trimStart

      // Call the actual FFmpeg export via IPC with the selected output path
      await (window.api as any).trimExport({
        inputPath: selectedClip.path,
        startTime: state.trimStart,
        endTime: state.trimEnd,
        outputPath: exportPath, // Use the selected export path
        duration: trimmedDuration
      })

      // Update progress to 100 on success
      useEditorStore.getState().setExportSettings({
        ...useEditorStore.getState().exportSettings
      })

      setExportStatus('success')
    } catch (error) {
      setExportStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Export failed')
    }
  }

  /**
   * Handle open folder button click
   */
  const handleOpenFolder = async (): Promise<void> => {
    try {
      const folderPath = exportPath.substring(0, exportPath.lastIndexOf('/'))
      await (window.electronAPI as any).openFolder(folderPath)
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
            <h2 className="text-xl font-semibold text-white">Export Video</h2>
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
            {/* Filename Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filename</label>
              <Input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="clip_trimmed.mp4"
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
                  <span className="font-medium">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="w-full h-2" />
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
