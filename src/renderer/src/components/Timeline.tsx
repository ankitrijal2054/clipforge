import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useTimeline } from '../../../stores/editorStore'
import { useTimelineActions } from '../../../stores/editorStore'
import { formatDuration } from '../../../utils/formatters'
import { Button } from '../../../components/ui/button'

/**
 * Timeline component for video editing
 *
 * Features:
 * - Responsive design that adapts to screen size
 * - Time markers and ruler
 * - Playhead indicator synchronized with video player
 * - Trim region visualization
 * - Click-to-seek functionality
 * - Zoom in/out controls
 * - Pan/scroll when zoomed
 * - Drag playhead to scrub
 * - All components fit within screen bounds
 *
 * Responsive Behavior:
 * - Maintains minimum height and width
 * - Scales with container size
 * - Hides labels on small screens
 * - Adjusts marker intervals dynamically
 */

interface TimeMarker {
  time: number
  label: string
}

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)

  // Get state from store
  const { playhead, duration, zoomLevel, timelineScrollOffset, trimStart, trimEnd } = useTimeline()

  // Get actions from store
  const { setPlayhead, setZoomLevel, setTimelineScrollOffset } = useTimelineActions()

  // Handle window resize for responsive design
  useEffect(() => {
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

  // Calculate pixels per second based on zoom and container width
  const pixelsPerSecond = useMemo(() => {
    if (duration === 0 || containerWidth === 0) return 1
    // Minimum 40px per second for usability
    return Math.max(40, (containerWidth * zoomLevel) / duration)
  }, [duration, zoomLevel, containerWidth])

  // Calculate total timeline width including zoom
  const totalTimelineWidth = useMemo(() => {
    if (duration === 0) return containerWidth
    return Math.max(containerWidth, duration * pixelsPerSecond)
  }, [duration, pixelsPerSecond, containerWidth])

  // Generate time markers based on duration and zoom level
  const timeMarkers = useMemo((): TimeMarker[] => {
    if (duration === 0) return []

    const markers: TimeMarker[] = []
    // Determine interval based on zoom level and duration
    let interval: number

    if (duration < 10) {
      interval = 1 // 1 second
    } else if (duration < 30) {
      interval = 2 // 2 seconds
    } else if (duration < 60) {
      interval = 5 // 5 seconds
    } else if (duration < 300) {
      interval = 10 // 10 seconds
    } else if (duration < 600) {
      interval = 30 // 30 seconds
    } else {
      interval = 60 // 1 minute
    }

    // Adjust interval for zoom level
    const pixelsPerMarker = interval * pixelsPerSecond
    if (pixelsPerMarker < 60) {
      // Markers too close, increase interval
      interval = Math.ceil(interval * (60 / pixelsPerMarker))
    }

    // Generate markers
    for (let i = 0; i <= duration; i += interval) {
      markers.push({
        time: i,
        label: formatDuration(i)
      })
    }

    return markers
  }, [duration, pixelsPerSecond])

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(10, zoomLevel * 1.2)
    setZoomLevel(newZoom)
  }, [zoomLevel, setZoomLevel])

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.5, zoomLevel / 1.2)
    setZoomLevel(newZoom)
  }, [zoomLevel, setZoomLevel])

  // Handle mouse wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()

      const direction = e.deltaY > 0 ? -1 : 1 // Invert for natural zoom
      const newZoom = Math.max(0.5, Math.min(10, zoomLevel * (1 + direction * 0.1)))
      setZoomLevel(newZoom)
    },
    [zoomLevel, setZoomLevel]
  )

  // Handle click on timeline to seek
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return

      const rect = trackRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left + timelineScrollOffset

      const time = clickX / pixelsPerSecond
      const clampedTime = Math.max(0, Math.min(time, duration))

      setPlayhead(clampedTime)
    },
    [pixelsPerSecond, duration, timelineScrollOffset, setPlayhead]
  )

  // Handle playhead drag
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingPlayhead(true)
  }, [])

  // Handle playhead drag movement
  useEffect(() => {
    if (!isDraggingPlayhead || !trackRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = trackRef.current!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left + timelineScrollOffset

      const time = mouseX / pixelsPerSecond
      const clampedTime = Math.max(0, Math.min(time, duration))

      setPlayhead(clampedTime)
    }

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingPlayhead, pixelsPerSecond, duration, timelineScrollOffset, setPlayhead])

  // Handle scroll for pan
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollLeft = (e.target as HTMLDivElement).scrollLeft
      setTimelineScrollOffset(scrollLeft)
    },
    [setTimelineScrollOffset]
  )

  // Show placeholder when no video selected
  if (duration === 0) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-6 border border-gray-700 flex items-center justify-center min-h-32">
        <p className="text-gray-400 text-center">Select a video to display timeline</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
            title="Zoom out (Ctrl + Scroll)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-400 min-w-fit">{Math.round(zoomLevel * 100)}%</span>
          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
            title="Zoom in (Ctrl + Scroll)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div>
            <span>Start: </span>
            <span className="text-white font-medium">{formatDuration(trimStart)}</span>
          </div>
          <div>
            <span>Duration: </span>
            <span className="text-white font-medium">{formatDuration(trimEnd - trimStart)}</span>
          </div>
          <div>
            <span>End: </span>
            <span className="text-white font-medium">{formatDuration(trimEnd)}</span>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={containerRef}
        className="relative w-full bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
      >
        {/* Scrollable Track */}
        <div
          ref={trackRef}
          className="relative w-full overflow-x-auto overflow-y-hidden bg-gray-900"
          style={{ height: '120px', minHeight: '120px', maxHeight: '120px' }}
          onClick={handleTimelineClick}
          onWheel={handleWheel}
          onScroll={handleScroll}
        >
          {/* Timeline Content */}
          <div
            className="relative bg-gradient-to-b from-gray-800 to-gray-900"
            style={{
              width: `${totalTimelineWidth}px`,
              height: '100%'
            }}
          >
            {/* Ruler and Time Markers */}
            <div className="absolute top-0 left-0 w-full h-8 border-b border-gray-700">
              {timeMarkers.map((marker) => (
                <div
                  key={marker.time}
                  className="absolute h-full flex flex-col items-center"
                  style={{
                    left: `${marker.time * pixelsPerSecond}px`,
                    width: '1px'
                  }}
                >
                  {/* Marker line */}
                  <div className="h-2 w-px bg-gray-600" />
                  {/* Marker label */}
                  <div className="text-xs text-gray-500 mt-1 whitespace-nowrap ml-1">
                    {marker.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Video Clip Bar */}
            <div
              className="absolute top-8 left-0 h-12 bg-gradient-to-r from-blue-600 to-blue-700 opacity-30 border-l border-r border-blue-500"
              style={{
                width: `${duration * pixelsPerSecond}px`
              }}
            />

            {/* Trim Region Overlay */}
            <div
              className="absolute top-8 h-12 bg-blue-500 bg-opacity-40 border-l-2 border-r-2 border-blue-400"
              style={{
                left: `${trimStart * pixelsPerSecond}px`,
                width: `${(trimEnd - trimStart) * pixelsPerSecond}px`
              }}
            />

            {/* Dimmed regions outside trim area */}
            {trimStart > 0 && (
              <div
                className="absolute top-8 h-12 bg-black opacity-40"
                style={{
                  left: '0',
                  width: `${trimStart * pixelsPerSecond}px`
                }}
              />
            )}
            {trimEnd < duration && (
              <div
                className="absolute top-8 h-12 bg-black opacity-40"
                style={{
                  left: `${trimEnd * pixelsPerSecond}px`,
                  width: `${(duration - trimEnd) * pixelsPerSecond}px`
                }}
              />
            )}

            {/* Playhead - with cursor for dragging */}
            <motion.div
              className="absolute top-0 h-full w-1 bg-red-500 cursor-grab active:cursor-grabbing"
              style={{
                left: `${playhead * pixelsPerSecond}px`
              }}
              onMouseDown={handlePlayheadMouseDown}
              whileHover={{ scaleX: 1.5, backgroundColor: '#ff6b6b' }}
              transition={{ type: 'tween', duration: 0.1 }}
            >
              {/* Playhead indicator handle */}
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full shadow-lg pointer-events-none" />
            </motion.div>

            {/* Current time tooltip on playhead */}
            <div
              className="absolute top-0 text-xs text-white bg-gray-900 px-2 py-1 rounded border border-gray-700 pointer-events-none"
              style={{
                left: `${playhead * pixelsPerSecond}px`,
                transform: 'translateX(-50%)',
                marginTop: '-28px'
              }}
            >
              {formatDuration(playhead)}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Info Bar */}
      <div className="text-xs text-gray-500 px-4">
        <p>Tip: Click to seek, drag playhead to scrub, Ctrl+Scroll to zoom</p>
      </div>
    </div>
  )
}
