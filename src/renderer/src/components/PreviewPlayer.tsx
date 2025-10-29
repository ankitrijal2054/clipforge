import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  RotateCcw
} from 'lucide-react'
import { useEditorStore } from '../../../stores/editorStore'
import { useVideoPlayer } from '../../../hooks/useVideoPlayer'
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts'
import { useTimelinePlayback } from '../hooks/useTimelinePlayback'
import { formatDuration, formatResolution, formatFileSize } from '../../../utils/formatters'
import { Button } from '../../../components/ui/button'
import { Slider } from '../../../components/ui/slider'

/**
 * Helper function to create proper file URL for video loading
 */
function getVideoSrc(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const pathNoLeadingScheme = normalizedPath.replace(/^\/+/, '/')
  return `clipforge://${encodeURI(pathNoLeadingScheme)}`
}

interface PreviewPlayerProps {
  isFullscreen?: boolean
  onFullscreenChange?: (isFullscreen: boolean) => void
}

/**
 * PreviewPlayer component supporting both single-clip and multi-clip playback
 *
 * Features:
 * - Single-clip mode: Traditional trim workflow (when timeline is empty)
 * - Multi-clip mode: Sequential timeline playback (when timeline has clips)
 * - Automatic mode switching based on timeline state
 * - Audio track support in multi-clip mode
 * - Mute state for both video and audio tracks
 * - HTML5 video player with custom controls
 */
