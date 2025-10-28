# ClipForge System Patterns

## Architecture Overview

ClipForge follows a modern Electron application architecture with clear separation of concerns, optimized for desktop video editing workflows. Phase 2 extends this architecture to support multi-clip editing and native recording capabilities.

## Core Architecture Patterns

### 1. **Electron Main-Renderer Pattern**

```
Main Process (Node.js)
├── FFmpeg Integration
├── Recording System (Phase 2)
│   ├── Screen Recorder
│   ├── Media Recorder
│   └── Recording Manager
├── File System Operations
├── IPC Handlers
│   ├── Video Handlers
│   └── Recording Handlers (Phase 2)
└── Build Configuration

Renderer Process (React)
├── UI Components
│   ├── MVP Components
│   └── Phase 2 Components
│       ├── RecordingPanel
│       ├── MultiClipTimeline
│       └── TimelineClip
├── State Management (Extended)
├── User Interactions
├── Video Playback
└── Recording UI (Phase 2)

Preload Scripts
├── Secure IPC Bridge
└── API Exposures
```

### 2. **State Management Pattern (Zustand)**

```typescript
// Centralized store with optimized selectors
const useEditorStore = create<EditorState>((set, get) => ({
  // State properties
  clips: [],
  selectedClip: null,
  isExporting: false,

  // Actions
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  selectClip: (id) => set({ selectedClip: id }),
  startExport: async (params) => {
    /* export logic */
  }
}))

// Optimized selectors to prevent re-renders
const useClips = () => useEditorStore((state) => state.clips)
const useSelectedClip = () => useEditorStore((state) => state.selectedClip)
```

### 3. **Component Composition Pattern**

```typescript
// Layout component with clear hierarchy
<Layout>
  <Sidebar>
    <ImportManager />
    <MediaLibrary />
  </Sidebar>
  <MainContent>
    <PreviewPlayer />
    <Timeline />
    <ExportButton />
  </MainContent>
  <ExportModal />
</Layout>
```

## Video Processing Patterns

### 1. **FFmpeg Integration Pattern**

```typescript
// Platform-specific binary detection
const getFFmpegPath = (): string => {
  const platform = process.platform
  const arch = process.arch

  if (platform === 'darwin') {
    return arch === 'arm64' ? 'ffmpeg-mac-arm64' : 'ffmpeg-mac-x64'
  }
  // ... other platforms
}

// Async video processing with progress
const trimVideo = async (params: TrimParams): Promise<string> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getFFmpegPath(), args)

    ffmpeg.stdout.on('data', (data) => {
      // Parse progress from FFmpeg output
      const progress = parseProgress(data.toString())
      onProgress?.(progress)
    })

    ffmpeg.on('close', (code) => {
      code === 0 ? resolve(outputPath) : reject(new Error('Export failed'))
    })
  })
}
```

### 2. **IPC Communication Pattern**

```typescript
// Preload script exposes secure APIs
contextBridge.exposeInMainWorld('electronAPI', {
  getVideoMetadata: (path: string) => ipcRenderer.invoke('get-video-metadata', path),
  trimExport: (params: TrimParams) => ipcRenderer.invoke('trim-export', params),
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  onExportProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('export-progress', (_, progress) => callback(progress))
  }
})

// Main process handlers
ipcMain.handle('trim-export', async (_, params: TrimParams) => {
  return await trimVideo(params)
})
```

## UI/UX Patterns

### 1. **Responsive Design Pattern**

```typescript
// Container-based sizing with ResizeObserver
const useContainerSize = (ref: RefObject<HTMLElement>) => {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (ref.current) {
        setSize({
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight
        })
      }
    })

    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    return () => resizeObserver.disconnect()
  }, [ref])

  return size
}
```

### 2. **Timeline Interaction Pattern**

```typescript
// Coordinate system for timeline interactions
const handleTimelineClick = (e: MouseEvent) => {
  const rect = timelineRef.current.getBoundingClientRect()
  const clickX = e.clientX - rect.left + timelineScrollOffset
  const time = clickX / pixelsPerSecond

  // Clamp to valid range
  const clampedTime = Math.max(0, Math.min(time, duration))
  setPlayhead(clampedTime)
}

// Drag handle pattern
const handleDrag = (e: MouseEvent) => {
  if (!isDragging || !activeHandle) return

  const rect = timelineRef.current.getBoundingClientRect()
  const mouseX = e.clientX - rect.left + timelineScrollOffset
  const time = mouseX / pixelsPerSecond

  if (activeHandle === 'start') {
    updateTrimStart(Math.min(time, trimEnd - 0.05))
  } else {
    updateTrimEnd(Math.max(time, trimStart + 0.05))
  }
}
```

