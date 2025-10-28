# ClipForge - Phase 2 Product Requirements Document

**Version:** 2.0  
**Status:** Development Ready  
**Platform:** Cross-platform desktop application (macOS, Windows, Linux)  
**Framework:** Electron + React + Vite + TypeScript

---

## 1. Executive Summary

Phase 2 evolves **ClipForge** from a single-clip trimmer into a **professional multi-clip desktop video editor** with comprehensive native recording capabilities. Building on the solid MVP foundation, Phase 2 introduces:

- **Native Recording**: Screen, webcam, and Picture-in-Picture recording with immediate timeline integration
- **Multi-Clip Timeline**: Simple 2-track timeline with drag-and-drop arrangement
- **Professional Playback**: Seamless preview across multiple clips
- **Advanced Export**: Concatenate multiple clips while preserving original resolution

**Core Philosophy**: Maintain ClipForge's simplicity while delivering professional multi-clip editing capabilities with comprehensive recording features as the top priority.

---

## 2. Product Objectives

### Primary Goals (Priority Order)

1. **Comprehensive Recording System**: Native screen + webcam + Picture-in-Picture recording with immediate timeline integration
2. **Simple Multi-Clip Timeline**: 2-track timeline (1 video + 1 audio) with drag-and-drop arrangement
3. **Professional Playback**: Seamless preview across multiple clips on timeline
4. **Multi-Clip Export**: FFmpeg-based concatenation preserving original resolution
5. **Performance**: Maintain sub-5s launch, smooth 30fps+ timeline interactions with 10 clips
6. **Consistency**: Preserve cross-platform, offline-first, modern UI principles

### Secondary Goals

1. **Split Functionality**: Frame-accurate clip splitting on timeline
2. **Thumbnail Preview**: First-frame snapshots for quick clip identification
3. **Snap-to-Grid**: Magnetic alignment for precise editing
4. **Keyboard Shortcuts**: Professional editing hotkeys
5. **Undo/Redo System**: Non-destructive editing workflow (stretch goal)

---

## 3. Technical Architecture Changes

### 3.1 New Components & Modules

```
src/
├── main/
│   ├── recording/
│   │   ├── screenRecorder.ts       # Screen capture via desktopCapturer
│   │   ├── mediaRecorder.ts        # MediaRecorder wrapper
│   │   └── recordingManager.ts     # Recording state & file management
│   ├── ffmpeg/
│   │   ├── concat.ts               # Multi-clip concatenation
│   │   ├── thumbnail.ts            # First-frame extraction
│   │   └── resolution.ts           # Resolution normalization
│   └── ipc/
│       └── recordingHandlers.ts    # Recording IPC handlers
│
├── renderer/src/
│   ├── components/
│   │   ├── RecordingPanel.tsx      # Recording controls & preview
│   │   ├── MultiClipTimeline.tsx   # Multi-track timeline editor
│   │   ├── TimelineClip.tsx        # Individual clip on timeline
│   │   ├── SplitButton.tsx         # Split clip at playhead
│   │   └── TrackControls.tsx       # Track mute/solo/lock
│   ├── hooks/
│   │   ├── useRecording.ts         # Recording state management
│   │   ├── useMultiClipPlayback.ts # Multi-clip preview logic
│   │   └── useDragAndDrop.ts       # Timeline drag-and-drop
│   └── stores/
│       ├── recordingStore.ts       # Recording state (new)
│       ├── timelineStore.ts        # Timeline clips & tracks (new)
│       └── editorStore.ts          # Updated for multi-clip support
│
└── types/
    ├── recording.ts                # Recording types
    ├── timeline.ts                 # Timeline & track types
    └── multiClip.ts                # Multi-clip export types
```

### 3.2 State Management Strategy

**Recommendation**: Extend current single store for Phase 2, split later if needed

```typescript
// Extended EditorStore for Phase 2
interface EditorStore {
  // Existing MVP state...
  clips: VideoClip[] // Media library clips
  selectedClip: VideoClip | null
  playhead: number
  duration: number
  zoomLevel: number
  timelineScrollOffset: number
  isPlaying: boolean
  trimStart: number
  trimEnd: number
  isExporting: boolean
  exportProgress: number
  exportSettings: ExportSettings
  activeModal: string | null

  // New Phase 2 state
  timelineClips: TimelineClip[] // Clips placed on timeline
  tracks: Track[] // Timeline tracks (2 tracks: 1 video + 1 audio)
  selectedTimelineClips: string[] // Selected timeline clips
  isRecording: boolean
  recordingType: 'screen' | 'webcam' | 'pip' | null
  recordingDuration: number
  recordingPath: string | null
  audioInputs: MediaDeviceInfo[]
  selectedAudioInput: string | null
  snapToGrid: boolean

  // Timeline management actions
  addClipToTimeline: (clip: VideoClip, trackId: string, position: number) => void
  removeClipFromTimeline: (clipId: string) => void
  moveClip: (clipId: string, newPosition: number, newTrackId?: string) => void
  splitClip: (clipId: string, splitTime: number) => void
  updateClipTrim: (clipId: string, trimStart: number, trimEnd: number) => void
  selectTimelineClips: (clipIds: string[]) => void

  // Track management actions
  toggleTrackMute: (trackId: string) => void
  toggleTrackLock: (trackId: string) => void

  // Recording actions
  startRecording: (type: RecordingType, options: RecordingOptions) => Promise<void>
  stopRecording: () => Promise<string> // Returns file path
  pauseRecording: () => void
  resumeRecording: () => void
  setRecordingType: (type: 'screen' | 'webcam' | 'pip' | null) => void
  setSelectedAudioInput: (deviceId: string | null) => void

  // Multi-clip playback
  isPlayingTimeline: boolean
  timelinePlaybackSpeed: number
}
```

