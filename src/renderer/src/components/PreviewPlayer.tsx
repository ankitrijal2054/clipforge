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
import { formatDuration } from '../../../utils/formatters'
import { Button } from '../../../components/ui/button'
import { Slider } from '../../../components/ui/slider'

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
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400 text-lg">Select a video to preview</p>
          <p className="text-gray-500 text-sm mt-2">
            Choose a video from the sidebar to start editing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
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
        src={`file://${selectedClip.path}`}
        className="w-full h-64 object-contain"
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setPlayhead(0)
          }
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
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4"
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
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatDuration(playhead)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSkip(-10)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayback}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSkip(10)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetTrim}
              className="text-white hover:bg-white hover:bg-opacity-20"
              title="Reset trim points (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Center - Video Info */}
          <div className="text-center">
            <p className="text-sm text-white font-medium">{selectedClip.name}</p>
            <p className="text-xs text-gray-400">
              {formatDuration(trimEnd - trimStart)} / {formatDuration(duration)}
            </p>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <div className="w-20">
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
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
