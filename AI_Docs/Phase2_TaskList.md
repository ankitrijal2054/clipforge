# ClipForge Phase 2 - Detailed Task List

**Based on:** PRD_Phase2.md  
**Status:** Ready for Implementation

---

## Phase 2A: Comprehensive Recording System - PRIORITY

### Setup & Dependencies

1. [ ] **Install @dnd-kit/core** - Install drag-and-drop library with `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`. This modern library provides accessible drag-and-drop functionality for the timeline component with better performance than react-dnd and includes built-in collision detection and keyboard navigation.

2. [ ] **Create recording directory structure** - Set up new directories: `src/main/recording/` for main process recording logic, `src/renderer/src/components/RecordingPanel.tsx` for UI components. This organizes recording functionality separately from existing video processing and follows the established project structure.

3. [ ] **Add recording types** - Create `src/types/recording.ts` with interfaces for RecordingOptions, RecordingState, MediaDeviceInfo, and RecordingType. Create `src/types/timeline.ts` for TimelineClip, Track, and MultiClipExportParams. These provide TypeScript safety for new recording features and ensure consistent data structures.

4. [ ] **Update IPC handlers** - Create `src/main/ipc/recordingHandlers.ts` with handlers for `recording:getSources`, `recording:start`, `recording:stop`, `recording:pause`, `recording:resume`. These enable secure communication between renderer and main process for recording operations using Electron's context isolation.

### Screen Recording Implementation

5. [ ] **Implement desktopCapturer** - Use Electron's `desktopCapturer.getSources()` to get available screen and window sources with thumbnails. This provides the foundation for screen recording by listing all available capture targets including full screen, individual windows, and browser tabs.

6. [ ] **Create MediaRecorder wrapper** - Build a wrapper around MediaRecorder API to handle screen recording with audio capture. Include error handling, chunk management, and automatic file saving. This abstracts the complexity of MediaRecorder and provides a consistent interface for all recording types.

7. [ ] **Add source selection UI** - Create a modal dialog that displays available screen/window sources as thumbnails with names. Users can click to select their desired capture target. Include a preview of the selected source before starting recording.

8. [ ] **Implement audio device selection** - Add dropdown menus for microphone and system audio device selection. Query available audio devices using `navigator.mediaDevices.enumerateDevices()` and allow users to choose their preferred audio input sources.

9. [ ] **Add quality settings** - Implement three quality presets: High (1080p@60fps, 5Mbps), Medium (1080p@30fps, 2.5Mbps), Low (720p@30fps, 1Mbps). These settings affect both video resolution and bitrate to balance quality with file size and performance.

10. [ ] **Create recording indicator** - Display a prominent red recording dot with elapsed time counter. Include file size information and recording status. This provides clear visual feedback that recording is active and shows progress information.

11. [ ] **Implement pause/resume** - Add functionality to pause and resume recording without stopping the session. This allows users to take breaks during long recordings while maintaining a single output file.

### Webcam Recording Implementation

12. [ ] **Implement getUserMedia for webcam** - Use `navigator.mediaDevices.getUserMedia()` with video constraints to access webcam. Include device selection, resolution settings, and frame rate controls. Handle permission requests and device access errors gracefully.

13. [ ] **Create webcam preview** - Display a live preview window showing the webcam feed before and during recording. Include aspect ratio controls and positioning options. This helps users frame their shot and verify the recording setup.

14. [ ] **Add webcam device dropdown** - List all available video input devices using `navigator.mediaDevices.enumerateDevices()`. Allow users to switch between different cameras (built-in, external, virtual cameras) and show device capabilities.

15. [ ] **Implement webcam recording** - Use MediaRecorder with webcam stream to record video. Include audio capture from the same device or separate microphone. Handle different webcam resolutions and frame rates based on device capabilities.

