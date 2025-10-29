import { useRef, useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '../../../stores/editorStore'
import { TimelineClip } from '../../../types/timeline'

/**
 * Helper: Calculate total timeline duration (max of both tracks)
 */
const getTimelineDuration = (videoClips: TimelineClip[], audioClips: TimelineClip[]): number => {
  const videoDuration =
    videoClips.length > 0
      ? Math.max(...videoClips.map((clip) => clip.position + clip.effectiveDuration))
      : 0
  const audioDuration =
    audioClips.length > 0
      ? Math.max(...audioClips.map((clip) => clip.position + clip.effectiveDuration))
      : 0
  return Math.max(videoDuration, audioDuration)
}

/**
 * Helper: Find which clip is active based on current time
 */
const getActiveClip = (clips: TimelineClip[], currentTime: number): TimelineClip | null => {
  return (
    clips.find(
      (clip) => currentTime >= clip.position && currentTime < clip.position + clip.effectiveDuration
    ) || null
  )
}

/**
 * Helper: Calculate playback time within a clip
 * Formula: playbackTime = currentTime - clipPosition + clipTrimStart
 * Example: If currentTime=7s, clip starts at position 5s with trimStart=2s:
 *   playbackTime = 7 - 5 + 2 = 4 seconds into the source video
 */
const calculateClipPlaybackTime = (currentTime: number, clip: TimelineClip): number => {
  return currentTime - clip.position + clip.trimStart
}

interface TimelinePlaybackReturn {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  audioRef: React.MutableRefObject<HTMLAudioElement | null>
  isPlaying: boolean
  currentTime: number
  totalDuration: number
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  getActiveVideoClip: () => TimelineClip | null
  getActiveAudioClip: () => TimelineClip | null
}

/**
 * Hook for managing multi-clip timeline playback
 *
 * Features:
 * - Sequential playback through multiple clips
 * - Automatic clip switching at boundaries
 * - Trim point respect (plays only from trimStart to trimEnd)
 * - Mute state handling for both tracks
 * - Seek functionality across clips
 * - Play/pause/stop controls
 *
 * Flow:
 * 1. currentTime increments (0 → totalDuration)
 * 2. Find active clip based on currentTime
 * 3. Calculate playback position within clip (accounting for trim)
 * 4. Load and play that clip at calculated position
 * 5. When clip ends, switch to next clip
 * 6. Stop when video track ends (audio can continue)
 */
export const useTimelinePlayback = (): TimelinePlaybackReturn => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  // Track sources to fix URL normalization bug (browsers normalize URLs, so direct comparison fails)
  const pendingVideoSrcRef = useRef<string | null>(null)
  const pendingAudioSrcRef = useRef<string | null>(null)

  // Get state from store
  const { timelineVideoClips, timelineAudioClips, isMuted, clips: libraryClips } = useEditorStore()

  // Local playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  // Calculate total timeline duration
  const totalDuration = getTimelineDuration(timelineVideoClips, timelineAudioClips)

  /**
   * Helper: Get clip from library by ID
   */
  const getLibraryClip = useCallback(
    (libraryId: string) => {
      return libraryClips.find((c) => c.id === libraryId)
    },
    [libraryClips]
  )

  /**
   * Helper: Get video source path for a clip
   */
  const getClipPath = useCallback(
    (libraryId: string): string => {
      const clip = getLibraryClip(libraryId)
      return clip?.path || ''
    },
    [getLibraryClip]
  )

  /**
   * Load and synchronize video and audio elements for current time
   */
  useEffect(() => {
    if (totalDuration === 0) return // No clips on timeline

    // Find active video clip
    const activeVideoClip = getActiveClip(timelineVideoClips, currentTime)

    // Update video element
    if (videoRef.current) {
      if (activeVideoClip) {
        const clipPath = getClipPath(activeVideoClip.libraryId)
        const playbackTime = calculateClipPlaybackTime(currentTime, activeVideoClip)

        // Load clip if not already loaded
        // CRITICAL: Compare against pendingVideoSrcRef, NOT videoRef.current.src
        // because browsers normalize URLs (spaces→%20, etc) so comparison always fails
        const expectedSrc = `clipforge://${clipPath}`
        if (!pendingVideoSrcRef.current || pendingVideoSrcRef.current !== expectedSrc) {
          videoRef.current.src = expectedSrc
          pendingVideoSrcRef.current = expectedSrc
        }

        // Set playback position (with small tolerance for floating point)
        const currentVideoTime = videoRef.current.currentTime
        if (Math.abs(currentVideoTime - playbackTime) > 0.1) {
          videoRef.current.currentTime = playbackTime
        }

        // Apply mute state
        videoRef.current.muted = isMuted.video

        // Play or pause based on isPlaying state
        if (isPlaying && !isMuted.video) {
          videoRef.current
            .play()
            .catch((e) => console.log('Video play error (expected in pause):', e))
        } else {
          videoRef.current.pause()
        }

        // Frame-by-frame logging disabled - too verbose
      } else {
        // No active video clip at this time
        videoRef.current.pause()
      }
    }

    // Find active audio clip
    const activeAudioClip = getActiveClip(timelineAudioClips, currentTime)

    // Update audio element
    if (audioRef.current) {
      if (activeAudioClip && !isMuted.audio) {
        const clipPath = getClipPath(activeAudioClip.libraryId)
        const playbackTime = calculateClipPlaybackTime(currentTime, activeAudioClip)

        // Load clip if not already loaded
        // CRITICAL: Compare against pendingAudioSrcRef, NOT audioRef.current.src
        // because browsers normalize URLs
        const expectedAudioSrc = `clipforge://${clipPath}`
        if (!pendingAudioSrcRef.current || pendingAudioSrcRef.current !== expectedAudioSrc) {
          audioRef.current.src = expectedAudioSrc
          pendingAudioSrcRef.current = expectedAudioSrc
        }

        // Set playback position
        const currentAudioTime = audioRef.current.currentTime
        if (Math.abs(currentAudioTime - playbackTime) > 0.1) {
          audioRef.current.currentTime = playbackTime
        }

        // Play or pause
        if (isPlaying) {
          audioRef.current
            .play()
            .catch((e) => console.log('Audio play error (expected in pause):', e))
        } else {
          audioRef.current.pause()
        }
      } else {
        // Muted or no active audio clip
        audioRef.current.pause()
      }
    }
  }, [
    currentTime,
    timelineVideoClips,
    timelineAudioClips,
    isPlaying,
    isMuted,
    getClipPath,
    totalDuration
  ])

  /**
   * Main playback loop: increment currentTime at 60fps
   */
  useEffect(() => {
    if (!isPlaying || totalDuration === 0) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
      return
    }

    playbackIntervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const nextTime = prev + 0.016 // ~60fps (1000ms / 60fps ≈ 16.67ms)

        // Stop playback when video track ends
        if (nextTime >= totalDuration) {
          setIsPlaying(false)
          return 0
        }

        return nextTime
      })
    }, 16)

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [isPlaying, totalDuration])

  /**
   * Control functions
   */
  const play = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const stop = useCallback(() => {
    setCurrentTime(0)
    setIsPlaying(false)
  }, [])

  const seek = useCallback(
    (time: number) => {
      // Clamp to valid range
      const clampedTime = Math.max(0, Math.min(time, totalDuration))
      setCurrentTime(clampedTime)
    },
    [totalDuration]
  )

  return {
    // Refs for video and audio elements
    videoRef,
    audioRef,

    // Playback state
    isPlaying,
    currentTime,
    totalDuration,

    // Control functions
    play,
    pause,
    stop,
    seek,

    // Helper getters
    getActiveVideoClip: () => getActiveClip(timelineVideoClips, currentTime),
    getActiveAudioClip: () => getActiveClip(timelineAudioClips, currentTime)
  }
}