### 3.3 Type Definitions

```typescript
// Timeline Clip (placed on timeline)
interface TimelineClip {
  id: string
  sourceClipId: string // References VideoClip in media library
  trackId: string
  position: number // Start position on timeline (seconds)
  duration: number // Duration on timeline (after trim)
  trimStart: number // Trim in point (source video time)
  trimEnd: number // Trim out point (source video time)
  layer: number // Z-index for overlapping clips
  locked: boolean
  thumbnail?: string // First-frame thumbnail path
}

// Track (simplified for 2-track timeline)
interface Track {
  id: string
  type: 'video' | 'audio'
  name: string
  muted: boolean
  locked: boolean
  height: number // Track height in pixels
  order: number // Display order (0 = video, 1 = audio)
}

// Recording Options
interface RecordingOptions {
  type: 'screen' | 'webcam' | 'pip'
  audioSource?: string // Audio device ID
  videoSource?: string // Screen/window source ID
  quality: 'high' | 'medium' | 'low'
  frameRate: 30 | 60
}

// Multi-Clip Export Parameters (simplified - no resolution normalization)
interface MultiClipExportParams {
  timelineClips: TimelineClip[]
  outputPath: string
  format: string
  quality: string
  // Note: Resolution normalization removed for Phase 2
}
```

---

## 4. Feature Specifications

### 4.1 Recording System (Priority Feature)

#### 4.1.1 Screen Recording

**Implementation**: Renderer process using `desktopCapturer` + `MediaRecorder`

```typescript
// Main process: Get available sources
ipcMain.handle('recording:getSources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 150, height: 150 }
  })
  return sources
})

// Renderer process: Start recording
const startScreenRecording = async (sourceId: string, audioDeviceId?: string) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: audioDeviceId ? { deviceId: audioDeviceId } : false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId
      }
    }
  })

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 2500000
  })

  const chunks = []
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    const tempPath = await saveTempRecording(blob)
    const clip = await importVideoWithThumbnail(tempPath)
    addClipToTimeline(clip, 'video-track-1', 0) // Auto-add to timeline
  }

  mediaRecorder.start()
}
```

**UI Components**:

- Source selection modal (similar to Zoom/Loom window picker)
- Recording indicator (red dot + timer)
- Audio device dropdown
- Quality settings (High: 1080p@60fps, Medium: 1080p@30fps, Low: 720p@30fps)

**File Management**:

- Save to OS temp directory: `${tempDir}/clipforge/recordings/recording_${timestamp}.webm`
- Auto-import to media library AND timeline after recording stops
- Option to "Keep" (move to permanent location) or "Discard" (delete temp file)

#### 4.1.2 Webcam Recording

**Implementation**: Standard `getUserMedia` with webcam constraints

```typescript
const startWebcamRecording = async (webcamId: string, audioDeviceId?: string) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: webcamId,
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: audioDeviceId ? { deviceId: audioDeviceId } : true
  })

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 2500000
  })

  const chunks = []
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    const tempPath = await saveTempRecording(blob)
    const clip = await importVideoWithThumbnail(tempPath)
    addClipToTimeline(clip, 'video-track-1', 0) // Auto-add to timeline
  }

  mediaRecorder.start()
}
```

**UI Components**:

- Webcam device dropdown
- Live preview window
- Recording controls (Start, Pause, Stop)

#### 4.1.3 Picture-in-Picture (PiP) Mode

**Implementation**: Canvas-based overlay (simplified version)

```typescript
const createPiPRecording = (screenStream: MediaStream, webcamStream: MediaStream) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1920
  canvas.height = 1080
  const ctx = canvas.getContext('2d')

  const screenVideo = document.createElement('video')
  screenVideo.srcObject = screenStream

  const webcamVideo = document.createElement('video')
  webcamVideo.srcObject = webcamStream

  const drawFrame = () => {
    // Draw screen (background)
    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)

    // Draw webcam overlay (PiP in bottom-right)
    const pipWidth = 320
    const pipHeight = 180
    const pipX = canvas.width - pipWidth - 20
    const pipY = canvas.height - pipHeight - 20

    // Draw webcam with rounded corners
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(pipX, pipY, pipWidth, pipHeight, 10)
    ctx.clip()
    ctx.drawImage(webcamVideo, pipX, pipY, pipWidth, pipHeight)
    ctx.restore()

    requestAnimationFrame(drawFrame)
  }

  const canvasStream = canvas.captureStream(30)
  const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm;codecs=vp9' })

  const chunks = []
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    const tempPath = await saveTempRecording(blob)
    const clip = await importVideoWithThumbnail(tempPath)
    addClipToTimeline(clip, 'video-track-1', 0) // Auto-add to timeline
  }

  return mediaRecorder
}
```

**Acceptance Criteria**:

- ✅ User can select screen/window source with visual preview
- ✅ User can select webcam source with live preview
- ✅ User can select audio input (system audio + mic)
- ✅ Recording saved immediately as temp file
- ✅ Recording auto-imported to media library AND timeline
- ✅ Recording indicator visible during capture
- ✅ Support pause/resume functionality
- ✅ PiP mode overlays webcam on screen recording

---

### 4.2 Multi-Clip Timeline (Simplified 2-Track)

#### 4.2.1 Timeline Architecture

**Library Choice**: Use `@dnd-kit/core` for drag-and-drop (modern, performant, accessible)

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Timeline Layout** (Simplified 2-Track):