16. [ ] **Add webcam quality settings** - Provide resolution options (1080p, 720p, 480p) and frame rate settings (30fps, 60fps) based on webcam capabilities. Include auto-focus and exposure controls if available through the device API.

### Picture-in-Picture Recording Implementation

17. [ ] **Create Canvas-based PiP system** - Build a Canvas element that overlays webcam feed on screen capture. Use `drawImage()` to composite the two video streams with proper positioning and scaling. This creates a professional picture-in-picture effect.

18. [ ] **Implement dual stream capture** - Capture both screen and webcam streams simultaneously using separate `getUserMedia()` calls. Synchronize the streams to ensure proper timing and handle different frame rates between sources.

19. [ ] **Add PiP positioning** - Position webcam overlay in bottom-right corner with configurable size (320x180 default). Include rounded corners, border styling, and optional shadow effects. Allow users to drag and resize the overlay.

20. [ ] **Create PiP size controls** - Provide slider controls for overlay size and position. Include preset sizes (small, medium, large) and custom sizing options. Maintain aspect ratio and ensure overlay stays within screen bounds.

21. [ ] **Implement PiP recording** - Use Canvas `captureStream()` to create a single video stream combining screen and webcam. Apply the same MediaRecorder wrapper used for other recording types. Handle the composite stream efficiently to maintain performance.

### Recording UI Components

22. [ ] **Create RecordingPanel.tsx** - Build the main recording interface component with mode selection (Screen/Webcam/PiP), device selection, quality settings, and recording controls. Use ShadCN/UI components for consistent styling.

23. [ ] **Add recording mode selection** - Implement radio buttons or tabs for selecting recording type. Each mode shows relevant options (screen sources for screen recording, webcam preview for webcam, both for PiP). Disable irrelevant options based on selection.

24. [ ] **Implement source selection modal** - Create a modal dialog that displays available screen/window sources as clickable thumbnails. Include source names, types, and preview images. Allow users to test the source before confirming selection.

25. [ ] **Create device selection dropdowns** - Build dropdown components for audio and video device selection. Include device names, types, and capabilities. Show currently selected devices and allow switching during recording setup.

26. [ ] **Add quality settings panel** - Create a settings panel with quality presets, custom resolution options, and bitrate controls. Include preview of estimated file sizes and performance impact. Save user preferences for future recordings.

27. [ ] **Implement recording controls** - Add Start, Pause, Resume, and Stop buttons with proper state management. Include keyboard shortcuts (Space for pause/resume, Escape for stop). Show recording status and provide clear visual feedback.

28. [ ] **Create recording status display** - Display elapsed time, file size, recording quality, and current status. Include a progress bar for long recordings and warnings for low disk space or performance issues.

### File Management & Integration

29. [ ] **Implement temp file management** - Save recordings to OS temp directory (`${tempDir}/clipforge/recordings/`) with timestamped filenames. Handle file naming conflicts and ensure proper file permissions. Include automatic cleanup of old temp files.

30. [ ] **Create auto-import system** - Automatically add completed recordings to the media library with proper metadata (duration, resolution, file size, recording type). Generate thumbnails and extract video information using existing FFmpeg integration.

31. [ ] **Add timeline integration** - Automatically place new recordings on the timeline at the current playhead position or at the end. This creates a seamless workflow from recording to editing without manual import steps.

32. [ ] **Implement file cleanup** - Remove temp files on app close or after successful import to permanent location. Include manual cleanup option in settings. Track file usage to prevent accidental deletion of active recordings.

33. [ ] **Add recording metadata** - Store recording information including start time, duration, resolution, frame rate, bitrate, audio settings, and recording type. This metadata helps with organization and provides context for editing decisions.

### Testing & Validation

34. [ ] **Test screen recording** - Verify recording works with all available screen sources (full screen, individual windows, browser tabs). Test different screen resolutions and multi-monitor setups. Ensure proper audio capture from system audio.