### 3. **Modal Management Pattern**

```typescript
// Centralized modal state
const useUI = () => useEditorStore((state) => ({
  activeModal: state.activeModal,
  setActiveModal: state.setActiveModal
}))

// Modal component with portal
const ExportModal = () => {
  const { activeModal, setActiveModal } = useUI()

  if (activeModal !== 'export') return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        {/* Modal content */}
      </div>
    </div>,
    document.body
  )
}
```

## Performance Patterns

### 1. **Optimized Selectors Pattern**

```typescript
// Individual selectors to prevent unnecessary re-renders
const useTimeline = () => {
  const playhead = useEditorStore((state) => state.playhead)
  const duration = useEditorStore((state) => state.duration)
  const zoomLevel = useEditorStore((state) => state.zoomLevel)

  return { playhead, duration, zoomLevel }
}

// Memoized calculations
const useTimelineCalculations = () => {
  const { duration, zoomLevel, containerWidth } = useTimeline()

  return useMemo(() => {
    const basePixelsPerSecond = containerWidth / duration
    const pixelsPerSecond = basePixelsPerSecond * zoomLevel
    const totalWidth = duration * pixelsPerSecond

    return { pixelsPerSecond, totalWidth }
  }, [duration, zoomLevel, containerWidth])
}
```

### 2. **Event Delegation Pattern**

```typescript
// Single event listener for multiple elements
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleDrag(e)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      setActiveHandle(null)
    }
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}, [isDragging, activeHandle])
```

### 3. **Debounced Updates Pattern**

```typescript
// Debounce expensive operations
const debouncedUpdatePlayhead = useMemo(
  () =>
    debounce((time: number) => {
      setPlayhead(time)
    }, 16), // 60fps
  [setPlayhead]
)

// Use in drag operations
const handleDrag = (e: MouseEvent) => {
  const time = calculateTimeFromPosition(e)
  debouncedUpdatePlayhead(time)
}
```

## Error Handling Patterns

### 1. **Graceful Degradation Pattern**

```typescript
// Icon loading with fallback
const IconWithFallback = ({ src, alt, fallback }) => {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return fallback
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
    />
  )
}
```

### 2. **Error Boundary Pattern**

```typescript
// Error boundary for component errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}
```

### 3. **Async Error Handling Pattern**

```typescript
// Consistent error handling for async operations
const handleExport = async () => {
  try {
    setExportStatus('exporting')
    const result = await trimExport(exportParams)
    setExportStatus('success')
    setExportResult(result)
  } catch (error) {
    console.error('Export failed:', error)
    setExportStatus('error')
    setErrorMessage(error.message)
  }
}
```

## Build and Distribution Patterns

### 1. **Cross-Platform Build Pattern**

```yaml
# electron-builder.yml
appId: com.clipforge.app
productName: ClipForge

mac:
  target: [dmg, zip]
  icon: build/icon.icns
  category: public.app-category.video

win:
  target: nsis
  icon: build/icon.ico

linux:
  target: [AppImage, snap, deb]
  icon: build/icon.png
```

### 2. **Asset Management Pattern**

```typescript
// Production asset handling
const getAssetPath = (assetName: string): string => {
  if (process.env.NODE_ENV === 'development') {
    return `/src/assets/${assetName}`
  }
  return `./assets/${assetName}`
}

// Icon usage
<img src={getAssetPath('icon.png')} alt="ClipForge" />
```

### 3. **Environment Configuration Pattern**

```typescript
// Environment-specific configuration
const config = {
  development: {
    ffmpegPath: './resources/ffmpeg/',
    logLevel: 'debug'
  },
  production: {
    ffmpegPath: './resources/ffmpeg/',
    logLevel: 'error'
  }
}

const currentConfig = config[process.env.NODE_ENV || 'development']
```

## Testing Patterns

### 1. **Component Testing Pattern**

```typescript
// Test component with mock store
const renderWithStore = (component: ReactElement) => {
  return render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  )
}

// Test user interactions
test('should update playhead on timeline click', () => {
  const { getByTestId } = renderWithStore(<Timeline />)
  const timeline = getByTestId('timeline')

  fireEvent.click(timeline, { clientX: 100 })

  expect(mockStore.getState().playhead).toBe(expectedTime)
})
```

### 2. **Integration Testing Pattern**

```typescript
// Test complete workflows
test('should complete video trimming workflow', async () => {
  // Import video
  await importVideo('test-video.mp4')

  // Set trim points
  setTrimStart(10)
  setTrimEnd(20)

  // Export video
  const result = await exportVideo('output.mp4')

  expect(result).toBeDefined()
  expect(result.duration).toBe(10)
})
```

