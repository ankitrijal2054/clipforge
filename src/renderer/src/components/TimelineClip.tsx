import React, { useState } from 'react'
import { TimelineClip as TimelineClipType } from '../../../types/timeline'
import { useMultiClipTimelineActions } from '../../../stores/editorStore'
import './TimelineClip.css'

interface TimelineClipProps {
  clip: TimelineClipType
  isSelected: boolean
  onSelect: () => void
  pixelsPerSecond: number
  trackType: 'video' | 'audio'
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
  pixelsPerSecond,
  trackType
}) => {
  const { updateClipTrim, moveClip } = useMultiClipTimelineActions()
  const [isDraggingTrim, setIsDraggingTrim] = useState<'start' | 'end' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTrim, setDragStartTrim] = useState<{ start: number; end: number } | null>(null)
  const [isDraggingClip, setIsDraggingClip] = useState(false)
  const [dragStartClipX, setDragStartClipX] = useState(0)
  const [dragStartClipPosition, setDragStartClipPosition] = useState(0)

  // Calculate dimensions
  const positionPx = clip.position * pixelsPerSecond
  const widthPx = clip.effectiveDuration * pixelsPerSecond

  // Handle clip body drag (for reordering)
  const handleClipMouseDown = (e: React.MouseEvent) => {
    // Only allow drag from middle area (not from trim handles)
    const clipRect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - clipRect.left
    
    // Check if click is on trim handles (they are ~8px wide)
    const isTrimHandle = clickX < 8 || clickX > clipRect.width - 8
    if (isTrimHandle) return
    
    e.preventDefault()
    setIsDraggingClip(true)
    setDragStartClipX(e.clientX)
    setDragStartClipPosition(clip.position)
    onSelect() // Select the clip when dragging
  }

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

  // Handle clip reordering drag
  React.useEffect(() => {
    if (!isDraggingClip) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartClipX
      const deltaTime = deltaX / pixelsPerSecond
      const newPosition = Math.max(0, dragStartClipPosition + deltaTime)
      moveClip(trackType, clip.id, newPosition)
    }

    const handleMouseUp = () => {
      setIsDraggingClip(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingClip, dragStartClipX, dragStartClipPosition, clip, pixelsPerSecond, moveClip, trackType])

  return (
    <div
      className={`timeline-clip ${isSelected ? 'selected' : ''} ${isDraggingClip ? 'dragging' : ''}`}
      style={{
        left: `${positionPx}px`,
        width: `${widthPx}px`,
        backgroundColor: clip.color || '#3b82f6',
        position: 'absolute',
        height: '100%',
        opacity: isDraggingClip ? 0.7 : 1,
        cursor: isDraggingClip ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleClipMouseDown}
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