35. [ ] **Test webcam recording** - Test with all available cameras including built-in, external USB cameras, and virtual cameras. Verify different resolutions and frame rates work correctly. Test audio capture from webcam microphone.

36. [ ] **Test PiP recording** - Verify Picture-in-Picture recording works with various screen and webcam combinations. Test different overlay sizes and positions. Ensure proper synchronization between screen and webcam streams.

37. [ ] **Test audio capture** - Verify microphone and system audio capture works correctly. Test different audio devices and sample rates. Ensure proper audio synchronization with video.

38. [ ] **Test pause/resume** - Verify pause and resume functionality works correctly without corrupting the output file. Test multiple pause/resume cycles during a single recording session.

39. [ ] **Cross-platform testing** - Test all recording features on macOS, Windows, and Linux. Verify device enumeration works correctly on each platform. Test platform-specific audio capture (system audio on macOS, etc.).

40. [ ] **Test file management** - Verify temp file creation, auto-import, and cleanup work correctly. Test file naming with special characters and long filenames. Verify proper handling of disk space issues.

---

## Phase 2B: Simple 2-Track Timeline

### Store Extension

41. [ ] **Extend EditorStore interface** - Add properties: `timelineVideoClips: TimelineClip[]`, `timelineAudioClips: TimelineClip[]`, `selectedClipId: string | null`, `isMuted: { video: boolean; audio: boolean }`.

42. [ ] **Add timeline management actions** - Implement: `addClipToTrack(track, clip, position?)`, `removeClipFromTrack(track, clipId)`, `updateClipTrim(clipId, startTime, endTime)`, `splitClip(clipId, splitTime)`, `moveClip(clipId, newPosition)`.

43. [ ] **Add track management actions** - Implement: `toggleTrackMute(trackType: 'video' | 'audio')`, `selectClip(clipId)`.

44. [ ] **Create selector hooks** - `useTimelineClips()`, `useTimelineActions()`, `useSelectedClip()`, `useTrackMute()` for optimized re-rendering.

### Timeline Component Structure

45. [ ] **Create Timeline.tsx** - Main 2-track container with vertical layout (video track top, audio track bottom). Include time markers every 5 seconds, global playhead indicator, and horizontal scrolling.

46. [ ] **Implement track headers** - Add "Video Track" and "Audio Track" labels with mute buttons. Show mute status visually (icon highlight when muted).

47. [ ] **Create TimelineClip.tsx** - Individual clip component: colored box with clip name and duration text. Include drag handle for reordering, draggable trim handles on left/right edges, selection highlight, and hover feedback.

48. [ ] **Add time markers** - Render time labels (0s, 5s, 10s, etc.) along timeline based on total duration. Update dynamically as clips are added/removed.

49. [ ] **Implement playhead** - Vertical line that moves across timeline during playback. Clickable to seek. Include time display (MM:SS format) above playhead.

### Drag & Drop Implementation

50. [ ] **Set up @dnd-kit** - Initialize DndContext with pointer sensor and basic collision detection. Configure drop zones for video and audio tracks.

51. [ ] **Implement drag from library to timeline** - Create drop zones on each track. When clip is dropped, auto-place at end of track. Store position based on cumulative clip durations.

52. [ ] **Implement clip reordering** - Allow dragging clips left/right within same track to reorder. Prevent moving between tracks. Update clip positions in store.

53. [ ] **Add trim handle dragging** - Left and right edges of clips are draggable. Update clip trim values in store. Recalculate subsequent clip positions if necessary.

54. [ ] **Add visual feedback** - Highlight drop zone when dragging over it. Show ghost preview of clip. Highlight selected clip with border/opacity change.

### Clip Operations

55. [ ] **Implement trim in store** - Each TimelineClip has `trimStart` (in seconds) and `trimEnd` (in seconds). Trim duration = trimEnd - trimStart. Effective duration used for positioning.