## Security Patterns

### 1. **Context Isolation Pattern**

```typescript
// Preload script with context isolation
contextBridge.exposeInMainWorld('electronAPI', {
  // Only expose necessary APIs
  getVideoMetadata: (path: string) => ipcRenderer.invoke('get-video-metadata', path)
  // Never expose Node.js APIs directly
})
```

### 2. **Input Validation Pattern**

```typescript
// Validate all inputs
const validateVideoFile = (file: File): boolean => {
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm']
  const maxSize = 100 * 1024 * 1024 // 100MB

  return allowedTypes.includes(file.type) && file.size <= maxSize
}
```

## Phase 2 Architecture Patterns

### 1. **Recording System Pattern**

```typescript
// Recording state management
interface RecordingState {
  isRecording: boolean
  recordingType: 'screen' | 'webcam' | 'pip' | null
  recordingDuration: number
  recordingPath: string | null
  audioInputs: MediaDeviceInfo[]
  selectedAudioInput: string | null
}

// Recording workflow
const startRecording = async (type: RecordingType, options: RecordingOptions) => {
  // 1. Get media streams (screen/webcam)
  const stream = await getMediaStream(type, options)

  // 2. Create MediaRecorder with proper settings
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: getBitrate(options.quality)
  })

  // 3. Handle recording events
  recorder.ondataavailable = handleDataAvailable
  recorder.onstop = handleRecordingStop

  // 4. Start recording and update state
  recorder.start()
  setRecordingState({ isRecording: true, recordingType: type })
}
```

### 2. **Multi-Clip Timeline Pattern**

```typescript
// Timeline state management
interface TimelineState {
  timelineClips: TimelineClip[]
  tracks: Track[]
  selectedTimelineClips: string[]
  snapToGrid: boolean
}

// Drag and drop with @dnd-kit
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event

  if (over) {
    const clipId = active.id as string
    const newTrackId = over.id as string
    const newPosition = calculatePositionFromMouse(event)

    // Update clip position and track
    moveClip(clipId, newPosition, newTrackId)
  }
}

// Collision detection for same track
const handleClipMove = (clipId: string, newPosition: number, trackId: string) => {
  const clipsOnTrack = timelineClips.filter((c) => c.trackId === trackId && c.id !== clipId)

  // Check for collisions and push adjacent clips
  const collision = clipsOnTrack.find(
    (c) => newPosition < c.position + c.duration && newPosition + clip.duration > c.position
  )

  if (collision) {
    const overlap = newPosition + clip.duration - collision.position
    moveClip(collision.id, collision.position + overlap)
  }
}
```

### 3. **Multi-Clip Playback Pattern**

```typescript
// Sequential clip playback
const useMultiClipPlayback = () => {
  const [currentClipIndex, setCurrentClipIndex] = useState(0)
  const { timelineClips, playhead, isPlaying } = useEditorStore()

  // Sort clips by position
  const sortedClips = useMemo(
    () => [...timelineClips].sort((a, b) => a.position - b.position),
    [timelineClips]
  )

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

  // Handle clip transitions
  const handleTimeUpdate = () => {
    const currentClip = sortedClips[currentClipIndex]
    const videoTime = videoRef.current.currentTime

    // Update global playhead
    const globalTime = currentClip.position + (videoTime - currentClip.trimStart)
    setPlayhead(globalTime)

    // Check if reached trim end
    if (videoTime >= currentClip.trimEnd) {
      if (currentClipIndex < sortedClips.length - 1) {
        setCurrentClipIndex(currentClipIndex + 1)
        loadClip(sortedClips[currentClipIndex + 1])
      } else {
        pause() // End of timeline
      }
    }
  }
}
```

### 4. **Multi-Clip Export Pattern**

```typescript
// FFmpeg concat export
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

  // Step 3: Concatenate segments
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', concatFilePath, '-c', 'copy', outputPath])

  // Cleanup temp files
  await Promise.all([...tempSegments.map((p) => fs.unlink(p)), fs.unlink(concatFilePath)])

  return outputPath
}
```

## Key Design Principles

1. **Separation of Concerns**: Clear boundaries between main/renderer processes
2. **Performance First**: Optimized selectors and debounced updates
3. **Responsive Design**: Container-based sizing with ResizeObserver
4. **Error Resilience**: Graceful degradation and error boundaries
5. **Cross-Platform**: Consistent experience across all platforms
6. **Security**: Context isolation and input validation
7. **Maintainability**: Clear patterns and comprehensive documentation
8. **Recording Integration**: Seamless recording-to-timeline workflow
9. **Multi-Clip Support**: Efficient timeline management and playback
10. **Scalable Architecture**: Extensible patterns for future enhancements
