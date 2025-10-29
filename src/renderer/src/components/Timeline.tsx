import React, { useRef, useEffect, useState } from 'react'
import {
  useTimelineClips,
  useMultiClipTimelineActions,
  useTimelineTrackMute
} from '../../../stores/editorStore'
import TimelineClip from './TimelineClip'
import TrackHeader from './TrackHeader'
import { ZoomIn, ZoomOut } from 'lucide-react'
import './Timeline.css'

/**
 * Constants for timeline rendering
 * At 100% zoom: 50 minutes = container width
 * So: containerWidth (1400px) / 3000s (50 min) = 0.467 px per second at 100% zoom
 */
const DEFAULT_PIXELS_PER_SECOND = 0.5 // At 100% zoom: 0.5 pixels per second (50 min fits in ~1400px)
const ZOOM_MIN = 0.1 // 10% zoom
const ZOOM_MAX = 10 // 1000% zoom
const ZOOM_STEP = 0.1
const TIME_MARKER_INTERVAL_BASE = 300 // 5 minutes at default zoom

/**
 * Helper to format time as MM:SS
 */
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Calculate time marker interval based on zoom level
 */
const getTimeMarkerInterval = (zoomLevel: number): number => {
  // At zoom 1x, every 5 minutes. Higher zoom = more frequent markers
  if (zoomLevel <= 0.5) return 600 // 10 min
  if (zoomLevel <= 1) return 300 // 5 min
  if (zoomLevel <= 2) return 120 // 2 min
  if (zoomLevel <= 5) return 60 // 1 min
  return 30 // 30 sec at high zoom
}

/**
 * Helper to generate time markers
 */
const generateTimeMarkers = (duration: number, interval: number): number[] => {
  const markers: number[] = []
  for (let time = 0; time <= duration; time += interval) {
    markers.push(time)
  }
  return markers
}

/**
 * Main Timeline Component with Zoom Support
 */