56. [ ] **Implement split functionality** - S key splits selected clip at playhead position. Create two clips from original with proper trim boundaries. Insert second clip immediately after first.

57. [ ] **Implement delete functionality** - Delete key removes selected clip. Update subsequent clip positions.

58. [ ] **Implement clip selection** - Click on clip to select. Show selection indicator (border/background). Single-select for now (multi-select can be Phase 2E).

59. [ ] **Add keyboard shortcuts** - S (split), Delete (remove). Defer other shortcuts to Phase 2E.

### Testing & Validation (Phase 2B)

60. [ ] **Test drag & drop from library** - Verify clips auto-place at end of track for both video and audio.

61. [ ] **Test clip reordering** - Verify dragging clips within track updates positions correctly.

62. [ ] **Test trim handles** - Verify dragging edges updates trim values and timeline preview shows correct duration.

63. [ ] **Test split** - Verify S key splits at playhead, handles already-trimmed clips correctly.

64. [ ] **Test delete** - Verify Delete key removes selected clip and updates timeline.

65. [ ] **Test mute buttons** - Verify each track can be independently muted.

---

## Phase 2C: Multi-Clip Playback

### Playback Logic

66. [ ] **Create useTimelinePlayback hook** - Manage playback state: `isPlaying`, `currentTime`, `currentClipIndex`, `playbackRate`. Handle play/pause/stop/seek.

67. [ ] **Implement sequential playback** - Calculate which clip is active based on currentTime. Track cumulative time across clips. Switch to next clip when current clip ends.

68. [ ] **Implement playhead sync** - Playhead position = currentTime in seconds. Update playhead position every frame during playback (~16ms). Display time above playhead.

69. [ ] **Add seek functionality** - Click on timeline or drag playhead to seek. Calculate target time and switch to correct clip. Pause audio/video and set their currentTime.

70. [ ] **Implement play/pause/stop** - Play button: set isPlaying=true, start from currentTime. Pause: set isPlaying=false, freeze playhead. Stop: reset currentTime=0, isPlaying=false.

### Video Playback

71. [ ] **Implement single video element** - Use one HTML5 `<video>` element that displays current clip. Switch `src` when moving to next clip.

72. [ ] **Create clip sequencing logic** - Array of clips with cumulative start times: clip1 (0-5s), clip2 (5-12s), etc. Calculate which clip is active based on currentTime.

73. [ ] **Implement clip switching** - When playback reaches end of current clip, pause current video, load next clip, set video.currentTime to 0, resume play.

74. [ ] **Add audio overlay** - If audio track has clips, create separate audio element or reuse video audio + secondary audio. Respect mute state on both tracks during playback.

75. [ ] **Implement trim playback** - When playing a trimmed clip, start from trimStart and stop at trimEnd. Calculate playback position = trimStart + (currentTime - clipStartTime).

### Audio Handling

76. [ ] **Create audio track playback** - Use separate `<audio>` element for audio track clips. Sequence similarly to video. Keep in sync with video playback.

77. [ ] **Implement mute logic** - If video track is muted, silence video audio. If audio track is muted, silence audio element. Export respects these mute settings.

78. [ ] **Handle audio synchronization** - Keep video and audio playback in sync. If they drift (rare), resync audio.currentTime to match video.currentTime.

### Preview Integration

79. [ ] **Update PreviewPlayer** - Replace single-clip playback with multi-clip playback hook. Display current clip in video element. Update all controls to work with new playback logic.

80. [ ] **Implement play controls** - Play, Pause, Stop buttons. Display current time and total timeline duration. Seek bar for dragging playhead.

### Testing & Validation (Phase 2C)

81. [ ] **Test basic playback** - Play clips sequentially from start to finish. Verify smooth transitions between clips.

82. [ ] **Test seeking** - Click on timeline to seek. Verify correct clip loads and plays from correct position.

83. [ ] **Test trim playback** - Verify trimmed clips play only the trimmed section.

