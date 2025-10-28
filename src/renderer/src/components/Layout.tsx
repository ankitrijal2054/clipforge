import React from 'react'
import { motion } from 'framer-motion'
import { ImportManager } from './ImportManager'
import { MediaLibrary } from './MediaLibrary'
import { PreviewPlayer } from './PreviewPlayer'
import { useEditorStore } from '../../../stores/editorStore'

/**
 * Layout component for the main application interface
 *
 * Features:
 * - Responsive layout
 * - Sidebar with media library
 * - Main content area
 * - Smooth transitions
 */
export function Layout() {
  const { clips } = useEditorStore()

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <motion.div
        className="w-80 bg-gray-800/95 backdrop-blur-sm border-r border-gray-700 flex flex-col shadow-xl"
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-white">ClipForge</h1>
          </div>
          <p className="text-sm text-gray-400">Professional Video Trimming</p>
        </div>

        <div className="flex-1 overflow-hidden">
          {clips.length === 0 ? (
            <div className="p-4">
              <ImportManager />
            </div>
          ) : (
            <div className="p-4 h-full flex flex-col">
              <div className="mb-4">
                <ImportManager />
              </div>
              <div className="flex-1 min-h-0">
                <MediaLibrary />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {clips.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
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
          <div className="flex-1 p-8">
            <motion.div
              className="h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PreviewPlayer />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
