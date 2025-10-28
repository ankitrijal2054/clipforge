import React, { useRef, useEffect, useState } from 'react'
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
import { formatDuration, formatResolution, formatFileSize } from '../../../utils/formatters'
import { Button } from '../../../components/ui/button'
import { Slider } from '../../../components/ui/slider'

/**
 * Helper function to create proper file URL for video loading
 */
function getVideoSrc(filePath: string): string {
  // Prefer custom protocol to avoid dev-server cross-origin restrictions
  const normalizedPath = filePath.replace(/\\/g, '/')
  // Ensure no accidental multiple leading slashes
  const pathNoLeadingScheme = normalizedPath.replace(/^\/+/, '/')
  return `clipforge://${encodeURI(pathNoLeadingScheme)}`
}

/**
 * PreviewPlayer component for video playback and controls
 *
 * Features:
 * - HTML5 video player with custom controls
 * - Play/pause, seek, volume, skip controls
 * - Fullscreen support
 * - Keyboard shortcuts integration
 * - Trim point visualization
 * - Professional UI with smooth animations
 */
export function PreviewPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

  // Get state and actions from store
  const {
    selectedClip,
    isPlaying,
    playhead,
    duration,
    volume,
    isMuted,
    trimStart,
    trimEnd,
    togglePlayback,
    setVolume,
    toggleMute,
    setPlayhead,
    resetTrim
  } = useEditorStore()

  // Use video player hook
  const { seekTo, skip, isReady } = useVideoPlayer()

  // Use keyboard shortcuts
  useKeyboardShortcuts()

  // Handle seek slider change
  const handleSeek = (value: number[]) => {
    const time = value[0]
    seekTo(time)
  }

  // Handle volume slider change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  // Handle skip buttons
  const handleSkip = (seconds: number) => {
    skip(seconds)
  }

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
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
        if (controlsTimeout) clearTimeout(controlsTimeout)
        const timeout = setTimeout(() => setShowControls(false), 3000)
        setControlsTimeout(timeout)
      }

      const timeout = setTimeout(() => setShowControls(false), 3000)
      setControlsTimeout(timeout)

      document.addEventListener('mousemove', handleMouseMove)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        if (timeout) clearTimeout(timeout)
      }
    } else {
      setShowControls(true)
      if (controlsTimeout) clearTimeout(controlsTimeout)
    }
  }, [isFullscreen, controlsTimeout])

  // Calculate trim region percentage for visualization
  const trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0
  const trimEndPercent = duration > 0 ? (trimEnd / duration) * 100 : 0
  const playheadPercent = duration > 0 ? (playhead / duration) * 100 : 0

  if (!selectedClip) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-xl border border-gray-700">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Play className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Video Selected</h3>
          <p className="text-gray-400 mb-4">
            Choose a video from the media library to start previewing and editing
          </p>
          <div className="text-sm text-gray-500">
            <p>• Import videos using drag & drop</p>
            <p>• Select from the sidebar to preview</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Video Preview Area */}
      <div
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden group shadow-2xl"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          if (isFullscreen) {
            const timeout = setTimeout(() => setShowControls(false), 2000)
            setControlsTimeout(timeout)
          }
        }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={getVideoSrc(selectedClip.path)}
          className="w-full h-80 object-contain"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setPlayhead(0)
            }
          }}
          onError={(e) => {
            console.error('Video loading error:', e)
            console.error('Video path:', selectedClip.path)
            console.error('Video src:', getVideoSrc(selectedClip.path))
          }}
          onClick={togglePlayback}
        />

        {/* Trim Region Overlay */}
        {duration > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Trim start indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-blue-500"
              style={{ left: `${trimStartPercent}%` }}
            />
            {/* Trim end indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-blue-500"
              style={{ left: `${trimEndPercent}%` }}
            />
            {/* Trim region highlight */}
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
            onClick={togglePlayback}
            className="p-4 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: showControls ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
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
              {/* Trim region background */}
              {duration > 0 && (
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
                value={[playhead]}
                onValueChange={handleSeek}
                max={duration}
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
              <span className="font-medium">{formatDuration(playhead)}</span>
              <span className="text-gray-400">{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSkip(-10)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Skip back 10s (J)"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayback}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSkip(10)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Skip forward 10s (L)"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Center - Video Info */}
            <div className="text-center flex-1 px-4">
              <p className="text-sm text-white font-medium truncate">{selectedClip.name}</p>
              <p className="text-xs text-gray-400">
                Trim: {formatDuration(trimEnd - trimStart)} / {formatDuration(duration)}
              </p>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetTrim}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Reset trim (R)"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Mute (M)"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>

              <div className="w-16">
                <Slider
                  value={[isMuted ? 0 : volume]}
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

      {/* Video Info Panel */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Video Preview</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>{formatResolution(selectedClip.width, selectedClip.height)}</span>
            <span>{formatFileSize(selectedClip.fileSize)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Duration:</span>
            <span className="text-white ml-2 font-medium">
              {formatDuration(selectedClip.duration)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Trim Range:</span>
            <span className="text-white ml-2 font-medium">
              {formatDuration(trimStart)} - {formatDuration(trimEnd)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
