import { motion } from 'framer-motion'
import { Download, Mic, X, Key, Zap } from 'lucide-react'
import { useState } from 'react'
import { ImportManager } from './ImportManager'
import { MediaLibrary } from './MediaLibrary'
import { RecordingPanel } from './recording/RecordingPanel'
import { PreviewPlayer } from './PreviewPlayer'
import { Timeline } from './Timeline'
import { ExportModal } from '../../../components/ExportModal'
import { AISettings } from './AISettings'
import { SubtitlesPanel } from './SubtitlesPanel'
import { Button } from '../../../components/ui/button'
import { useEditorStore } from '../../../stores/editorStore'

type RightPanelTab = 'record' | 'ai-settings' | 'subtitles'

/**
 * Layout component for the main application interface
 *
 * Features:
 * - Left sidebar: Import Manager and Media Library
 * - Main content area: Video Preview and Timeline
 * - Right sidebar: Tabbed panels (Quick Record, AI Settings, Subtitles)
 * - Responsive layout ensuring nothing goes out of bounds
 */
export function Layout(): React.ReactElement {
  const { clips } = useEditorStore()
  const timelineVideoClips = useEditorStore((state) => state.timelineVideoClips)
  const setActiveModal = useEditorStore((state) => state.setActiveModal)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<RightPanelTab>('record')

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* LEFT SIDEBAR - Import Manager and Library */}
      {!isPreviewFullscreen && (
        <motion.div
          className="w-64 bg-gray-800/95 backdrop-blur-sm border-r border-gray-700 flex flex-col shadow-xl overflow-hidden"
          initial={{ x: -256 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="p-2 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src="./assets/icon.png"
                  alt="ClipForge"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML =
                        '<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span class="text-white font-bold text-lg">C</span></div>'
                    }
                  }}
                />
              </div>
              <h1 className="text-xl font-bold text-white">ClipForge</h1>
            </div>
          </div>

          {/* Import Manager - at the top */}
          <div className="px-3 py-2 border-b border-gray-700 flex-shrink-0">
            <ImportManager />
          </div>

          {/* Media Library - scrollable */}
          {clips.length > 0 && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4">
                <MediaLibrary />
              </div>
            </div>
          )}

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
                disabled={timelineVideoClips.length === 0}
                className="w-full text-xs py-1.5"
              >
                <Download className="w-3 h-3 mr-2" />
                Export
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* MAIN CONTENT AREA - Preview and Timeline */}
      <div
        className={`flex-1 flex flex-col ${
          isPreviewFullscreen ? 'overflow-hidden' : 'bg-gray-900 overflow-hidden p-4 gap-3'
        }`}
      >
        {clips.length === 0 ? (
          // Welcome state
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <motion.div
              className="text-center max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-48 h-48 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
                <img
                  src="./assets/icon.png"
                  alt="ClipForge"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML =
                        '<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl"><span class="text-white font-bold text-6xl">C</span></div>'
                    }
                  }}
                />
              </div>
              <h2 className="text-4xl font-bold text-white mb-6">Welcome to ClipForge</h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Professional video trimming made simple. Import your videos, record new content, or
                start editing with precision.
              </p>
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Get Started</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Use the right panel to start recording video</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Or use the left panel to import existing videos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Supports screen, webcam, and picture-in-picture recording</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          // Main editing view with video and timeline
          <>
            {/* Video Preview */}
            <motion.div
              className={
                isPreviewFullscreen
                  ? 'w-screen h-screen fixed inset-0 bg-black z-50'
                  : 'flex-1 min-h-0'
              }
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PreviewPlayer
                isFullscreen={isPreviewFullscreen}
                onFullscreenChange={setIsPreviewFullscreen}
              />
            </motion.div>

            {/* Timeline - hidden in fullscreen mode */}
            {!isPreviewFullscreen && (
              <motion.div
                className="flex-shrink-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Timeline />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* RIGHT SIDEBAR - Tabbed Panels (Record, AI Settings, Subtitles) */}
      {!isPreviewFullscreen && isRightPanelOpen && (
        <motion.div
          className="w-64 bg-gray-800/95 backdrop-blur-sm border-l border-gray-700 flex flex-col shadow-xl overflow-hidden"
          initial={{ x: 256 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Tab Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-700 flex-shrink-0">
            <div className="flex gap-1">
              {/* Record Tab */}
              <button
                onClick={() => setActiveTab('record')}
                className={`px-2.5 py-1.5 rounded-t text-xs font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'record'
                    ? 'bg-red-500/20 border-b-2 border-red-500 text-red-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title="Quick Record"
              >
                <Mic size={14} />
                Record
              </button>

              {/* AI Settings Tab */}
              <button
                onClick={() => setActiveTab('ai-settings')}
                className={`px-2.5 py-1.5 rounded-t text-xs font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'ai-settings'
                    ? 'bg-blue-500/20 border-b-2 border-blue-500 text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title="AI Settings"
              >
                <Key size={14} />
                AI
              </button>

              {/* Subtitles Tab */}
              <button
                onClick={() => setActiveTab('subtitles')}
                className={`px-2.5 py-1.5 rounded-t text-xs font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'subtitles'
                    ? 'bg-yellow-500/20 border-b-2 border-yellow-500 text-yellow-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title="Generate Subtitles"
              >
                <Zap size={14} />
                Subs
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsRightPanelOpen(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Close panel"
            >
              <X size={16} className="text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'record' && <RecordingPanel />}
            {activeTab === 'ai-settings' && <AISettings />}
            {activeTab === 'subtitles' && <SubtitlesPanel />}
          </div>
        </motion.div>
      )}

      {/* PANEL TOGGLE BUTTON - Modern Ribbon Style */}
      {!isPreviewFullscreen && !isRightPanelOpen && (
        <motion.button
          onClick={() => {
            setIsRightPanelOpen(true)
            setActiveTab('record')
          }}
          className="fixed top-4 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic size={16} />
          Quick Record
        </motion.button>
      )}

      {/* Export Modal - floats above all content */}
      <ExportModal />
    </div>
  )
}