84. [ ] **Test split clips** - Verify split clips play correctly with proper boundaries.

85. [ ] **Test mute logic** - Mute video, verify video audio is gone but audio track plays. Mute audio track, verify audio stops.

86. [ ] **Test audio sync** - Verify audio and video stay in sync throughout playback.

87. [ ] **Test playback across all clips** - Verify playback continues smoothly from first to last clip without interruption.

88. [ ] **Test edge cases** - Empty timeline, single clip, very short clips (< 1 second), multiple audio clips with different durations.

---

## Phase 2D: Export Pipeline (Simplified)

89. [ ] **Update export logic** - Modify FFmpeg export to handle multiple timeline clips. Extract trimmed segments from each clip in order and concatenate.

90. [ ] **Implement clip sequencing in export** - For each timeline clip (in order), extract segment from trimStart to trimEnd using FFmpeg.

91. [ ] **Generate concat file** - Create FFmpeg concat demuxer file listing all extracted segments in order.

92. [ ] **Handle audio tracks in export** - If audio track is muted, don't include audio in export. If video audio is muted but audio track exists, use audio track audio instead.

93. [ ] **Test multi-clip export** - Verify export combines all timeline clips in correct order with trims applied.

94. [ ] **Test mute export** - Verify mute settings are respected during export.

---

## Simplified Success Criteria

### Timeline System

- [x] 2-track timeline displays correctly
- [x] Drag and drop from library works smoothly
- [x] Clip trimming works on timeline
- [x] Split functionality works (S key)
- [x] Delete functionality works (Delete key)
- [x] Track mute/unmute works
- [x] Clips display with different colors and duration text

### Playback System

- [x] Multi-clip playback works sequentially
- [x] Playhead scrubbing works across clips
- [x] Trim points are respected during playback
- [x] Audio and video stay synchronized
- [x] Mute settings respected during playback
- [x] Playback stops at end of video track (not audio)

### Export System

- [x] Multi-clip export works in correct order
- [x] Trimmed regions are respected in export
- [x] Mute settings respected in export

---

## Architecture Overview

```
Timeline Data Structure:
├── timelineVideoClips: [
│   { id, libraryId, trimStart, trimEnd, position, duration }
│ ]
├── timelineAudioClips: [
│   { id, libraryId, trimStart, trimEnd, position, duration }
│ ]
├── selectedClipId: string | null
└── isMuted: { video: boolean, audio: boolean }

Playback Logic:
1. currentTime: 0 → 120 (total timeline duration)
2. Find active clip: loop through clips, find where currentTime falls
3. Clip playback time = currentTime - clipStartTime + clipTrimStart
4. Load video/audio with calculated time
5. When clip ends, switch to next clip

Position Calculation:
clip1.position = 0
clip2.position = clip1.trimEnd - clip1.trimStart
clip3.position = clip2.position + (clip2.trimEnd - clip2.trimStart)
```

---

## Implementation Priority

**Phase 2B (Timeline):** ~12 tasks

1. Store extension (tasks 41-44)
2. Timeline UI components (tasks 45-49)
3. Drag & drop (tasks 50-54)
4. Clip operations (tasks 55-59)
5. Testing (tasks 60-65)

**Phase 2C (Playback):** ~15 tasks

1. Playback logic (tasks 66-70)
2. Video playback (tasks 71-75)
3. Audio handling (tasks 76-78)
4. Preview integration (tasks 79-80)
5. Testing (tasks 81-88)

**Phase 2D (Export):** ~6 tasks

1. Export updates (tasks 89-94)

**Total for simplified Phase 2B+2C+2D: ~48 tasks** (vs. 92 in original)

---

## Files to Create/Modify

### New Files