```
┌─────────────────────────────────────────────────────────┐
│  Timeline Controls: [▶] [⏸] [⏹] Zoom: [-][+] Snap: [✓] │
├─────────────────────────────────────────────────────────┤
│  00:00        00:15        00:30        00:45    01:00  │
│  ─────┼─────────┼─────────┼─────────┼─────────┼───────  │
│                                                          │
│  Video Track: [██████Clip1██████][███Clip2███]          │
│                                                          │
│  Audio Track: [~~~~~Audio1~~~~~][~~~Audio2~~~]          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Note**: Starting with 2 tracks (1 video + 1 audio) for simplicity. Can expand to more tracks in future phases.

#### 4.2.2 Timeline Implementation

```typescript
// MultiClipTimeline.tsx
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

export function MultiClipTimeline() {
  const { tracks, timelineClips, addClipToTimeline, moveClip } = useEditorStore();
  const { playhead, setPlayhead } = useEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
      const clipId = active.id as string;
      const newTrackId = over.id as string;
      const newPosition = calculatePositionFromMouse(event);

      moveClip(clipId, newPosition, newTrackId);
    }
  };

  const calculatePositionFromMouse = (event: DragEndEvent): number => {
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const mouseX = event.activatorEvent.clientX - timelineRect.left;
    const pixelsPerSecond = timelineRect.width / duration;
    return mouseX / pixelsPerSecond;
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div ref={timelineRef} className="timeline">
        {tracks.map(track => (
          <Track key={track.id} track={track}>
            {timelineClips.filter(c => c.trackId === track.id).map(clip => (
              <TimelineClip key={clip.id} clip={clip} />
            ))}
          </Track>
        ))}
      </div>
    </DndContext>
  );
}
```

#### 4.2.3 Timeline Clip Component

```typescript
// TimelineClip.tsx
import { useDraggable } from '@dnd-kit/core';

export function TimelineClip({ clip }: { clip: TimelineClip }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: clip.id,
    disabled: clip.locked
  });

  const style = {
    left: `${clip.position * pixelsPerSecond}px`,
    width: `${clip.duration * pixelsPerSecond}px`,
    transform: transform ? `translateX(${transform.x}px)` : undefined,
    zIndex: clip.layer
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="timeline-clip"
      {...listeners}
      {...attributes}
    >
      {clip.thumbnail && (
        <img src={clip.thumbnail} alt="" className="clip-thumbnail" />
      )}
      <span className="clip-name">{clip.name}</span>

      {/* Trim handles */}
      <div className="trim-handle-left" onMouseDown={handleTrimStart} />
      <div className="trim-handle-right" onMouseDown={handleTrimEnd} />
    </div>
  );
}
```

#### 4.2.4 Overlapping Clip Behavior

**Similar to CapCut/DaVinci Resolve**:

- Clips on same track: **Prevent overlap** - moving clip pushes adjacent clips
- Clips on different tracks: **Allow overlap** - use z-index/layer system
- Visual indicator for overlapped regions (shadow/highlight)

```typescript
const handleClipMove = (clipId: string, newPosition: number, trackId: string) => {
  const clip = clips.find((c) => c.id === clipId)
  const clipsOnTrack = clips.filter((c) => c.trackId === trackId && c.id !== clipId)

  // Check for collisions on same track
  const collision = clipsOnTrack.find(
    (c) => newPosition < c.position + c.duration && newPosition + clip.duration > c.position
  )

  if (collision) {
    // Push adjacent clip
    const overlap = newPosition + clip.duration - collision.position
    moveClip(collision.id, collision.position + overlap)
  }

  moveClip(clipId, newPosition, trackId)
}
```

#### 4.2.5 Split Functionality

```typescript
const splitClip = (clipId: string, splitTime: number) => {
  const clip = clips.find((c) => c.id === clipId)
  if (!clip) return

  // Calculate split point relative to clip position
  const relativeSplitTime = splitTime - clip.position

  // Create two new timeline clips referencing same source
  const clip1: TimelineClip = {
    ...clip,
    id: generateId(),
    duration: relativeSplitTime,
    trimEnd: clip.trimStart + relativeSplitTime
  }

  const clip2: TimelineClip = {
    ...clip,
    id: generateId(),
    position: clip.position + relativeSplitTime,
    duration: clip.duration - relativeSplitTime,
    trimStart: clip.trimStart + relativeSplitTime
  }

  // Remove original, add split clips
  removeClipFromTimeline(clipId)
  addClipToTimeline(clip1)
  addClipToTimeline(clip2)
}
```

**UI**:

- Split button in toolbar (keyboard shortcut: `S`)
- Split at playhead position
- Visual indicator showing split line before confirming

#### 4.2.6 Snap-to-Grid

```typescript
const SNAP_THRESHOLD = 0.1 // 100ms threshold

