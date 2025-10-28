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
        className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col"
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">ClipForge</h1>
          <p className="text-sm text-gray-400">Video Trimming Made Simple</p>
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
      <div className="flex-1 flex flex-col">
        {clips.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Welcome to ClipForge</h2>
              <p className="text-lg text-gray-400 mb-8 max-w-md">
                Import your videos and start trimming with professional precision
              </p>
              <div className="text-gray-500">
                <p>No videos imported yet</p>
                <p className="text-sm mt-2">Use the sidebar to import your first video</p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 p-6">
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