export const Timeline: React.FC = () => {
  const { timelineVideoClips, timelineAudioClips, selectedClipId } = useTimelineClips()
  const { selectTimelineClip, toggleTrackMute, addClipToTrack } = useMultiClipTimelineActions()
  const isMuted = useTimelineTrackMute()

  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const [playheadTime, setPlayheadTime] = useState(0)
  const [dragOverTrack, setDragOverTrack] = useState<'video' | 'audio' | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1) // 100% = 1x

  // Calculate duration and pixels per second
  const calculateDuration = (): number => {
    const videoDuration = timelineVideoClips.reduce(
      (max, clip) => Math.max(max, clip.position + clip.effectiveDuration),
      0
    )
    const audioDuration = timelineAudioClips.reduce(
      (max, clip) => Math.max(max, clip.position + clip.effectiveDuration),
      0
    )
    return Math.max(videoDuration, audioDuration, 60) // Minimum 1 minute
  }

  const totalDuration = calculateDuration()
  const pixelsPerSecond = DEFAULT_PIXELS_PER_SECOND * zoomLevel
  const timelineWidth = Math.max(totalDuration * pixelsPerSecond, 1400) // Min 1400px
  const timeMarkerInterval = getTimeMarkerInterval(zoomLevel)
  const timeMarkers = generateTimeMarkers(totalDuration, timeMarkerInterval)

  // Handle playhead click to seek
  const handlePlayheadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineScrollRef.current) return
    const rect = timelineScrollRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left + timelineScrollRef.current.scrollLeft
    const time = clickX / pixelsPerSecond
    setPlayheadTime(Math.max(0, Math.min(time, totalDuration)))
  }

  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX))
  }

  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, ZOOM_MIN))
  }

  // Handle mouse wheel zoom (Ctrl + Scroll)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()

    const direction = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoomLevel((prev) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev + direction)))
  }

  // Handle drag over timeline
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, trackType: 'video' | 'audio') => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverTrack(trackType)
  }

  const handleDragLeave = () => {
    setDragOverTrack(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, trackType: 'video' | 'audio') => {
    e.preventDefault()
    setDragOverTrack(null)

    const clipData = e.dataTransfer.getData('application/json')
    if (clipData) {
      try {
        const libraryClip = JSON.parse(clipData)
        const isVideoClip = libraryClip.width && libraryClip.height
        const isAudioClip = !isVideoClip

        if ((isVideoClip && trackType === 'video') || (isAudioClip && trackType === 'audio')) {
          addClipToTrack(trackType, libraryClip)
          console.log('✓ Added clip to', trackType, 'track:', libraryClip.name)
        } else {
          console.warn(`Cannot drop ${isVideoClip ? 'video' : 'audio'} clip to ${trackType} track`)
        }
      } catch (error) {
        console.error('Failed to parse dropped clip:', error)
      }
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'S') {
        if (selectedClipId) {
          e.preventDefault()
          console.log('Splitting clip', selectedClipId, 'at time', playheadTime)
        }
      } else if (e.key === 'Delete') {
        if (selectedClipId) {
          e.preventDefault()
          console.log('Deleting clip', selectedClipId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedClipId, playheadTime])

  return (
    <div className="timeline-container">
      {/* Zoom Controls and Info */}
      <div className="timeline-controls">
        <div className="zoom-controls">
          <button
            onClick={handleZoomOut}
            className="zoom-button"
            title="Zoom out (−)"
            disabled={zoomLevel <= ZOOM_MIN}
          >
            <ZoomOut size={16} />
          </button>
          <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="zoom-button"
            title="Zoom in (+)"
            disabled={zoomLevel >= ZOOM_MAX}
          >
            <ZoomIn size={16} />
          </button>
        </div>
        <div className="timeline-info">
          <span className="info-label">
            Tip: Ctrl+Scroll to zoom • Drag clips to timeline • S to split, Delete to remove
          </span>
        </div>
      </div>

      {/* Timeline Header with Time Markers */}
      <div className="timeline-header-container">
        <div className="timeline-header" style={{ width: `${timelineWidth}px` }}>
          {timeMarkers.map((time) => (
            <div key={time} className="time-marker" style={{ left: `${time * pixelsPerSecond}px` }}>
              <div className="marker-line" />
              <span className="time-label">{formatTime(time)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Tracks - Scrollable */}
      <div className="timeline-scroll-container" ref={timelineScrollRef} onWheel={handleWheel}>
        {/* Video Track */}
        <div className="track-section">
          <TrackHeader
            trackType="video"
            isMuted={isMuted.video}
            onToggleMute={() => toggleTrackMute('video')}
          />
          <div
            className={`track video-track ${dragOverTrack === 'video' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'video')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'video')}
          >
            <div
              className="clip-container"
              style={{ width: `${timelineWidth}px`, position: 'relative' }}
            >
              {timelineVideoClips.map((clip) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  isSelected={selectedClipId === clip.id}
                  onSelect={() => selectTimelineClip(clip.id)}
                  pixelsPerSecond={pixelsPerSecond}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Audio Track */}
        <div className="track-section">
          <TrackHeader
            trackType="audio"
            isMuted={isMuted.audio}
            onToggleMute={() => toggleTrackMute('audio')}
          />
          <div
            className={`track audio-track ${dragOverTrack === 'audio' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'audio')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'audio')}
          >
            <div
              className="clip-container"
              style={{ width: `${timelineWidth}px`, position: 'relative' }}
            >
              {timelineAudioClips.map((clip) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  isSelected={selectedClipId === clip.id}
                  onSelect={() => selectTimelineClip(clip.id)}
                  pixelsPerSecond={pixelsPerSecond}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Playhead - Absolute positioned over scrollable area */}
      <div className="playhead-wrapper">
        <div
          className="playhead"
          style={{
            left: `${playheadTime * pixelsPerSecond}px`,
            height: '100%'
          }}
          onClick={handlePlayheadClick}
        >
          <div className="playhead-line" />
          <div className="playhead-time">{formatTime(playheadTime)}</div>
        </div>
      </div>
    </div>
  )
}

export default Timeline