const snapPosition = (position: number, clips: TimelineClip[]): number => {
  if (!snapToGrid) return position

  // Snap to clip edges
  for (const clip of clips) {
    if (Math.abs(position - clip.position) < SNAP_THRESHOLD) {
      return clip.position
    }
    if (Math.abs(position - (clip.position + clip.duration)) < SNAP_THRESHOLD) {
      return clip.position + clip.duration
    }
  }

  // Snap to grid lines (every 1 second)
  const gridLine = Math.round(position)
  if (Math.abs(position - gridLine) < SNAP_THRESHOLD) {
    return gridLine
  }

  return position
}
```

**Acceptance Criteria**:

- ✅ User can drag clips from media library to timeline
- ✅ User can reorder clips on timeline via drag-and-drop
- ✅ User can move clips between tracks
- ✅ User can trim clip start/end by dragging edges
- ✅ User can split clip at playhead (keyboard: S)
- ✅ User can delete clips from timeline (keyboard: Delete)
- ✅ Clips on same track push adjacent clips on collision
- ✅ Clips on different tracks can overlap
- ✅ Snap-to-grid assists with alignment
- ✅ Timeline supports zoom in/out (same as Phase 1)
- ✅ Multiple video and audio tracks supported

---

### 4.3 Multi-Clip Playback

#### 4.3.1 Playback Strategy

**Chosen Approach**: **Hybrid HTML5 + FFmpeg pre-render**

- **Preview Mode** (default): HTML5 video elements with manual clip switching
- **High-Quality Preview** (optional): FFmpeg pre-rendered temp file

**HTML5 Sequential Playback**:

```typescript
const useMultiClipPlayback = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { clips, playhead, isPlaying } = useTimelineStore()
  const [currentClipIndex, setCurrentClipIndex] = useState(0)

  // Sort clips by position
  const sortedClips = useMemo(() => [...clips].sort((a, b) => a.position - b.position), [clips])

  // Find active clip at playhead
  useEffect(() => {
    const activeClip = sortedClips.find(
      (clip) => playhead >= clip.position && playhead < clip.position + clip.duration
    )

    if (activeClip) {
      const clipIndex = sortedClips.indexOf(activeClip)
      if (clipIndex !== currentClipIndex) {
        setCurrentClipIndex(clipIndex)
        loadClip(activeClip)
      }
    }
  }, [playhead, sortedClips])

  const loadClip = (clip: TimelineClip) => {
    const sourceClip = getSourceClip(clip.sourceClipId)
    if (!videoRef.current) return

    videoRef.current.src = `file://${sourceClip.path}`
    videoRef.current.currentTime = clip.trimStart

    if (isPlaying) {
      videoRef.current.play()
    }
  }

  // Handle clip transitions
  const handleTimeUpdate = () => {
    if (!videoRef.current) return

    const currentClip = sortedClips[currentClipIndex]
    const videoTime = videoRef.current.currentTime

    // Update global playhead
    const globalTime = currentClip.position + (videoTime - currentClip.trimStart)
    setPlayhead(globalTime)

    // Check if reached trim end
    if (videoTime >= currentClip.trimEnd) {
      // Move to next clip
      if (currentClipIndex < sortedClips.length - 1) {
        setCurrentClipIndex(currentClipIndex + 1)
        loadClip(sortedClips[currentClipIndex + 1])
      } else {
        // End of timeline
        pause()
      }
    }
  }

  return { videoRef, handleTimeUpdate }
}
```

**FFmpeg Pre-render (Optional)**:

```typescript
const generateTimelinePreview = async (clips: TimelineClip[]): Promise<string> => {
  const tempOutputPath = `${tempDir}/clipforge/preview_${Date.now()}.mp4`

  // Generate concat file
  const concatList = clips
    .map((clip) => {
      const sourceClip = getSourceClip(clip.sourceClipId)
      return `file '${sourceClip.path}'\ninpoint ${clip.trimStart}\noutpoint ${clip.trimEnd}`
    })
    .join('\n')

  const concatFilePath = `${tempDir}/clipforge/concat_${Date.now()}.txt`
  await fs.writeFile(concatFilePath, concatList)

  // FFmpeg concat
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', concatFilePath, '-c', 'copy', tempOutputPath])

  return tempOutputPath
}
```

**UI Toggle**: Settings option to enable "High-Quality Preview" (pre-render timeline)

#### 4.3.2 Audio Synchronization

- Use Web Audio API for precise audio timing
- Mix multiple audio tracks in browser
- Mute/solo controls per track

```typescript
const audioContext = new AudioContext()

