import React, { useState } from 'react'
import { TimelineClip as TimelineClipType } from '../../../types/timeline'
import { useMultiClipTimelineActions } from '../../../stores/editorStore'
import './TimelineClip.css'

interface TimelineClipProps {
  clip: TimelineClipType
  isSelected: boolean
  onSelect: () => void
  pixelsPerSecond: number
}

/**
 * Helper to format duration as MM:SS
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * TimelineClip Component
 * Displays a single clip on the timeline with trim handles
 */
export const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  isSelected,
  onSelect,
  pixelsPerSecond
}) => {
  const { updateClipTrim } = useMultiClipTimelineActions()
  const [isDraggingTrim, setIsDraggingTrim] = useState<'start' | 'end' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTrim, setDragStartTrim] = useState<{ start: number; end: number } | null>(null)

  // Calculate dimensions
  const positionPx = clip.position * pixelsPerSecond
  const widthPx = clip.effectiveDuration * pixelsPerSecond

  // Handle trim start drag
  const handleTrimStartMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingTrim('start')
    setDragStartX(e.clientX)
    setDragStartTrim({ start: clip.trimStart, end: clip.trimEnd })
  }

  // Handle trim end drag
  const handleTrimEndMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingTrim('end')
    setDragStartX(e.clientX)
    setDragStartTrim({ start: clip.trimStart, end: clip.trimEnd })
  }

  // Handle trim dragging
  React.useEffect(() => {
    if (!isDraggingTrim || !dragStartTrim) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX
      const deltaTime = deltaX / pixelsPerSecond

      if (isDraggingTrim === 'start') {
        const newTrimStart = Math.max(
          0,
          Math.min(dragStartTrim.start + deltaTime, dragStartTrim.end - 0.1)
        )
        updateClipTrim(clip.id, newTrimStart, dragStartTrim.end)
      } else {
        const newTrimEnd = Math.max(
          dragStartTrim.start + 0.1,
          Math.min(dragStartTrim.end + deltaTime, clip.duration)
        )
        updateClipTrim(clip.id, dragStartTrim.start, newTrimEnd)
      }
    }

    const handleMouseUp = () => {
      setIsDraggingTrim(null)
      setDragStartTrim(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingTrim, dragStartX, dragStartTrim, clip, pixelsPerSecond, updateClipTrim])

  return (
    <div
      className={`timeline-clip ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${positionPx}px`,
        width: `${widthPx}px`,
        backgroundColor: clip.color || '#3b82f6',
        position: 'absolute',
        height: '100%'
      }}
      onClick={onSelect}
      title={`${clip.name} - ${formatDuration(clip.effectiveDuration)}`}
    >
      {/* Clip Content */}
      <div className="clip-content">
        <div className="clip-name">{clip.name}</div>
        <div className="clip-duration">{formatDuration(clip.effectiveDuration)}</div>
      </div>

      {/* Trim Handle - Start */}
      <div
        className="trim-handle trim-start"
        onMouseDown={handleTrimStartMouseDown}
        title="Drag to adjust trim start"
      />

      {/* Trim Handle - End */}
      <div
        className="trim-handle trim-end"
        onMouseDown={handleTrimEndMouseDown}
        title="Drag to adjust trim end"
      />
    </div>
  )
}

export default TimelineClip
