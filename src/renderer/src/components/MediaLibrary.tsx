import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileVideo, Play, Trash2, Music } from 'lucide-react'
import { useEditorStore } from '../../../stores/editorStore'
import { formatDuration, formatFileSize, formatResolution } from '../../../utils/formatters'
import { useToast } from '../../../hooks/use-toast'

/**
 * MediaLibrary component for displaying imported videos
 *
 * Features:
 * - Video list display with thumbnails
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Library</h3>
        <span className="text-xs text-gray-400">
          {clips.length} video{clips.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
        {clips.map((clip) => (
          <motion.div
            key={clip.id}
            className={`relative rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${
              selectedClip?.id === clip.id
                ? 'ring-2 ring-blue-500 shadow-lg bg-blue-600/10'
                : 'bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-gray-600'
            }`}
            onClick={() => handleSelectClip(clip.id)}
            onDragStart={(e) => {
              // Set drag data for timeline drop zones
              e.dataTransfer.effectAllowed = 'copy'
              e.dataTransfer.setData('application/json', JSON.stringify(clip))
            }}
            draggable
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Thumbnail Section */}
            <div className="relative w-full h-20 bg-gray-900 flex items-center justify-center overflow-hidden">
              {clip.thumbnail ? (
                <img src={clip.thumbnail} alt={clip.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-700 to-gray-800">
                  {clip.width > 0 && clip.height > 0 ? (
                    <FileVideo className="w-8 h-8 text-gray-500" />
                  ) : (
                    <Music className="w-8 h-8 text-blue-400" />
                  )}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="p-2 space-y-1">
              <h4 className="text-xs font-medium text-white truncate">{clip.name}</h4>

              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-0.5">
                  <Play className="w-2.5 h-2.5" />
                  {formatDuration(clip.duration)}
                </span>
                {clip.width > 0 && clip.height > 0 ? (
                  <span>{formatResolution(clip.width, clip.height)}</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Music className="w-3 h-3" /> Audio
                  </span>
                )}
                <span>{formatFileSize(clip.fileSize)}</span>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveClip(clip.id, clip.name)
              }}
              className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-400 transition-colors rounded hover:bg-red-900/30 bg-gray-900/50 backdrop-blur-sm"
              title="Remove video"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