clips.forEach((clip) => {
  const sourceNode = audioContext.createMediaElementSource(clip.audioElement)
  const gainNode = audioContext.createGain()

  // Apply track volume
  gainNode.gain.value = track.muted ? 0 : track.volume

  sourceNode.connect(gainNode).connect(audioContext.destination)
})
```

**Acceptance Criteria**:

- ✅ Timeline plays continuously across multiple clips
- ✅ Playhead scrubbing works across all clips
- ✅ Audio stays synchronized with video
- ✅ Track mute/solo controls work correctly
- ✅ Optional high-quality preview via FFmpeg pre-render

---

### 4.4 Export Pipeline

#### 4.4.1 Multi-Clip Export Implementation

**Strategy**: FFmpeg concat demuxer preserving original resolution

```typescript
const exportTimeline = async (params: MultiClipExportParams): Promise<string> => {
  const { timelineClips, outputPath, format, quality } = params

  // Sort clips by position
  const sortedClips = [...timelineClips].sort((a, b) => a.position - b.position)

  // Step 1: Extract trimmed segments
  const tempSegments: string[] = []

  for (const clip of sortedClips) {
    const sourceClip = getSourceClip(clip.sourceClipId)
    const tempPath = `${tempDir}/clipforge/segment_${clip.id}.mp4`

    await ffmpeg([
      '-i',
      sourceClip.path,
      '-ss',
      clip.trimStart.toString(),
      '-to',
      clip.trimEnd.toString(),
      '-c',
      'copy',
      tempPath
    ])

    tempSegments.push(tempPath)
  }

  // Step 2: Generate concat file
  const concatContent = tempSegments.map((path) => `file '${path}'`).join('\n')
  const concatFilePath = `${tempDir}/clipforge/concat_${Date.now()}.txt`
  await fs.writeFile(concatFilePath, concatContent)

  // Step 3: Concatenate segments (preserving original resolution)
  await ffmpeg(
    [
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatFilePath,
      '-c',
      'copy', // Use stream copy for speed
      outputPath
    ],
    (progress) => {
      // Send progress to renderer
      onProgress?.(progress)
    }
  )

  // Cleanup temp files
  await Promise.all([...tempSegments.map((p) => fs.unlink(p)), fs.unlink(concatFilePath)])

  return outputPath
}
```

#### 4.4.2 Resolution Handling

**Strategy**: Preserve original resolution (simplified for Phase 2)

- All clips maintain their original resolution
- No resolution normalization or scaling
- FFmpeg concat handles mixed resolutions automatically
- Future phases can add resolution normalization

**Note**: This approach prioritizes simplicity and performance. Resolution normalization can be added in future phases if needed.

#### 4.4.3 Export Progress Tracking

```typescript
const parseFFmpegProgress = (stderr: string, totalDuration: number): number => {
  const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/)
  if (!timeMatch) return 0

  const hours = parseInt(timeMatch[1])
  const minutes = parseInt(timeMatch[2])
  const seconds = parseFloat(timeMatch[3])

  const currentTime = hours * 3600 + minutes * 60 + seconds
  return Math.min((currentTime / totalDuration) * 100, 100)
}
```

**Acceptance Criteria**:

- ✅ Export concatenates all timeline clips into single file
- ✅ Trimmed regions respected in export
- ✅ Resolution normalization works correctly
- ✅ Progress bar shows real-time export progress
- ✅ Export supports multiple formats (MP4, MOV, WebM)
- ✅ Audio tracks mixed correctly in export
- ✅ Export maintains source quality when possible

---

### 4.5 Thumbnail Generation

**Implementation**: FFmpeg first-frame extraction

```typescript
const generateThumbnail = async (videoPath: string, outputPath: string): Promise<string> => {
  await ffmpeg([
    '-i',
    videoPath,
    '-vframes',
    '1',
    '-vf',
    'scale=160:90',
    '-f',
    'image2',
    outputPath
  ])

  return outputPath
}

// Generate thumbnails on import
const importVideoWithThumbnail = async (filePath: string): Promise<VideoClip> => {
  const metadata = await getVideoMetadata(filePath)
  const thumbnailPath = `${tempDir}/clipforge/thumbnails/${Date.now()}.jpg`

  await generateThumbnail(filePath, thumbnailPath)

  return {
    id: generateId(),
    name: path.basename(filePath),
    path: filePath,
    thumbnail: thumbnailPath,
    ...metadata
  }
}
```

**Caching Strategy**:

- Generate thumbnails on video import
- Store in temp directory
- Clear cache on app close or manually via settings

**Acceptance Criteria**:

- ✅ Thumbnails generated on video import
- ✅ Thumbnails displayed in media library
- ✅ Thumbnails shown on timeline clips
- ✅ Thumbnail cache managed efficiently

---

## 5. UI/UX Specifications

### 5.1 Recording Panel

**Layout**: Modal dialog or sidebar panel (recommend modal for focus)

```
┌─────────────────────────────────────┐
│  Start Recording                    │
├─────────────────────────────────────┤
│                                     │
│  Recording Type:                    │
│  ○ Screen    ○ Webcam    ○ Both     │
│                                     │
│  Screen/Window:                     │
│  [▼ Select window or screen]        │
│                                     │
│  Audio Input:                       │
│  [▼ Default Microphone]             │
│  □ Include system audio             │
│                                     │
│  Quality:                           │
│  ● High (1080p @ 60fps)             │
│  ○ Medium (1080p @ 30fps)           │
│  ○ Low (720p @ 30fps)               │
│                                     │
│         [Cancel]  [Start Recording] │
└─────────────────────────────────────┘
```

**During Recording**:

```
┌─────────────────────────────────────┐
│  Recording... 00:05:23        [●]   │
├─────────────────────────────────────┤
│                                     │
│  [Live Preview Window]              │
│                                     │
│                                     │
│  [⏸ Pause]  [⏹ Stop & Save]        │
└─────────────────────────────────────┘
```

### 5.2 Multi-Track Timeline Layout

**Professional Layout** (inspired by DaVinci Resolve/Premiere Pro):

```
┌───────────────────────────────────────────────────────────────┐
│ ClipForge                                        [_ □ ×]       │
├─────────────┬─────────────────────────────────────────────────┤
│             │                                                  │
│   MEDIA     │         PREVIEW PLAYER                           │
│  LIBRARY    │      [Video Display Area]                        │
│             │      [◄◄] [▶/II] [►►] [🔊] [⏱️]                    │
│  [+ Import] │      00:00 ────●──── 01:30                       │
│  [🎙️ Record]│                                                  │
│             │                                                  │
│  📄 Clip 1  │                                                  │
│  📄 Clip 2  │                                                  │
│  📄 Clip 3  │                                                  │
│             │                                                  │
├─────────────┴─────────────────────────────────────────────────┤
│                    MULTI-TRACK TIMELINE                        │
│  [▶] [⏸] [⏹]  [-] Zoom [+]  [⚡ Snap]  [✂️ Split]  [↩️ Undo]   │
│  00:00          00:15          00:30          00:45    01:00  │
│  ─────┼───────────┼───────────┼───────────┼───────────┼─────  │
│                         ▼ (playhead)                           │
│  V1: [🎬══════Clip1══════][🎬═Clip2═]                          │
│                                                                │
│  V2:        [🎬════Clip3════]                                  │
│                                                                │
│  A1: [🎵~~~~~Audio1~~~~~][🎵~~Audio2~~]                        │
│                                                                │
│  [+ Add Video Track]  [+ Add Audio Track]                     │
├────────────────────────────────────────────────────────────────┤
│  [Export Timeline] [Settings]                Duration: 01:05   │
└────────────────────────────────────────────────────────────────┘
```

### 5.3 Track Controls

**Per-Track Controls** (left side of timeline):

```
┌──────────────┐
│ Video Track 1│
│ [M] [S] [🔒]  │  M=Mute, S=Solo, 🔒=Lock
│              │
└──────────────┘
```

**Implementation**:

```typescript
interface TrackControlsProps {
  track: Track;
}