- `src/types/timeline.ts` - TimelineClip, Track types
- `src/renderer/src/components/Timeline.tsx` - Main timeline
- `src/renderer/src/components/TimelineClip.tsx` - Individual clip
- `src/renderer/src/components/TrackHeader.tsx` - Track with mute button
- `src/renderer/src/hooks/useTimelinePlayback.ts` - Playback logic
- `src/main/ffmpeg/concat.ts` - Multi-clip export

### Modified Files

- `src/stores/editorStore.ts` - Extend with timeline state
- `src/renderer/src/components/PreviewPlayer.tsx` - Use new playback hook
- `src/renderer/src/components/Layout.tsx` - Integrate Timeline
- `src/main/ipc/index.ts` - Add export handlers

---

## Implementation Guide

### 1. Type Definitions (`src/types/timeline.ts`)

```typescript
export interface TimelineClip {
  id: string // Unique ID for timeline clip
  libraryId: string // Reference to media library clip
  name: string // Display name
  trackType: 'video' | 'audio' // Which track this belongs to
  duration: number // Full duration in seconds (for display)
  trimStart: number // Trim start in seconds
  trimEnd: number // Trim end in seconds
  effectiveDuration: number // trimEnd - trimStart
  position: number // Position in track (cumulative seconds)
  color?: string // Color for timeline display (random per video)
}

export interface TimelineState {
  timelineVideoClips: TimelineClip[]
  timelineAudioClips: TimelineClip[]
  selectedClipId: string | null
  isMuted: {
    video: boolean
    audio: boolean
  }
}
```

### 2. Store Updates (`src/stores/editorStore.ts`)

Add to EditorStore interface:

```typescript
// Timeline state
timelineVideoClips: TimelineClip[];
timelineAudioClips: TimelineClip[];
selectedClipId: string | null;
isMuted: { video: boolean; audio: boolean };

// Timeline actions
addClipToTrack: (trackType: 'video' | 'audio', libraryClip: LibraryClip) => void;
removeClipFromTrack: (trackType: 'video' | 'audio', clipId: string) => void;
moveClip: (trackType: 'video' | 'audio', clipId: string, newPosition: number) => void;
updateClipTrim: (clipId: string, trimStart: number, trimEnd: number) => void;
splitClip: (clipId: string, splitTime: number) => void;
selectClip: (clipId: string | null) => void;
toggleTrackMute: (trackType: 'video' | 'audio') => void;
```

Implementation pattern:

```typescript
addClipToTrack: (trackType, libraryClip) => {
  // 1. Calculate position = sum of all effective durations in track
  // 2. Create TimelineClip with trimStart=0, trimEnd=libraryClip.duration
  // 3. Add to timelineVideoClips or timelineAudioClips
  // 4. Generate random color for new clip
}

updateClipTrim: (clipId, trimStart, trimEnd) => {
  // 1. Find clip in appropriate track
  // 2. Update trimStart, trimEnd
  // 3. Recalculate effectiveDuration
  // 4. Recalculate positions of all subsequent clips
}

splitClip: (clipId, splitTime) => {
  // 1. Find clip by ID
  // 2. Calculate split point relative to clip trim: splitTime - clip.position + clip.trimStart
  // 3. Create clip1: trimStart to splitTime
  // 4. Create clip2: splitTime to original trimEnd
  // 5. Insert both at original position
  // 6. Recalculate positions
}
```

### 3. Timeline Component (`src/renderer/src/components/Timeline.tsx`)

Structure:

