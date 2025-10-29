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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Library</h3>
        <span className="text-xs text-gray-400">
          {clips.length} video{clips.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {clips.map((clip) => (
          <motion.div
            key={clip.id}
            className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedClip?.id === clip.id
                ? 'bg-blue-600 border border-blue-500 shadow-lg'
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
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                  <FileVideo className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-white truncate">{clip.name}</h4>

                <div className="flex flex-wrap gap-2 text-xs text-gray-400 items-center">
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

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveClip(clip.id, clip.name)
                }}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors rounded hover:bg-red-900/20 flex-shrink-0"
                title="Remove video"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