export function TrackControls({ track }: TrackControlsProps) {
  const { toggleTrackMute, toggleTrackLock } = useTimelineStore();

  return (
    <div className="track-controls">
      <span className="track-name">{track.name}</span>
      <button
        className={track.muted ? 'active' : ''}
        onClick={() => toggleTrackMute(track.id)}
        title="Mute Track (M)"
      >
        M
      </button>
      <button
        className={track.locked ? 'active' : ''}
        onClick={() => toggleTrackLock(track.id)}
        title="Lock Track (L)"
      >
        🔒
      </button>
    </div>
  );
}
```

### 5.4 Keyboard Shortcuts

| Shortcut                 | Action                        |
| ------------------------ | ----------------------------- |
| **Space**                | Play/Pause                    |
| **S**                    | Split clip at playhead        |
| **Delete/Backspace**     | Delete selected clip(s)       |
| **I**                    | Set trim in point             |
| **O**                    | Set trim out point            |
| **Cmd/Ctrl + Z**         | Undo                          |
| **Cmd/Ctrl + Shift + Z** | Redo                          |
| **Cmd/Ctrl + D**         | Duplicate selected clip       |
| **M**                    | Toggle mute on selected track |
| **L**                    | Toggle lock on selected track |
| **+/-**                  | Zoom in/out timeline          |
| **Home**                 | Go to timeline start          |
| **End**                  | Go to timeline end            |
| **←/→**                  | Move playhead 1 frame         |
| **Shift + ←/→**          | Move playhead 1 second        |

### 5.5 Context Menus

**Timeline Clip Right-Click**:

- Split at Playhead (S)
- Duplicate Clip (Cmd+D)
- Delete Clip (Delete)

---

- Copy
- Paste

---

- Properties

**Track Right-Click**:

- Rename Track
- Duplicate Track
- Delete Track

---

- Mute Track
- Solo Track
- Lock Track

### 5.6 Visual Feedback

**Drag States**:

- **Hover**: Clip border highlights
- **Dragging**: Clip becomes semi-transparent, shows ghost position
- **Drop**: Smooth animation to final position

**Snap Indicators**:

- Vertical line appears when snapping to grid/clip edge
- Magnetic "pull" animation

**Playhead**:

- Red vertical line across all tracks
- Time display follows playhead
- Smooth scrubbing with momentum

**Selection**:

- Selected clips have blue border
- Multi-select with Cmd/Ctrl + click
- Marquee selection with drag (future enhancement)

---

## 6. Performance Targets

| Metric                   | Target      | Notes                                  |
| ------------------------ | ----------- | -------------------------------------- |
| **App Launch**           | < 5 seconds | Same as MVP                            |
| **Timeline FPS**         | ≥ 30 fps    | Smooth scrolling with 10 clips         |
| **Playback FPS**         | ≥ 30 fps    | HTML5 playback across clips            |
| **Recording Latency**    | < 100ms     | Preview to screen delay                |
| **Export Speed**         | ≈ Real-time | 1-minute timeline exports in ~1 minute |
| **Memory Usage**         | < 500MB     | With 10 clips loaded                   |
| **Thumbnail Generation** | < 1 second  | Per video on import                    |

### Performance Optimizations

1. **Virtual Scrolling**: Render only visible timeline clips
2. **Thumbnail Caching**: Store thumbnails in temp directory
3. **Lazy Loading**: Load video metadata on demand
4. **Debounced Updates**: Limit state updates during drag operations
5. **Web Workers**: Offload heavy computations (future)

---

## 7. Testing Strategy

### 7.1 Manual Testing Checklist

**Recording**:

- [ ] Screen recording saves to temp directory
- [ ] Webcam recording works with selected device
- [ ] PiP mode overlays webcam correctly
- [ ] Audio tracks mix properly
- [ ] Pause/resume works correctly
- [ ] Recording auto-imports to library

**Timeline**:

- [ ] Drag clip from library to timeline
- [ ] Reorder clips on timeline
- [ ] Move clips between tracks
- [ ] Trim clip edges
- [ ] Split clip at playhead
- [ ] Delete clip from timeline
- [ ] Snap-to-grid works
- [ ] Undo/redo works (if implemented)

**Playback**:

- [ ] Timeline plays continuously across clips
- [ ] Playhead scrubbing works
- [ ] Audio stays synchronized
- [ ] Track mute/solo works
- [ ] Playback stops at timeline end

**Export**:

- [ ] Export concatenates all clips
- [ ] Trimmed regions respected
- [ ] Resolution normalization works
- [ ] Progress tracking accurate
- [ ] Multiple formats supported
- [ ] Audio tracks mixed correctly

**Cross-Platform**:

- [ ] All features work on macOS
- [ ] All features work on Windows
- [ ] All features work on Linux
- [ ] FFmpeg binaries load correctly
- [ ] File paths handled correctly

### 7.2 Automated Testing (Playwright)

**Recommendation**: Add Playwright for E2E testing

```bash
npm install -D @playwright/test
```

**Sample Test**:

```typescript
// tests/timeline.spec.ts
import { test, expect, _electron as electron } from '@playwright/test'

