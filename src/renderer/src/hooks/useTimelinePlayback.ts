import { useRef, useEffect, useCallback } from 'react'
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
  const rafIdRef = useRef<number | null>(null)
  // Track sources to fix URL normalization bug (browsers normalize URLs, so direct comparison fails)
  const pendingVideoSrcRef = useRef<string | null>(null)
  const pendingAudioSrcRef = useRef<string | null>(null)
  const prevIsPlayingRef = useRef<boolean>(false)
  const prevActiveVideoClipIdRef = useRef<string | null>(null)
  const prevActiveAudioClipIdRef = useRef<string | null>(null)
  const lastVideoDrivenGlobalTimeRef = useRef<number>(0)

  // Get state from store (including shared timeline playback state)
  const {
    timelineVideoClips,
    timelineAudioClips,
    isMuted,
    clips: libraryClips,
    timelineCurrentTime,
    timelineIsPlaying,
    setTimelineCurrentTime,
    setTimelinePlaying
  } = useEditorStore()

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
  useEffect((): void => {
    if (totalDuration === 0) return // No clips on timeline

    // Find active video clip
    const activeVideoClip = getActiveClip(timelineVideoClips, timelineCurrentTime)

    // Update video element
    if (videoRef.current) {
      if (activeVideoClip) {
        const clipPath = getClipPath(activeVideoClip.libraryId)
        const playbackTime = calculateClipPlaybackTime(timelineCurrentTime, activeVideoClip)

        // Load clip if not already loaded
        // CRITICAL: Compare against pendingVideoSrcRef, NOT videoRef.current.src
        // because browsers normalize URLs (spaces→%20, etc) so comparison always fails
        const expectedSrc = `clipforge://${clipPath}`
        const videoSrcChanged =
          !pendingVideoSrcRef.current || pendingVideoSrcRef.current !== expectedSrc
        if (videoSrcChanged) {
          videoRef.current.src = expectedSrc
          pendingVideoSrcRef.current = expectedSrc
        }

        // Set playback position only when paused or on source change (avoid periodic jumps)
        const currentVideoTime = videoRef.current.currentTime
        if (!timelineIsPlaying) {
          if (Math.abs(currentVideoTime - playbackTime) > 0.05) {
            videoRef.current.currentTime = playbackTime
          }
        } else if (videoSrcChanged) {
          videoRef.current.currentTime = playbackTime
        }

        // Apply mute state (visuals should continue even if muted)
        videoRef.current.muted = isMuted.video

        // Only call play/pause on transitions or when clip changed
        const activeVideoClipId = activeVideoClip.id
        const shouldStart =
          timelineIsPlaying &&
          (!prevIsPlayingRef.current ||
            videoSrcChanged ||
            prevActiveVideoClipIdRef.current !== activeVideoClipId)
        const shouldPause = !timelineIsPlaying && prevIsPlayingRef.current
        if (shouldStart) {
          videoRef.current.play().catch((e) => console.log('Video play error:', e))
        } else if (shouldPause) {
          videoRef.current.pause()
        }
        prevActiveVideoClipIdRef.current = activeVideoClipId

        // Frame-by-frame logging disabled - too verbose
      } else {
        // No active video clip at this time
        videoRef.current.pause()
      }
    }

    // Find active audio clip
    const activeAudioClip = getActiveClip(timelineAudioClips, timelineCurrentTime)

    // Update audio element
    if (audioRef.current) {
      if (activeAudioClip && !isMuted.audio) {
        const clipPath = getClipPath(activeAudioClip.libraryId)
        const playbackTime = calculateClipPlaybackTime(timelineCurrentTime, activeAudioClip)

        // Load clip if not already loaded
        // CRITICAL: Compare against pendingAudioSrcRef, NOT audioRef.current.src
        // because browsers normalize URLs
        const expectedAudioSrc = `clipforge://${clipPath}`
        const audioSrcChanged =
          !pendingAudioSrcRef.current || pendingAudioSrcRef.current !== expectedAudioSrc
        if (audioSrcChanged) {
          audioRef.current.src = expectedAudioSrc
          pendingAudioSrcRef.current = expectedAudioSrc
        }

        // Set playback position only when paused or on source change
        const currentAudioTime = audioRef.current.currentTime
        if (!timelineIsPlaying) {
          if (Math.abs(currentAudioTime - playbackTime) > 0.05) {
            audioRef.current.currentTime = playbackTime
          }
        } else if (audioSrcChanged) {
          audioRef.current.currentTime = playbackTime
        }

        // Only call play/pause on transitions or when clip changed
        const activeAudioClipId = activeAudioClip.id
        const shouldStartAudio =
          timelineIsPlaying &&
          (!prevIsPlayingRef.current ||
            audioSrcChanged ||
            prevActiveAudioClipIdRef.current !== activeAudioClipId)
        const shouldPauseAudio = !timelineIsPlaying && prevIsPlayingRef.current
        if (shouldStartAudio) {
          audioRef.current.play().catch((e) => console.log('Audio play error:', e))
        } else if (shouldPauseAudio) {
          audioRef.current.pause()
        }
        prevActiveAudioClipIdRef.current = activeAudioClipId
      } else {
        // Muted or no active audio clip
        audioRef.current.pause()
      }
    }
    prevIsPlayingRef.current = timelineIsPlaying
  }, [
    timelineCurrentTime,
    timelineVideoClips,
    timelineAudioClips,
    timelineIsPlaying,
    isMuted,
    getClipPath,
    totalDuration
  ])

  /**
   * Handle external seeks while playing (timeline drag/slider changes)
   * If the global time changes significantly from the last video-driven time,
   * seek the underlying media elements even during playback.
   */
  useEffect((): void => {
    // Only act when playing and we have video clips
    if (!timelineIsPlaying || timelineVideoClips.length === 0) return

    const delta = Math.abs(timelineCurrentTime - lastVideoDrivenGlobalTimeRef.current)
    if (delta <= 0.05) return // ignore tiny drift

    // Seek video to match new global time
    const targetVideoClip = getActiveClip(timelineVideoClips, timelineCurrentTime)
    if (videoRef.current && targetVideoClip) {
      const targetPath = `clipforge://${getClipPath(targetVideoClip.libraryId)}`
      if (pendingVideoSrcRef.current !== targetPath) {
        videoRef.current.src = targetPath
        pendingVideoSrcRef.current = targetPath
      }
      const clipPlaybackTime = calculateClipPlaybackTime(timelineCurrentTime, targetVideoClip)
      videoRef.current.currentTime = clipPlaybackTime
      // Ensure it keeps playing
      videoRef.current.play().catch(() => {})
    }

    // Seek audio if applicable and not muted
    const targetAudioClip = getActiveClip(timelineAudioClips, timelineCurrentTime)
    if (audioRef.current && targetAudioClip && !isMuted.audio) {
      const targetAudioPath = `clipforge://${getClipPath(targetAudioClip.libraryId)}`
      if (pendingAudioSrcRef.current !== targetAudioPath) {
        audioRef.current.src = targetAudioPath
        pendingAudioSrcRef.current = targetAudioPath
      }
      const audioPlaybackTime = calculateClipPlaybackTime(timelineCurrentTime, targetAudioClip)
      audioRef.current.currentTime = audioPlaybackTime
      audioRef.current.play().catch(() => {})
    }

    // Update the last video-driven time baseline to the externally requested time
    lastVideoDrivenGlobalTimeRef.current = timelineCurrentTime
  }, [
    timelineCurrentTime,
    timelineIsPlaying,
    timelineVideoClips,
    timelineAudioClips,
    isMuted,
    getClipPath
  ])

  /**
   * Main playback loop: use requestAnimationFrame tied to video clock to avoid jitter
   */
  useEffect(() => {
    const clearRaf = (): void => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
    const clearIntervalIfAny = (): void => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }

    if (!timelineIsPlaying || totalDuration === 0) {
      clearRaf()
      clearIntervalIfAny()
      return
    }

    if (videoRef.current && timelineVideoClips.length > 0) {
      const step = (): void => {
        const activeClip = getActiveClip(timelineVideoClips, timelineCurrentTime)
        if (!activeClip) {
          setTimelinePlaying(false)
          setTimelineCurrentTime(0)
          return
        }

        const localVideoTime = videoRef.current!.currentTime
        const clampedLocal = Math.min(
          Math.max(localVideoTime, activeClip.trimStart),
          activeClip.trimEnd
        )
        const globalTime = activeClip.position + (clampedLocal - activeClip.trimStart)

        // Handle end-of-clip sequencing
        if (clampedLocal >= activeClip.trimEnd - 0.005) {
          const currentIndex = timelineVideoClips.findIndex((c) => c.id === activeClip.id)
          const nextClip = currentIndex >= 0 ? timelineVideoClips[currentIndex + 1] : null
          if (nextClip && videoRef.current) {
            const nextSrc = `clipforge://${getClipPath(nextClip.libraryId)}`
            if (pendingVideoSrcRef.current !== nextSrc) {
              videoRef.current.src = nextSrc
              pendingVideoSrcRef.current = nextSrc
            }
            // Jump to next clip start
            videoRef.current.currentTime = nextClip.trimStart
            setTimelineCurrentTime(nextClip.position)
            videoRef.current.play().catch(() => {})
          } else {
            // Last clip ended
            setTimelinePlaying(false)
            setTimelineCurrentTime(0)
            return
          }
        } else {
          // Normal progression within clip
          setTimelineCurrentTime(globalTime)
        }
        // Track last video-driven time
        lastVideoDrivenGlobalTimeRef.current = timelineCurrentTime
        rafIdRef.current = requestAnimationFrame(step)
      }

      rafIdRef.current = requestAnimationFrame(step)
      return () => clearRaf()
    }

    // Fallback: if no video clips, increment time with interval
    playbackIntervalRef.current = setInterval(() => {
      const nextTime = timelineCurrentTime + 0.016
      if (nextTime >= totalDuration) {
        setTimelinePlaying(false)
        setTimelineCurrentTime(0)
      } else {
        setTimelineCurrentTime(nextTime)
      }
    }, 16)

    return () => clearIntervalIfAny()
  }, [
    timelineIsPlaying,
    totalDuration,
    setTimelineCurrentTime,
    setTimelinePlaying,
    timelineCurrentTime,
    timelineVideoClips,
    getClipPath
  ])

  /**
   * Control functions
   */
  const play = useCallback(() => {
    setTimelinePlaying(true)
  }, [setTimelinePlaying])

  const pause = useCallback(() => {
    setTimelinePlaying(false)
  }, [setTimelinePlaying])

  const stop = useCallback(() => {
    setTimelineCurrentTime(0)
    setTimelinePlaying(false)
  }, [setTimelineCurrentTime, setTimelinePlaying])

  const seek = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, totalDuration))
      setTimelineCurrentTime(clampedTime)
    },
    [totalDuration, setTimelineCurrentTime]
  )

  return {
    // Refs for video and audio elements
    videoRef,
    audioRef,

    // Playback state
    isPlaying: timelineIsPlaying,
    currentTime: timelineCurrentTime,
    totalDuration,

    // Control functions
    play,
    pause,
    stop,
    seek,

    // Helper getters
    getActiveVideoClip: () => getActiveClip(timelineVideoClips, timelineCurrentTime),
    getActiveAudioClip: () => getActiveClip(timelineAudioClips, timelineCurrentTime)
  }
}