```typescript
export const Timeline: React.FC = () => {
  const { timelineVideoClips, timelineAudioClips } = useEditorStore();

  // Calculate total timeline duration
  const totalDuration = Math.max(
    getTrackDuration(timelineVideoClips),
    getTrackDuration(timelineAudioClips)
  );

  // Time markers every 5 seconds
  const timeMarkers = generateTimeMarkers(totalDuration, 5);

  return (
    <div className="timeline-container">
      {/* Time Header */}
      <TimelineHeader timeMarkers={timeMarkers} />

      {/* Video Track */}
      <TrackHeader trackType="video" />
      <div className="track video-track">
        <DropZone trackType="video" />
        {timelineVideoClips.map(clip => (
          <TimelineClip key={clip.id} clip={clip} trackType="video" />
        ))}
      </div>

      {/* Audio Track */}
      <TrackHeader trackType="audio" />
      <div className="track audio-track">
        <DropZone trackType="audio" />
        {timelineAudioClips.map(clip => (
          <TimelineClip key={clip.id} clip={clip} trackType="audio" />
        ))}
      </div>

      {/* Playhead */}
      <Playhead currentTime={playbackState.currentTime} totalDuration={totalDuration} />
    </div>
  );
};
```

### 4. TimelineClip Component (`src/renderer/src/components/TimelineClip.tsx`)

```typescript
interface TimelineClipProps {
  clip: TimelineClip;
  trackType: 'video' | 'audio';
}

export const TimelineClip: React.FC<TimelineClipProps> = ({ clip, trackType }) => {
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [isDraggingTrim, setIsDraggingTrim] = useState<'start' | 'end' | null>(null);
  const { selectedClipId, selectClip, updateClipTrim, moveClip } = useEditorStore();

  // Position based on cumulative duration
  const positionPixels = clip.position * pixelsPerSecond;
  const widthPixels = clip.effectiveDuration * pixelsPerSecond;

  return (
    <div
      className={`timeline-clip ${selectedClipId === clip.id ? 'selected' : ''}`}
      style={{
        backgroundColor: clip.color,
        left: `${positionPixels}px`,
        width: `${widthPixels}px`,
      }}
      onClick={() => selectClip(clip.id)}
      draggable
      onDragStart={(e) => setIsDraggingClip(true)}
    >
      <div className="clip-info">
        <span className="clip-name">{clip.name}</span>
        <span className="clip-duration">{formatDuration(clip.effectiveDuration)}</span>
      </div>

      {/* Trim handles */}
      <div
        className="trim-handle start"
        onMouseDown={() => setIsDraggingTrim('start')}
      />
      <div
        className="trim-handle end"
        onMouseDown={() => setIsDraggingTrim('end')}
      />
    </div>
  );
};
```

### 5. Playback Hook (`src/renderer/src/hooks/useTimelinePlayback.ts`)

```typescript
export const useTimelinePlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { timelineVideoClips, timelineAudioClips, isMuted } = useEditorStore()

  // Calculate total timeline duration (max of both tracks)
  const totalDuration = Math.max(
    getTrackDuration(timelineVideoClips),
    getTrackDuration(timelineAudioClips)
  )

  // Find active clip based on currentTime
  const getActiveClip = (clips: TimelineClip[], time: number) => {
    return clips.find(
      (clip) => time >= clip.position && time < clip.position + clip.effectiveDuration
    )
  }

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalDuration) {
          setIsPlaying(false)
          return 0
        }
        return prev + 0.016 // 60fps
      })
    }, 16)

    return () => clearInterval(interval)
  }, [isPlaying, totalDuration])

  // Sync video and audio
  useEffect(() => {
    const activeVideoClip = getActiveClip(timelineVideoClips, currentTime)

    if (activeVideoClip && videoRef.current) {
      // Calculate playback position within clip
      const clipPlaybackTime = currentTime - activeVideoClip.position + activeVideoClip.trimStart
      videoRef.current.src = getClipPath(activeVideoClip.libraryId)
      videoRef.current.currentTime = clipPlaybackTime

      if (isPlaying && !isMuted.video) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }

    // Similar logic for audio
  }, [currentTime, timelineVideoClips, timelineAudioClips, isPlaying, isMuted])

  return {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    totalDuration,
    videoRef,
    audioRef,
    play: () => {
      setCurrentTime(0)
      setIsPlaying(true)
    },
    pause: () => setIsPlaying(false),
    stop: () => {
      setCurrentTime(0)
      setIsPlaying(false)
    }
  }
}
```

