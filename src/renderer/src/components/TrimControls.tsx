import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useTimeline } from '../../../stores/editorStore'
import { useTrimActions } from '../../../stores/editorStore'
import { useTrimHandle } from '../../../stores/editorStore'
import { formatDuration } from '../../../utils/formatters'
import { Button } from '../../../components/ui/button'

/**
 * TrimControls component for displaying and managing trim points
 *
 * Features:
 * - Display trim start, duration, and end times
 * - Reset button to reset trim to full video
 * - Trim bar visualization showing trim region
 * - Responsive design for all screen sizes
 * - Real-time updates from store
 */
export function TrimControls() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Get state from store
  const { trimStart, trimEnd, duration, zoomLevel, timelineScrollOffset } = useTimeline()
  const { activeHandle } = useTrimHandle()

  // Get actions from store
  const { resetTrim, updateTrimStart, updateTrimEnd, setActiveHandle, setIsDragging } =
    useTrimActions()

  // Calculate base pixels per second (same as Timeline)
  const basePixelsPerSecond = React.useMemo(() => {
    if (duration === 0 || containerWidth === 0) return 1
    return containerWidth / duration
  }, [duration, containerWidth])

  // Apply zoom multiplier
  const pixelsPerSecond = React.useMemo(() => {
    return Math.max(1, basePixelsPerSecond * zoomLevel)
  }, [basePixelsPerSecond, zoomLevel])

  // Track container width with ResizeObserver
  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    handleResize()
    const resizeObserver = new ResizeObserver(handleResize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // Handle trim handle mouse down for trim bar
  const handleTrimHandleMouseDown = React.useCallback(
    (handle: 'start' | 'end') => (e: React.MouseEvent) => {
      e.stopPropagation()
      setActiveHandle(handle)
      setIsDragging(true)
    },
    [setActiveHandle, setIsDragging]
  )

  // Handle trim bar drag
  React.useEffect(() => {
    if (!activeHandle || !containerRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left + timelineScrollOffset

      const time = mouseX / pixelsPerSecond
      const clampedTime = Math.max(0, Math.min(time, duration))

      if (activeHandle === 'start') {
        updateTrimStart(clampedTime)
      } else {
        updateTrimEnd(clampedTime)
      }
    }

    const handleMouseUp = () => {
      setActiveHandle(null)
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    activeHandle,
    pixelsPerSecond,
    duration,
    timelineScrollOffset,
    updateTrimStart,
    updateTrimEnd,
    setActiveHandle,
    setIsDragging
  ])

  return (
    <div className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
      {/* Header with title and reset button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Trim Points</h3>
        <Button
          onClick={resetTrim}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 px-2 text-xs"
          title="Reset trim to full video (R)"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Trim point display */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-900 rounded px-2 py-2 border border-gray-700">
          <div className="text-gray-400 mb-1">Start</div>
          <div className="text-white font-mono font-medium">{formatDuration(trimStart)}</div>
        </div>
        <div className="bg-gray-900 rounded px-2 py-2 border border-gray-700">
          <div className="text-gray-400 mb-1">Duration</div>
          <div className="text-white font-mono font-medium">
            {formatDuration(trimEnd - trimStart)}
          </div>
        </div>
        <div className="bg-gray-900 rounded px-2 py-2 border border-gray-700">
          <div className="text-gray-400 mb-1">End</div>
          <div className="text-white font-mono font-medium">{formatDuration(trimEnd)}</div>
        </div>
      </div>

      {/* Trim bar visualization */}
      <div
        ref={containerRef}
        className="relative w-full bg-gray-900 rounded border border-gray-700 overflow-hidden cursor-default"
        style={{ height: '32px', minHeight: '32px' }}
      >
        {/* Dimmed before trim region */}
        {trimStart > 0 && (
          <div
            className="absolute top-0 h-full bg-black opacity-40"
            style={{
              left: '0',
              width: `${(trimStart / duration) * 100}%`
            }}
          />
        )}

        {/* Trim region */}
        <div
          className="absolute top-0 h-full bg-blue-500 bg-opacity-50 border-l border-r border-blue-400"
          style={{
            left: `${(trimStart / duration) * 100}%`,
            width: `${((trimEnd - trimStart) / duration) * 100}%`
          }}
        />

        {/* Dimmed after trim region */}
        {trimEnd < duration && (
          <div
            className="absolute top-0 h-full bg-black opacity-40"
            style={{
              right: '0',
              width: `${((duration - trimEnd) / duration) * 100}%`
            }}
          />
        )}

        {/* Start handle */}
        <motion.div
          className="absolute top-0 h-full w-1 bg-blue-400 cursor-ew-resize hover:bg-blue-300 transition-colors"
          style={{
            left: `${(trimStart / duration) * 100}%`
          }}
          onMouseDown={handleTrimHandleMouseDown('start')}
          animate={{
            backgroundColor: activeHandle === 'start' ? '#3b82f6' : '#60a5fa'
          }}
          transition={{ type: 'tween', duration: 0.1 }}
        />

        {/* End handle */}
        <motion.div
          className="absolute top-0 h-full w-1 bg-blue-400 cursor-ew-resize hover:bg-blue-300 transition-colors"
          style={{
            left: `${(trimEnd / duration) * 100}%`
          }}
          onMouseDown={handleTrimHandleMouseDown('end')}
          animate={{
            backgroundColor: activeHandle === 'end' ? '#3b82f6' : '#60a5fa'
          }}
          transition={{ type: 'tween', duration: 0.1 }}
        />
      </div>

      {/* Info text */}
      <div className="text-xs text-gray-500">
        Drag handles to adjust trim points, or use I/O keys to set from playhead
      </div>
    </div>
  )
}
