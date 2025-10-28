import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileVideo, Play, Trash2, Eye } from 'lucide-react'
import { useEditorStore } from '../../../stores/editorStore'
import { formatDuration, formatFileSize, formatResolution } from '../../../utils/formatters'
import { useToast } from '../../../hooks/use-toast'

/**
 * MediaLibrary component for displaying imported videos
 *
 * Features:
 * - Video list display
 * - Selection management
 * - Video removal
 * - Metadata display
 * - Hover effects
 */
export function MediaLibrary() {
  const { clips, selectedClip, selectClip, removeClip } = useEditorStore()
  const { toast } = useToast()

  const handleSelectClip = useCallback(
    (id: string) => {
      selectClip(id)
    },
    [selectClip]
  )

  const handleRemoveClip = useCallback(
    (id: string, name: string) => {
      removeClip(id)
      toast({
        title: 'Video Removed',
        description: `${name} has been removed from the library`,
        variant: 'default'
      })
    },
    [removeClip, toast]
  )

  if (clips.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <FileVideo className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Videos Imported</h3>
        <p className="text-sm">Import your first video to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Media Library</h3>
        <span className="text-sm text-gray-400">
          {clips.length} video{clips.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {clips.map((clip) => (
          <motion.div
            key={clip.id}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedClip?.id === clip.id
                ? 'bg-blue-600 border-2 border-blue-500 shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent hover:border-gray-600'
            }`}
            onClick={() => handleSelectClip(clip.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                  <FileVideo className="w-6 h-6 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate mb-1">{clip.name}</h4>

                <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {formatDuration(clip.duration)}
                  </span>
                  <span>{formatResolution(clip.width, clip.height)}</span>
                  <span>{formatFileSize(clip.fileSize)}</span>
                </div>

                <div className="text-xs text-gray-500 truncate">{clip.path}</div>
              </div>

              <div className="flex items-center space-x-2">
                {selectedClip?.id === clip.id && (
                  <div className="flex items-center text-xs text-blue-300">
                    <Eye className="w-3 h-3 mr-1" />
                    Selected
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveClip(clip.id, clip.name)
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
                  title="Remove video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
