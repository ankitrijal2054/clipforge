import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '../stores/editorStore'

/**
 * Custom hook for video player functionality
 *
 * This hook manages the HTML5 video element and synchronizes it with the Zustand store.
 * It handles:
 * - Video element reference management
 * - Time synchronization between video and store
 * - Playback state synchronization
 * - Volume control
 * - Seeking functionality
 */
export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Get state and actions from store
  const { selectedClip, isPlaying, playhead, volume, isMuted, setPlayhead, togglePlayback } =
    useEditorStore()

  // Sync video time with store playhead
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const currentTime = video.currentTime
    setPlayhead(currentTime)
  }, [setPlayhead])

  // Handle video ended event
  const handleEnded = useCallback(() => {
    togglePlayback() // This will set isPlaying to false
  }, [togglePlayback])

  // Handle video loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    // Reset playhead when new video is loaded
    setPlayhead(0)
  }, [setPlayhead])

  // Sync store playhead with video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Only update video time if the difference is significant (> 0.1s)
    // This prevents infinite loops when syncing
    const timeDiff = Math.abs(video.currentTime - playhead)
    if (timeDiff > 0.1) {
      video.currentTime = playhead
    }
  }, [playhead])

  // Sync playback state with video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play().catch((error) => {
        console.error('Failed to play video:', error)
        // If play fails, update store to reflect actual state
        togglePlayback()
      })
    } else {
      video.pause()
    }
  }, [isPlaying, togglePlayback])

  // Sync volume with video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // Add event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [handleTimeUpdate, handleEnded, handleLoadedMetadata])

  // Seek to specific time
  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video) return

      video.currentTime = time
      setPlayhead(time)
    },
    [setPlayhead]
  )

  // Skip forward/backward by specified seconds
  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current
      if (!video) return

      const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
      seekTo(newTime)
    },
    [seekTo]
  )

  // Get current video duration
  const getDuration = useCallback(() => {
    const video = videoRef.current
    return video?.duration || 0
  }, [])

  // Check if video is ready
  const isReady = useCallback(() => {
    const video = videoRef.current
    return video ? video.readyState >= 2 : false // HAVE_CURRENT_DATA
  }, [])

  return {
    videoRef,
    seekTo,
    skip,
    getDuration,
    isReady,
    // Expose some state for convenience
    selectedClip,
    isPlaying,
    playhead,
    volume,
    isMuted
  }
}
