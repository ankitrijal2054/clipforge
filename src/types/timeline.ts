/**
 * Timeline System Types
 * Defines data structures for multi-clip timeline editing
 */

/**
 * Represents a single clip on the timeline
 * Each clip references a media library item and stores positioning/trim information
 */
export interface TimelineClip {
  /** Unique identifier for this timeline clip */
  id: string

  /** Reference to the source clip in the media library */
  libraryId: string

  /** Display name (from original file) */
  name: string

  /** Which track this clip belongs to */
  trackType: 'video' | 'audio'

  /** Full duration of source clip in seconds */
  duration: number

  /** Trim start point in seconds (inclusive) */
  trimStart: number

  /** Trim end point in seconds (exclusive) */
  trimEnd: number

  /** Effective duration = trimEnd - trimStart (what's actually played) */
  effectiveDuration: number

  /** Position in track in cumulative seconds from start */
  position: number

  /** Color for UI display (random per video clip) */
  color?: string
}

/**
 * Timeline state interface
 * Defines the complete state of the timeline editor
 */
export interface TimelineState {
  /** Array of video clips on the timeline */
  timelineVideoClips: TimelineClip[]

  /** Array of audio clips on the timeline */
  timelineAudioClips: TimelineClip[]

  /** Currently selected clip ID (null if none selected) */
  selectedClipId: string | null

  /** Mute state for each track */
  isMuted: {
    video: boolean // If true, video audio is muted during playback
    audio: boolean // If true, audio track is muted during playback
  }
}

/**
 * Parameters for moving a clip to a new position
 */
export interface MoveClipParams {
  trackType: 'video' | 'audio'
  clipId: string
  newPosition: number
}

/**
 * Parameters for updating trim points
 */
export interface UpdateTrimParams {
  clipId: string
  trimStart: number
  trimEnd: number
}

/**
 * Parameters for splitting a clip
 */
export interface SplitClipParams {
  clipId: string
  splitTime: number // Time in seconds to split at (global timeline time)
}