export function PreviewPlayer({ onFullscreenChange }: PreviewPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get state from store
  const {
    selectedClip,
    isPlaying: singleClipIsPlaying,
    playhead,
    duration,
    volume,
    isMuted,
    trimStart,
    trimEnd,
    togglePlayback: toggleSingleClipPlayback,
    setVolume,
    toggleMute,
    setPlayhead,
    resetTrim,
    timelineVideoClips,
    timelineAudioClips
  } = useEditorStore()

  // Single-clip playback (for MVP mode)
  const { videoRef: singleClipVideoRef, seekTo, skip } = useVideoPlayer()

  // Multi-clip timeline playback
  const timelinePlayback = useTimelinePlayback()

  // Determine which mode we're in
  const hasTimelineClips = timelineVideoClips.length > 0 || timelineAudioClips.length > 0
  const isTimelineMode = hasTimelineClips

  // Select appropriate video ref and state based on mode
  const displayIsPlaying = isTimelineMode ? timelinePlayback.isPlaying : singleClipIsPlaying
  const displayCurrentTime = isTimelineMode ? timelinePlayback.currentTime : playhead
  const displayDuration = isTimelineMode ? timelinePlayback.totalDuration : duration

  // Use keyboard shortcuts
  useKeyboardShortcuts()

  // Handle seek slider change (works for both modes)
  const handleSeek = (value: number[]) => {
    const time = value[0]
    if (isTimelineMode) {
      timelinePlayback.seek(time)
    } else {
      seekTo(time)
    }
  }

  // Handle volume slider change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  // Handle skip buttons (single-clip mode only)
  const handleSkip = (seconds: number) => {
    if (!isTimelineMode) {
      skip(seconds)
    }
  }

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (isTimelineMode) {
      if (timelinePlayback.isPlaying) {
        timelinePlayback.pause()
      } else {
        timelinePlayback.play()
      }
    } else {
      toggleSingleClipPlayback()
    }
  }

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    console.log('🔍 toggleFullscreen called')
    const newFullscreenState = !isFullscreen
    setIsFullscreen(newFullscreenState)
    onFullscreenChange?.(newFullscreenState)
    console.log('✅ Fullscreen toggled:', newFullscreenState)
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handleToggleFullscreen = () => {
      toggleFullscreen()
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('toggleFullscreen', handleToggleFullscreen)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('toggleFullscreen', handleToggleFullscreen)
    }
  }, [])

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const handleMouseMove = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
      }

      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)

      document.addEventListener('mousemove', handleMouseMove)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      }
    } else {
      setShowControls(true)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      return undefined
    }
  }, [isFullscreen])

  // Calculate trim region percentage (single-clip mode only)
  const trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0
  const trimEndPercent = duration > 0 ? (trimEnd / duration) * 100 : 0
  const playheadPercent = displayDuration > 0 ? (displayCurrentTime / displayDuration) * 100 : 0

  // Determine what to display
  if (!isTimelineMode) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-xl border border-gray-700">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Play className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Add Video to Timeline</h3>
          <p className="text-gray-400 mb-4">
            Start editing by dragging videos from the media library to the timeline
          </p>
          <div className="text-sm text-gray-500">
            <p>• Select videos from the library sidebar</p>
            <p>• Drag them to the timeline below</p>
            <p>• Preview will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Video Preview Area */}
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden group shadow-2xl flex-1 ${
          isFullscreen ? 'rounded-none' : 'rounded-xl'
        }`}
        style={isFullscreen ? { width: '100vw', height: '100vh' } : undefined}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          if (isFullscreen) {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000)
          }
        }}
      >
        {/* Video Element - Visible only in single-clip mode */}
        {!isTimelineMode && (
          <video
            ref={singleClipVideoRef}
            src={selectedClip ? getVideoSrc(selectedClip.path) : ''}
            className={
              isFullscreen ? 'w-full h-full object-contain' : 'w-full h-full object-contain'
            }
            onLoadedMetadata={() => {
              if (singleClipVideoRef.current) {
                setPlayhead(0)
              }
            }}
            onError={(e) => {
              console.error('Video loading error:', e)
            }}
            onClick={handlePlayPause}
          />
        )}

        {/* Timeline Video Element - Visible in timeline mode */}
        {isTimelineMode && (
          <video
            ref={timelinePlayback.videoRef}
            className={
              isFullscreen ? 'w-full h-full object-contain' : 'w-full h-full object-contain'
            }
            preload="metadata"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Timeline video error:', e)
            }}
            onClick={handlePlayPause}
          />
        )}

        {/* Hidden Audio Element for timeline mode */}
        {isTimelineMode && (
          <audio ref={timelinePlayback.audioRef} preload="metadata" crossOrigin="anonymous" />
        )}

        {/* Trim Region Overlay (single-clip mode only) */}
        {!isTimelineMode && duration > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 bottom-0 w-1 bg-blue-500"
              style={{ left: `${trimStartPercent}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-1 bg-blue-500"
              style={{ left: `${trimEndPercent}%` }}
            />
            <div
              className="absolute top-0 bottom-0 bg-blue-500 bg-opacity-20"
              style={{
                left: `${trimStartPercent}%`,
                width: `${trimEndPercent - trimStartPercent}%`
              }}
            />
          </div>
        )}

        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            onClick={handlePlayPause}
            className="p-4 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: showControls ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {displayIsPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </motion.button>
        </div>

        {/* Controls Overlay */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: showControls ? 1 : 0,
            y: showControls ? 0 : 20
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative">
              {/* Trim region background (single-clip mode) */}
              {!isTimelineMode && duration > 0 && (
                <div
                  className="absolute top-0 h-2 bg-blue-500 bg-opacity-30 rounded"
                  style={{
                    left: `${trimStartPercent}%`,
                    width: `${trimEndPercent - trimStartPercent}%`
                  }}
                />
              )}

              {/* Progress slider */}
              <Slider
                value={[displayCurrentTime]}
                onValueChange={handleSeek}
                max={displayDuration || 1}
                step={0.1}
                className="w-full"
              />

              {/* Playhead indicator */}
              <div
                className="absolute top-0 w-1 h-2 bg-red-500 rounded"
                style={{ left: `${playheadPercent}%` }}
              />
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-gray-300 mt-2">
              <span className="font-medium">{formatDuration(displayCurrentTime)}</span>
              <span className="text-gray-400">
                {isTimelineMode
                  ? `Timeline ${formatDuration(displayDuration)}`
                  : formatDuration(displayDuration)}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-1">
              {!isTimelineMode && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(-10)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    title="Skip back 10s (J)"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Play/Pause (Space)"
              >
                {displayIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              {!isTimelineMode && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(10)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    title="Skip forward 10s (L)"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Center - Video Info */}
            <div className="text-center flex-1 px-4">
              <p className="text-sm text-white font-medium truncate">
                {isTimelineMode ? 'Timeline Playback' : selectedClip?.name || 'No video'}
              </p>
              {!isTimelineMode && (
                <p className="text-xs text-gray-400">
                  Trim: {formatDuration(trimEnd - trimStart)} / {formatDuration(duration)}
                </p>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {!isTimelineMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTrim}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Reset trim (R)"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Mute (M)"
              >
                {isMuted.video && isMuted.audio ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              <div className="w-16">
                <Slider
                  value={[isMuted.video && isMuted.audio ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Video Info Panel - Compact */}
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {isTimelineMode
              ? `Timeline with ${timelineVideoClips.length} video clips + ${timelineAudioClips.length} audio clips`
              : selectedClip
                ? `${formatResolution(selectedClip.width, selectedClip.height)} • ${formatFileSize(selectedClip.fileSize)} • ${formatDuration(selectedClip.duration)}`
                : 'No video loaded'}
          </div>
          {!isTimelineMode && selectedClip && (
            <div className="text-xs text-gray-500">
              Trim: {formatDuration(trimStart)} - {formatDuration(trimEnd)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