test('should add clip to timeline', async () => {
  const app = await electron.launch({ args: ['.'] })
  const window = await app.firstWindow()

  // Import video
  await window.click('[data-testid="import-button"]')
  // ... select file via dialog

  // Drag to timeline
  const clip = await window.locator('[data-testid="media-clip-1"]')
  const timeline = await window.locator('[data-testid="timeline-track-1"]')
  await clip.dragTo(timeline)

  // Verify clip on timeline
  const timelineClip = await window.locator('[data-testid="timeline-clip-1"]')
  await expect(timelineClip).toBeVisible()

  await app.close()
})
```

**Test Coverage Goals**:

- Recording functionality: 80%
- Timeline operations: 90%
- Export pipeline: 85%
- UI interactions: 75%

---

## 8. Implementation Phases

### Phase 2A: Comprehensive Recording System (Week 1-2) - PRIORITY

**Tasks**:

- [ ] Implement `desktopCapturer` for screen sources
- [ ] Create recording panel UI with source selection
- [ ] Implement `MediaRecorder` wrapper for screen recording
- [ ] Implement `MediaRecorder` wrapper for webcam recording
- [ ] Implement Canvas-based Picture-in-Picture recording
- [ ] Add audio device selection
- [ ] Implement temp file management
- [ ] Add recording to media library AND timeline
- [ ] Test all recording modes on all platforms

**Deliverables**:

- Functional screen + webcam + PiP recording
- Recording panel UI with all modes
- Auto-import to media library AND timeline
- Comprehensive recording workflow

### Phase 2B: Simple 2-Track Timeline (Week 3-4)

**Tasks**:

- [ ] Install and configure `@dnd-kit/core`
- [ ] Extend editor store for timeline management
- [ ] Implement `MultiClipTimeline` component (2 tracks)
- [ ] Create `TimelineClip` with drag-and-drop
- [ ] Add track controls (mute, lock) for 2 tracks
- [ ] Implement trim handles on timeline clips
- [ ] Add snap-to-grid functionality
- [ ] Create split functionality

**Deliverables**:

- 2-track timeline with drag-and-drop (1 video + 1 audio)
- Trim, split, delete operations
- Snap-to-grid assistance

### Phase 2C: Multi-Clip Playback (Week 5)

**Tasks**:

- [ ] Implement sequential clip playback logic
- [ ] Add clip transition handling
- [ ] Synchronize playhead with video playback
- [ ] Mix audio tracks with Web Audio API
- [ ] Test playback across 10+ clips
- [ ] Optional: Add FFmpeg pre-render preview

**Deliverables**:

- Seamless playback across multiple clips
- Synchronized audio mixing
- Smooth playhead scrubbing

### Phase 2D: Export Pipeline (Week 6)

**Tasks**:

- [ ] Implement FFmpeg concat with trimming
- [ ] Create export progress tracking
- [ ] Update export modal for multi-clip
- [ ] Test export with various clip combinations
- [ ] Cleanup temp files after export

**Deliverables**:

- Multi-clip export functionality (preserving original resolution)
- Progress tracking

### Phase 2E: Polish & Testing (Week 7)

**Tasks**:

- [ ] Generate thumbnails on import
- [ ] Add keyboard shortcuts
- [ ] Implement context menus
- [ ] Add visual feedback (drag states, snap indicators)
- [ ] Cross-platform testing
- [ ] Performance optimization
- [ ] Bug fixes

**Deliverables**:

- Polished UI with professional feel
- All keyboard shortcuts working
- Stable cross-platform operation

### Phase 2F: Documentation & Release (Week 8)

**Tasks**:

- [ ] Update README with Phase 2 features
- [ ] Create user guide for recording
- [ ] Document timeline keyboard shortcuts
- [ ] Add troubleshooting section
- [ ] Create demo videos
- [ ] Prepare release notes

**Deliverables**:

- Comprehensive documentation
- Demo videos
- Release-ready builds

---

## 9. Risk Assessment & Mitigation

| Risk                                     | Impact | Probability | Mitigation                                          |
| ---------------------------------------- | ------ | ----------- | --------------------------------------------------- |
| **MediaRecorder browser compatibility**  | High   | Low         | Test on Chromium version in Electron, use polyfills |
| **FFmpeg concat performance**            | Medium | Medium      | Use stream copy when possible, pre-render option    |
| **Timeline drag-and-drop complexity**    | Medium | Medium      | Use `@dnd-kit` library, start simple                |
| **Multi-clip audio sync issues**         | High   | Medium      | Use Web Audio API with precise timing               |
| **Memory leaks with video elements**     | Medium | Medium      | Proper cleanup, limit concurrent video elements     |
| **Cross-platform recording differences** | Medium | Low         | Platform-specific testing, fallback options         |
| **Thumbnail generation slowness**        | Low    | Low         | Generate async, show placeholder while loading      |

---

## 10. Success Criteria

### Functional Requirements

- ✅ User can record screen with audio
- ✅ User can record webcam
- ✅ User can create PiP recordings
- ✅ User can add multiple clips to 2-track timeline
- ✅ User can arrange clips on video and audio tracks
- ✅ User can trim clips on timeline
- ✅ User can split clips at playhead
- ✅ User can preview timeline playback
- ✅ User can export multi-clip timeline (preserving original resolution)
- ✅ Timeline supports 10+ clips without lag

### Performance Requirements

- ✅ Recording latency < 100ms
- ✅ Timeline interactions ≥ 30fps
- ✅ Export speed ≈ real-time
- ✅ Memory usage < 500MB with 10 clips
- ✅ App launch < 5 seconds

### User Experience Requirements

- ✅ Intuitive timeline drag-and-drop
- ✅ Professional keyboard shortcuts
- ✅ Clear visual feedback during operations
- ✅ Smooth playback transitions
- ✅ Consistent cross-platform experience

### Technical Requirements

- ✅ Modular state management (separate stores)
- ✅ Proper error handling and recovery
- ✅ Clean temp file management
- ✅ Type-safe TypeScript throughout
- ✅ Accessible UI components

---

## 11. Future Enhancements (Post-Phase 2)

### Phase 3: Advanced Editing Features

- **Transitions**: Crossfade, fade to black, slide
- **Effects**: Color correction, filters, speed ramping
- **Text Overlays**: Title cards, lower thirds, captions
- **Audio Editing**: Waveform display, audio effects, normalization
- **Keyframes**: Animated properties (position, scale, opacity)

### Phase 4: Collaboration & Cloud

- **Project Files**: Save/load timeline projects
- **Cloud Storage**: Google Drive, Dropbox integration
- **Real-time Collaboration**: Multi-user editing
- **Version Control**: Timeline history and branching

### Phase 5: AI Features

- **Auto-captions**: Speech-to-text subtitles
- **Smart Trim**: AI-powered highlight detection
- **Background Removal**: Chroma key without green screen
- **Noise Reduction**: AI audio enhancement

---

## 12. Appendix

### A. FFmpeg Commands Reference

**Screen Recording (Alternative to MediaRecorder)**:

```bash
ffmpeg -f avfoundation -i "1:0" -r 30 output.mp4  # macOS
ffmpeg -f gdigrab -i desktop -r 30 output.mp4     # Windows
ffmpeg -f x11grab -i :0.0 -r 30 output.mp4        # Linux
```

**Concat with Trimming**:

```bash
ffmpeg -f concat -safe 0 -i concat.txt -c copy output.mp4
```

**Resolution Normalization**:

```bash
ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:a copy output.mp4
```

**Thumbnail Generation**:

```bash
ffmpeg -i video.mp4 -vframes 1 -vf scale=160:90 -f image2 thumb.jpg
```

### B. Technology Stack Summary

**New Dependencies**:

- `@dnd-kit/core`: ^6.1.0 - Drag-and-drop toolkit
- `@dnd-kit/sortable`: ^8.0.0 - Sortable lists
- `@dnd-kit/utilities`: ^3.2.2 - DnD utilities
- `@playwright/test`: ^1.40.0 - E2E testing (optional)

**Updated Dependencies**:

- All existing MVP dependencies remain
- Zustand store split into multiple stores
- New IPC handlers for recording

### C. File Structure Changes

```
src/
├── main/
│   ├── recording/          # NEW: Recording system
│   ├── ffmpeg/
│   │   ├── concat.ts       # NEW: Multi-clip export
│   │   └── thumbnail.ts    # NEW: Thumbnail generation
│   └── ipc/
│       └── recordingHandlers.ts  # NEW: Recording IPC
│
├── renderer/src/
│   ├── components/
│   │   ├── RecordingPanel.tsx     # NEW
│   │   ├── MultiClipTimeline.tsx  # NEW
│   │   ├── TimelineClip.tsx       # NEW
│   │   ├── TimelineTrack.tsx      # NEW
│   │   └── TrackControls.tsx      # NEW
│   ├── hooks/
│   │   ├── useRecording.ts        # NEW
│   │   ├── useMultiClipPlayback.ts # NEW
│   │   └── useDragAndDrop.ts      # NEW
│   └── stores/
│       ├── recordingStore.ts      # NEW
│       └── timelineStore.ts       # NEW
│
└── types/
    ├── recording.ts        # NEW
    ├── timeline.ts         # NEW
    └── multiClip.ts        # NEW