### 6. Drag & Drop with @dnd-kit

Setup in Timeline.tsx:

```typescript
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(useSensor(PointerSensor));

<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  <Droppable data={{ trackType: 'video' }}>
    {/* Video track content */}
  </Droppable>
  <Droppable data={{ trackType: 'audio' }}>
    {/* Audio track content */}
  </Droppable>
</DndContext>
```

Handle drop:

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over?.data?.trackType) {
    // Clip dragged from library - add to track
    const libraryClip = mediaLibrary.find(c => c.id === active.id);
    addClipToTrack(over.data.trackType, libraryClip);
  } else if (over?.data?.clipId) {
    // Clip dragged within track - reorder
    const newPosition = calculateNewPosition(...);
    moveClip(active.data.trackType, active.id, newPosition);
  }
};
```

### 7. Export with Multiple Clips (`src/main/ffmpeg/concat.ts`)

```typescript
export async function exportTimelineClips(
  timeline: { videoClips: TimelineClip[]; audioClips: TimelineClip[] },
  outputPath: string,
  settings: ExportSettings
) {
  const tempDir = path.join(os.tmpdir(), 'clipforge-export')

  // Step 1: Extract trimmed segments
  const videoSegments = await Promise.all(
    timeline.videoClips.map((clip, i) => extractSegment(clip, path.join(tempDir, `video_${i}.mp4`)))
  )

  // Step 2: Create concat file
  const concatContent = videoSegments.map((f) => `file '${f}'`).join('\n')
  fs.writeFileSync(path.join(tempDir, 'concat.txt'), concatContent)

  // Step 3: Run FFmpeg concat
  const command = `ffmpeg -f concat -safe 0 -i concat.txt -c copy ${outputPath}`

  // Step 4: Handle audio
  // If video audio muted + audio track exists, mix in audio track

  // Cleanup temp files
}
```

### 8. Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 's' || e.key === 'S') {
      // Split selected clip at playhead
      if (selectedClipId) {
        splitClip(selectedClipId, currentTime)
      }
    }
    if (e.key === 'Delete') {
      // Delete selected clip
      if (selectedClipId) {
        removeClipFromTrack(trackType, selectedClipId)
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [selectedClipId, currentTime])
```

---

## Development Workflow

1. **Start with types** → Define `TimelineClip`, state structure
2. **Extend store** → Add state and actions to Zustand
3. **Build Timeline UI** → Render clips with basic styling
4. **Implement drag & drop** → Connect MediaLibrary to Timeline
5. **Add trim handles** → Draggable edges with state updates
6. **Implement playback** → useTimelinePlayback hook
7. **Connect PreviewPlayer** → Show video/audio from timeline
8. **Add keyboard shortcuts** → S (split), Delete (remove)
9. **Implement export** → FFmpeg concat pipeline
10. **Test extensively** → All platforms, edge cases

---

## Key Simplifications vs Original Plan

| Feature       | Original             | Simplified           | Reason                             |
| ------------- | -------------------- | -------------------- | ---------------------------------- |
| Snap-to-grid  | Full implementation  | Removed              | Not essential for personal project |
| Web Audio API | Full mixing          | Simple audio element | HTML5 sufficient                   |
| Preloading    | Intelligent prefetch | None                 | Desktop app, local files           |
| Zoom          | Multiple levels      | None (fixed scale)   | Fixed timeline width fine          |
| Context menus | Full implementation  | Deferred to Phase 2E | Keyboard shortcuts sufficient      |
| Multi-select  | Full support         | Single select only   | Can add later                      |
| Undo/redo     | Planned              | Deferred             | Phase 2E or later                  |
| Thumbnails    | First-frame display  | Color blocks only    | Phase 2E feature                   |

Total reduction: **92 tasks → 48 tasks** (48% reduction while keeping core functionality)
