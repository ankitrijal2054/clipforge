import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { ImportManager } from './ImportManager'
import { MediaLibrary } from './MediaLibrary'
import { PreviewPlayer } from './PreviewPlayer'
import { Timeline } from './Timeline'
import { ExportModal } from '../../../components/ExportModal'
import { Button } from '../../../components/ui/button'
import { useEditorStore } from '../../../stores/editorStore'

/**
 * Layout component for the main application interface
 *
 * Features:
 * - Responsive layout with sidebar
 * - Sidebar with media library
 * - Main content area with video preview
 * - Timeline component below preview
 * - Smooth transitions
 * - Proper responsive spacing ensuring nothing goes out of bounds
 */
export function Layout() {
  const { clips } = useEditorStore()
  const selectedClip = useEditorStore((state) => state.selectedClip)
  const setActiveModal = useEditorStore((state) => state.setActiveModal)

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar - fixed width, scrollable */}
      <motion.div
        className="w-80 bg-gray-800/95 backdrop-blur-sm border-r border-gray-700 flex flex-col shadow-xl overflow-hidden"
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-white">ClipForge</h1>
          </div>
          <p className="text-sm text-gray-400">Professional Video Trimming</p>
        </div>

        {/* Sidebar Content - scrollable if needed */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {clips.length === 0 ? (
            <div className="p-4">
              <ImportManager />
            </div>
          ) : (
            <div className="p-4 h-full flex flex-col">
              <div className="mb-4 flex-shrink-0">
                <ImportManager />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <MediaLibrary />
              </div>
            </div>
          )}
        </div>

        {/* Export Button - fixed at bottom */}
        {clips.length > 0 && (
          <motion.div
            className="flex-shrink-0 px-4 py-3 border-t border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={() => setActiveModal('export')}
              disabled={!selectedClip}
              className="w-full text-xs py-1.5"
            >
              <Download className="w-3 h-3 mr-2" />
              Export
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content Area - flex column that fills remaining space */}
      <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
        {clips.length === 0 ? (
          // Welcome state
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <motion.div
              className="text-center max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-3xl">C</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-6">Welcome to ClipForge</h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Professional video trimming made simple. Import your videos and start editing with
                precision.
              </p>
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Get Started</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Drag and drop video files into the sidebar</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Or use the "Browse Files" button to select videos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Supports MP4, MOV, WebM, AVI, and MKV formats</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          // Main editing view with video and timeline
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
            {/* Video Preview - takes priority space */}
            <motion.div
              className="flex-1 min-h-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PreviewPlayer />
            </motion.div>

            {/* Timeline - fixed height, responsive width */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Timeline />
            </motion.div>
          </div>
        )}
      </div>

      {/* Export Modal - floats above all content */}
      <ExportModal />
    </div>
  )
}