```

---

## 13. Conclusion

Phase 2 transforms ClipForge from a simple trimmer into a **professional multi-clip video editor** with comprehensive recording capabilities while maintaining the simplicity and performance that defined the MVP. By prioritizing recording features and implementing a simplified 2-track timeline, Phase 2 delivers a complete editing solution that rivals commercial alternatives.

**Key Differentiators**:

- **Comprehensive Recording**: Screen, webcam, and Picture-in-Picture recording with immediate timeline integration
- **Native Desktop Performance**: No web-based lag
- **Offline-First**: Complete functionality without internet
- **Simple Yet Powerful**: Professional features without overwhelming complexity
- **Cross-Platform**: Consistent experience across all major OS

## 14. Key Phase 2 Decisions

### Recording Priority

- **Decision**: Implement all recording types (screen, webcam, PiP) simultaneously in Phase 2A
- **Rationale**: Recording is the top priority feature and core differentiator
- **Impact**: Comprehensive recording workflow from day one

### Timeline Simplification

- **Decision**: Start with 2-track timeline (1 video + 1 audio) instead of unlimited tracks
- **Rationale**: Reduces complexity while maintaining professional functionality
- **Impact**: Easier implementation, can expand to more tracks in future phases

### State Management

- **Decision**: Extend current single store instead of splitting into multiple stores
- **Rationale**: Current store works well, splitting adds complexity without clear benefit
- **Impact**: Simpler implementation, can split later if needed

### Export Strategy

- **Decision**: Preserve original resolution instead of normalization
- **Rationale**: Simpler implementation, better performance, FFmpeg handles mixed resolutions
- **Impact**: Faster exports, can add normalization in future phases

### PiP Implementation

- **Decision**: Include Canvas-based Picture-in-Picture in Phase 2
- **Rationale**: Important feature for content creators, manageable complexity
- **Impact**: Complete recording feature set
