# ClipForge Active Context

## Current Work Focus

**Phase 7: Export Pipeline** - 🔄 PLANNING - Export modal, progress tracking, file system integration with dynamic UI components.

## Recent Changes

- ✅ **Phase 6 Complete**: Draggable trim handles fully implemented and integrated
- 🔄 **Phase 7 Planning**: Comprehensive implementation plan created

## Current Status

- **Phase 6**: Trim Controls ✅ COMPLETE
- **Phase 7**: Export Pipeline 🔄 PLANNING
- **Implementation**: Ready to start core development
- **Next Phase**: Phase 8 - UI/UX Polish

## Phase 7 Implementation Plan

### Overview

Phase 7 focuses on implementing the complete export pipeline. Users will be able to export trimmed videos with progress tracking, quality settings, and file system integration. Key priorities:

1. **Responsive Export Modal**: Modal stays within screen bounds at all resolutions
2. **No Layout Disruption**: Export button integrates seamlessly with Timeline
3. **Real-time Progress**: Show export progress with visual feedback
4. **Error Handling**: Graceful error messages and recovery
5. **File System Integration**: Browse, save, and open exported files

### Detailed Implementation Strategy

#### 1. Component Architecture

```
App
├── Layout
│   ├── Sidebar (MediaLibrary, ImportManager)
│   └── Main Content
│       ├── PreviewPlayer (flex-1)
│       ├── Timeline (flex-shrink-0)
│       ├── ExportButton (flex-shrink-0) ← NEW
│       └── ExportModal (portal/z-50) ← NEW
└── Toaster
```

#### 2. File Structure

**New files to create:**

- `src/components/ExportModal.tsx` - Main export modal component
- `src/hooks/useExport.ts` - Export management hook (may update existing)
- `src/main/ipc/exportHandlers.ts` - IPC handlers for export operations

**Files to modify:**

- `src/stores/editorStore.ts` - Add/enhance export state
- `src/preload/index.ts` - Expose export APIs
- `src/main/ipc/index.ts` - Register export IPC handlers
- `src/renderer/src/components/Layout.tsx` - Add export button and modal integration

#### 3. Store Enhancement

**New/Updated State Properties:**

- `isExporting: boolean` - Currently exporting
- `exportProgress: number` - 0-100 percentage
- `exportSettings: { format: 'mp4', quality: 'high' | 'medium' | 'low' }` - Export settings
- `activeModal: 'export' | null` - Currently active modal

**New/Updated Actions:**

- `startExport(outputPath: string): Promise<void>` - Begin export process
- `setActiveModal(modal: string | null): void` - Show/hide modals
- `setExportSettings(settings: ExportSettings): void` - Update export quality/format

#### 4. ExportModal Component Design

**Modal Structure:**

```
ExportModal (fixed inset-0, z-50)
├── Backdrop (bg-black/50, animated)
└── Content Box (max-w-md, rounded-lg)
    ├── Header (title + close button)
    ├── Body
    │   ├── Filename Input
    │   ├── Save Location (input + browse button)
    │   ├── Quality Settings (dropdown)
    │   ├── Status Area (progress/error/success)
    │   └── Action Buttons
```

**Responsive Design:**

- Desktop (>1024px): Modal centered, full features
- Tablet (768-1024px): Modal centered, adjusted width
- Mobile (<768px): Modal full width with margins, stack all inputs

**Key CSS Classes:**

- Modal: `fixed inset-0 bg-black/50 flex items-center justify-center z-50`
- Content: `bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`
- No overflow outside viewport with proper max-height

#### 5. Layout Integration

**Current Structure:**

```
Main Content (flex-col, overflow-hidden)
├── PreviewPlayer (flex-1, min-h-0)
└── Timeline (flex-shrink-0)
```

**New Structure:**

```
Main Content (flex-col, overflow-hidden)
├── PreviewPlayer (flex-1, min-h-0)
├── Timeline (flex-shrink-0)
└── Export Button Row (flex-shrink-0, p-4) ← NEW
    └── Button: "Export Trimmed Video"
```

**Constraints:**

- PreviewPlayer: `flex-1, min-h-0` - Takes available space
- Timeline: `flex-shrink-0` - Fixed height (~120px)
- Export Button Row: `flex-shrink-0, h-auto` - Minimal height (~80px)
- Main Content: `overflow-hidden` - Prevents any overflow
- Gap: `gap-6` (24px) - Maintains spacing

#### 6. Responsive Design Strategy

**Screen Size Handling:**

- Modal always centers with max-width constraint
- Modal height: `max-h-[90vh]` - Prevents going outside viewport
- Modal width: `max-w-md` on desktop, `max-w-sm` on smaller screens
- All inputs use full width within modal
- Buttons stack horizontally on desktop, vertically on small screens

**Overflow Prevention:**

- Modal content: `overflow-y-auto` with max-height
- Input fields: `w-full` within modal
- No fixed pixel widths that could exceed modal
- Padding consistent: `p-6` within modal

**Touch Considerations:**

- Touch-friendly button sizes: min `h-10` (40px)
- Adequate spacing: `space-y-4` between sections
- Input fields easily tappable on mobile

#### 7. Export Button Implementation

**Location:** Below Timeline in Layout component

**Structure:**

```tsx
<motion.div className="flex-shrink-0 px-8 py-4 border-t border-gray-700">
  <Button onClick={() => setActiveModal('export')} disabled={!selectedClip} className="w-full">
    <Download className="w-4 h-4 mr-2" />
    Export Trimmed Video
  </Button>
</motion.div>
```

**Styling:**

- Full width within content area
- Clear visual separation from timeline
- Disabled when no clip selected
- Hover effect for interactivity

#### 8. IPC Communication Flow

**Main Process → Renderer:**

```typescript
// Show file picker dialog
window.electronAPI.selectExportPath(filename) → IPC → main process → native dialog
```

**Main Process → Renderer:**

```typescript
// Open folder in file explorer
window.electronAPI.openFolder(folderPath) → IPC → main process → shell.openPath()
```

**Renderer → Main Process:**

```typescript
// Perform actual export
window.electronAPI.trimAndExport(params) → FFmpeg execution → progress updates
```

#### 9. Export Process Flow

```
User clicks Export Button
  ↓
Modal opens (setActiveModal('export'))
  ↓
User enters filename and chooses location (handleBrowse)
  ↓
User clicks Export button
  ↓
handleExport() validates inputs
  ↓
startExport() called → set isExporting: true
  ↓
Main process receives IPC call
  ↓
FFmpeg starts trimming/encoding
  ↓
Progress updates stream back → exportProgress: 0-100
  ↓
FFmpeg completes
  ↓
UI shows success message
  ↓
User can click "Open Folder" or close modal

On Error:
  ↓
exportStatus: 'error'
  ↓
Show error message
  ↓
User can retry or close
```

#### 10. Error Handling Strategy

**Validation Errors:**

- No filename: Show "Please enter filename"
- No path selected: Show "Please choose save location"
- Invalid filename: Show "Invalid filename"

**Export Errors:**

- FFmpeg error: Show "Export failed: [error message]"
- File write error: Show "Could not save file"
- Disk full: Show "Insufficient disk space"

**UI Recovery:**

- Reset exportStatus to 'idle' on close
- Allow retry without re-entering all fields
- Remember last export path for convenience

#### 11. Responsive Design Checklist

- [ ] Modal fits on 1024x768 screens
- [ ] Modal fits on mobile (320px width)
- [ ] No horizontal scrolling on any screen
- [ ] Input fields fully visible on small screens
- [ ] Buttons reachable without scrolling modal
- [ ] Progress bar visible during export
- [ ] Error messages don't overflow
- [ ] All icons render properly
- [ ] Touch targets >= 44px on mobile
- [ ] Modal doesn't go behind other UI elements (z-50)
- [ ] Modal backdrop doesn't interfere with interaction

#### 12. Performance Optimizations

1. **Modal Lazy Loading**: Only render when activeModal === 'export'
2. **Progress Debouncing**: Limit progress updates to 100ms intervals
3. **useMemo**: Memoize filename and path calculations
4. **useCallback**: Stable function references for handlers
5. **Motion Animation**: GPU-accelerated animations (scale, opacity)

#### 13. Browser/Platform Compatibility

**Dialog Opening:**

- macOS: native file picker via Electron dialog API
- Windows: native file picker via Electron dialog API
- Linux: native file picker via Electron dialog API

**Folder Opening:**

- macOS: `open` command via shell
- Windows: `explorer` command via shell
- Linux: `xdg-open` command via shell

### Implementation Order

1. **Create ExportModal component** - Build the UI
2. **Update store** - Add/enhance export state
3. **Create IPC handlers** - File picker, folder open, export
4. **Update preload script** - Expose APIs
5. **Integrate with Layout** - Add button and modal
6. **Testing** - Responsive design, error cases

### Quality Assurance

**Testing Strategy:**

- [ ] Test on 3+ screen sizes
- [ ] Test with 0-2000px file sizes
- [ ] Test with long filenames (50+ chars)
- [ ] Test error scenarios (no space, invalid path)
- [ ] Test modal animation smoothness
- [ ] Test keyboard navigation (Tab, Escape)
- [ ] Test button disabled states
- [ ] Verify no layout overflow

### Known Considerations

1. **File Picker Dialog**: Will block modal interaction (native dialog behavior)
2. **Progress Updates**: Stream from FFmpeg child process
3. **File Permissions**: May need error handling for permission denied
4. **Large Files**: Progress might freeze briefly on very large exports
5. **Cancellation**: FFmpeg kill process needs graceful handling (Phase 7.2)

## Phase 6 Implementation Plan

### Overview

Phase 6 focuses on adding interactive trim controls to the timeline. Users will be able to drag handles to set trim in/out points with real-time preview. Key priorities:

1. **UI Responsiveness**: All components stay within screen bounds
2. **No Layout Disruption**: Trim controls integrate seamlessly with existing layout
3. **Real-time Feedback**: Immediate visual feedback during interactions
4. **Keyboard Support**: I/O keys for quick trim point setting
5. **Cross-browser Compatibility**: Works on all platforms

### Detailed Tasks Breakdown

#### 1. Store Enhancement (editorStore.ts)

**Goal**: Add trim control state and actions

**New State Properties**:

- `trimStart: number` - Start trim point in seconds (already exists)
- `trimEnd: number` - End trim point in seconds (already exists)
- `isDragging: boolean` - Track if handle is being dragged (already exists)
- `activeHandle: 'start' | 'end' | null` - Which handle is being dragged
- `dragStartX: number` - Mouse X position when drag started
- `dragStartTrimValue: number` - Trim value when drag started

**New Actions**:

- `setActiveHandle(handle: 'start' | 'end' | null)` - Set active dragging handle
- `setDragStartValues(x: number, trimValue: number)` - Record drag start values
- `updateTrimFromDrag(newX: number, pixelsPerSecond: number, duration: number)` - Update trim based on drag
- `updateTrimStart(time: number)` - Set trim start with validation
- `updateTrimEnd(time: number)` - Set trim end with validation
- `resetTrim()` - Reset to full video (already exists)
- `setIsDragging(isDragging: boolean)` - Update dragging state (already exists)

**Validation Rules**:

- Trim start must be >= 0
- Trim end must be <= duration
- Trim start must be < (trimEnd - 0.05) minimum gap
- Trim end must be > (trimStart + 0.05) minimum gap

#### 2. Timeline Component Enhancement (Timeline.tsx)

**Goal**: Add draggable trim handles to timeline

**New Features**:

- **Trim Handle Rendering**:
  - Start handle at trimStart position
  - End handle at trimEnd position
  - Handles rendered as 8px wide rounded boxes
  - Blue color with hover state
  - Cursor: ew-resize

- **Handle Styling**:
  - Normal state: `bg-blue-400`
  - Hover state: `bg-blue-300`
  - Dragging state: `bg-blue-500`
  - Smooth transitions

- **Mouse Event Handlers**:
  - `onMouseDown` on handles: Start drag
  - Document-level `onMouseMove`: Update trim while dragging
  - Document-level `onMouseUp`: End drag

- **Visual Feedback During Drag**:
  - Handle color changes to indicate active state
  - Tooltip shows current time value
  - Trim region highlighting updates in real-time
  - Cursor changes to ew-resize during drag

#### 3. Trim Controls Component Creation (TrimControls.tsx)

**Goal**: Standalone component for trim point display and numeric input

**Location**: Positioned below Timeline, above future export button area

**Features**:

- **Trim Point Display**:
  - Start time: formatted (MM:SS)
  - Duration: formatted (MM:SS)
  - End time: formatted (MM:SS)
  - Responsive layout (stack on small screens)

- **Numeric Input Fields** (optional):
  - Manual input for precise trim points
  - Validation on input
  - Real-time format feedback

- **Reset Button**:
  - "Reset Trim" button with RotateCcw icon
  - Resets to full video duration
  - Hover effect

- **Trim Bar Visualization**:
  - Visual representation of trim region
  - Same styling as timeline trim region
  - Updates in real-time during drag

**Layout Structure**:

```
TrimControls
├── Header (flex between)
│   ├── Title
│   └── Reset Button
├── Trim Point Display
│   ├── Start Time
│   ├── Duration
│   └── End Time
└── Trim Bar
    ├── Trim Region (blue)
    ├── Start Handle
    └── End Handle
```

#### 4. Keyboard Shortcuts Integration (useKeyboardShortcuts.ts)

**Goal**: Add I/O key support for trim control

**Keyboard Mappings**:

- `I` - Set trim in point (start) to current playhead
- `O` - Set trim out point (end) to current playhead
- `R` - Reset trim to full video
- `Shift+I` - Move trim start forward 1 second
- `Shift+O` - Move trim end forward 1 second

**Implementation**:

- Use existing `react-hotkeys-hook`
- Trigger store actions on key press
- Provide visual feedback (toast or temporary highlight)

#### 5. UI Responsiveness Strategy

**Key Principles**:

1. **Container-Relative Sizing**: All trim controls size relative to container, not fixed values
2. **Minimum Heights**: Trim handles min 8px, controls min 60px total height
3. **Overflow Prevention**: All components use overflow-hidden and flex layout
4. **Screen-Aware**: Components detect and adapt to screen size changes

**Implementation Details**:

**Timeline Area** (Already responsive):

```typescript
// Timeline container with ResizeObserver
const timelineRef = useRef<HTMLDivElement>(null)
const [containerWidth, setContainerWidth] = useState(0)

// ResizeObserver tracks width changes
const resizeObserver = new ResizeObserver(() => {
  if (timelineRef.current) {
    setContainerWidth(timelineRef.current.offsetWidth)
  }
})
```

**Trim Handles Positioning**:

```typescript
// Handles positioned based on percentages and container width
const startHandleLeft = (trimStart / duration) * containerWidth
const endHandleLeft = (trimEnd / duration) * containerWidth

// Handles never go outside container
const constrainedStart = Math.max(0, Math.min(startHandleLeft, containerWidth - 8))
const constrainedEnd = Math.max(0, Math.min(endHandleLeft, containerWidth - 8))
```

**Drag Coordinate System**:

```typescript
// Convert mouse position to timeline coordinates
const rect = timelineRef.current.getBoundingClientRect()
const mouseX = e.clientX - rect.left + timelineScrollOffset

// Account for zoom and scroll
const time = mouseX / pixelsPerSecond
```

#### 6. Layout Integration Points

**Current Layout Structure**:

```
Layout (h-screen, flex)
├── Sidebar (w-80, overflow-hidden)
└── Main Content (flex-1, flex-col, overflow-hidden)
    ├── Welcome OR
    └── Editing View (flex-1, flex-col, p-8, gap-6)
        ├── PreviewPlayer (flex-1, min-h-0)
        └── Timeline (flex-shrink-0)
```

**New Layout With Trim Controls**:

```
Layout (h-screen, flex)
├── Sidebar (w-80, overflow-hidden)
└── Main Content (flex-1, flex-col, overflow-hidden)
    ├── Welcome OR
    └── Editing View (flex-1, flex-col, p-8, gap-6)
        ├── PreviewPlayer (flex-1, min-h-0)
        ├── Timeline (flex-shrink-0)
        └── TrimControls (flex-shrink-0) ← NEW
```

**Key Constraints**:

- PreviewPlayer: `flex-1, min-h-0` - Takes available space, can shrink to 0
- Timeline: `flex-shrink-0` - Fixed height (120px base + responsive padding)
- TrimControls: `flex-shrink-0` - Fixed height (~100px)
- Main Content: `overflow-hidden` - Prevents any overflow
- Gap: `gap-6` (24px) - Maintains spacing between sections

#### 7. Drag Handle Implementation Details

**Handle Structure**:

```typescript
// Start Handle
<div
  ref={startHandleRef}
  className="absolute top-0 w-2 h-full bg-blue-400 cursor-ew-resize hover:bg-blue-300 transition-colors"
  style={{
    left: `${(trimStart / duration) * 100}%`,
  }}
  onMouseDown={() => startDrag('start')}
/>

// End Handle
<div
  ref={endHandleRef}
  className="absolute top-0 w-2 h-full bg-blue-400 cursor-ew-resize hover:bg-blue-300 transition-colors"
  style={{
    left: `${(trimEnd / duration) * 100}%`,
  }}
  onMouseDown={() => startDrag('end')}
/>
```

**Drag Logic**:

```typescript
const startDrag = (handle: 'start' | 'end') => {
  setActiveHandle(handle)
  setIsDragging(true)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!activeHandle || !timelineRef.current) return

  const rect = timelineRef.current.getBoundingClientRect()
  const mouseX = e.clientX - rect.left + timelineScrollOffset
  const time = mouseX / pixelsPerSecond

  // Clamp time to valid range
  const clampedTime = Math.max(0, Math.min(time, duration))

  if (activeHandle === 'start') {
    // Ensure start < end with minimum gap
    const newStart = Math.min(clampedTime, trimEnd - 0.05)
    updateTrimStart(newStart)
  } else {
    // Ensure end > start with minimum gap
    const newEnd = Math.max(clampedTime, trimStart + 0.05)
    updateTrimEnd(newEnd)
  }
}

const handleMouseUp = () => {
  setActiveHandle(null)
  setIsDragging(false)
}
```

### Responsive Design Checklist

- [ ] Trim handles stay within timeline container bounds
- [ ] Handles scale appropriately with zoom levels (0.5x - 10x)
- [ ] Handles remain visible at all zoom levels (min 8px width)
- [ ] Drag works correctly with horizontal scroll at high zoom
- [ ] Touch events work on tablets/touch devices (future enhancement)
- [ ] Small screen (<768px): Stack controls vertically
- [ ] Medium screen (768-1024px): Horizontal layout with adjusted spacing
- [ ] Large screen (>1024px): Full layout with all features
- [ ] No UI elements extend beyond viewport
- [ ] PreviewPlayer maintains aspect ratio
- [ ] Sidebar doesn't overflow with long filenames
- [ ] Timeline scrollbar only appears when needed

### Visual Design Specifications

**Trim Handles**:

- Width: 8px (responsive, min 6px, max 12px)
- Color: `#60a5fa` (blue-400)
- Hover: `#93c5fd` (blue-300)
- Active: `#3b82f6` (blue-500)
- Radius: 0 (sharp to align with timeline)

**Trim Region**:

- Background: `rgba(59, 130, 246, 0.3)` (blue with transparency)
- Border: 1px solid `#3b82f6` (blue-500)
- Transitions: 100ms ease-in-out

**Tooltip**:

- Background: `rgba(0, 0, 0, 0.8)` (dark)
- Text: white
- Padding: 4px 8px
- Border radius: 4px
- Font size: 12px
- Offset from handle: 4px

**TrimControls Component**:

- Background: `#1f2937` (gray-800)
- Border: 1px solid `#374151` (gray-700)
- Padding: 16px
- Border radius: 8px
- Shadow: 0 4px 6px rgba(0, 0, 0, 0.1)

### Performance Optimizations

1. **Debounce Drag Updates**: Limit update frequency to 60fps (16ms intervals)
2. **CSS Transforms**: Use `left` property (GPU accelerated) for handle positioning
3. **useMemo**: Memoize pixelsPerSecond and time marker calculations
4. **Event Delegation**: Single mousemove listener on document instead of per-handle
5. **ResizeObserver**: Throttle resize updates to avoid excessive re-renders
6. **Avoid Re-renders**: Use Zustand selectors to return stable references

### Testing Strategy

**Unit Tests**:

- Trim point validation logic
- Drag coordinate calculations
- Time formatting

**Component Tests**:

- Trim handles render at correct positions
- Drag updates trim values correctly
- Keyboard shortcuts trigger correct actions
- Reset button resets trim values

**Integration Tests**:

- Timeline and TrimControls work together
- Store updates propagate to UI
- Keyboard shortcuts integrate with Zustand

**Manual Testing**:

- Test on 3 screen sizes (small, medium, large)
- Test zoom levels (0.5x, 1x, 5x, 10x)
- Test keyboard shortcuts with different trim values
- Verify no layout overflow at any size
- Test drag edge cases (start > end, min gap, etc.)

### Known Considerations

1. **Minimum Trim Gap**: 0.05 seconds (50ms) prevents zero-duration trims
2. **Scroll Offset**: Must account for timeline scroll when zoomed
3. **Touch Events**: Not in MVP but important for future tablet support
4. **Snap to Frame**: Deferred to future phase but architecture allows easy addition
5. **Performance at 10x Zoom**: May need debouncing if drag is too frequent

## Active Decisions and Considerations

### 1. Timeline Responsiveness Strategy

- **Container-based Sizing**: Uses ResizeObserver for responsive width
- **Minimum Heights**: Fixed height of 120px for playback area
- **Flexible Layout**: Main flex layout with timeline as flex-shrink-0
- **Overflow Management**: Scroll within timeline, nothing goes outside bounds

### 2. Playhead Synchronization

- **Single Source of Truth**: Store's playhead is canonical
- **Bi-directional Sync**:
  - Video player → updates store → timeline reacts
  - Timeline click/drag → updates store → video reacts
- **No Local State**: Timeline never maintains its own playhead

### 3. Zoom & Pan Implementation

- **Zoom Levels**: 0.5x to 10x (safely clamped)
- **Pan**: Horizontal scroll when zoomed beyond container width
- **Automatic Markers**: Interval adjusts based on duration and zoom
- **Minimum Pixels**: 40px per second for usability, 60px between markers

### 4. Performance Optimizations

- **useMemo**: Time markers, pixelsPerSecond, and totalTimelineWidth
- **CSS Transforms**: Playhead uses left property (GPU accelerated)
- **Event Delegation**: Single click handler on track, delegated to items
- **Debounced Resize**: ResizeObserver only updates on actual size changes

## Phase 1: FFmpeg Integration ✅ COMPLETE

- ✅ FFmpeg binary management
- ✅ FFmpeg operations (trim, export, metadata)
- ✅ IPC integration with main process
- ✅ Code structure and organization

## Phase 2: State Management ✅ COMPLETE

- ✅ Zustand store implementation
- ✅ Custom hooks for various features
- ✅ State persistence with localStorage
- ✅ Optimized selector hooks

## Phase 3: Import System ✅ COMPLETE

- ✅ File dialog integration
- ✅ ImportManager component
- ✅ MediaLibrary component
- ✅ App integration

## Phase 4: Preview Player ✅ COMPLETE

- ✅ HTML5 video player with custom controls
- ✅ Play/pause, seek, volume, skip controls
- ✅ Keyboard shortcuts
- ✅ Fullscreen support
- ✅ Trim region visualization

## Phase 5: Timeline UI ✅ COMPLETE

### 1. Store Enhancements ✅

- ✅ Added `timelineScrollOffset` state
- ✅ Added `setZoomLevel` action (0.5x - 10x clamped)
- ✅ Added `setTimelineScrollOffset` action
- ✅ Updated `useTimeline` selector with new properties
- ✅ Created `useTimelineActions` selector hook
- ✅ Reset zoom/scroll when selecting new clip

### 2. Timeline Component ✅

- ✅ Responsive container using ResizeObserver
- ✅ Responsive playback area (120px fixed height)
- ✅ Time ruler with dynamic markers (1s to 1m intervals)
- ✅ Playhead synchronized with video player
- ✅ Trim region visualization with dimmed areas
- ✅ Playhead tooltip showing current time

### 3. Interactive Features ✅

- ✅ Click-to-seek: Click anywhere on timeline to jump to time
- ✅ Drag playhead: Drag to scrub through video
- ✅ Zoom in/out: Buttons and Ctrl+Scroll wheel
- ✅ Pan/scroll: Horizontal scroll when zoomed
- ✅ Keyboard hints: Tip text at bottom

### 4. Visual Design ✅

- ✅ Gradient background (gray-800 to gray-900)
- ✅ Blue trim region highlight with borders
- ✅ Red playhead with circular handle
- ✅ Hover effects on controls and playhead
- ✅ Smooth animations (Framer Motion)
- ✅ Time markers and labels
- ✅ Full compatibility with dark theme

### 5. Responsive Features ✅

- ✅ Container width tracked with ResizeObserver
- ✅ Automatic marker interval adjustment
- ✅ Minimum pixels per second enforced (40px)
- ✅ Zoom controls with min/max limits
- ✅ Fixed sidebar (w-80) with content scrolling
- ✅ Main area flex layout ensuring nothing goes outside bounds
- ✅ Proper overflow handling (overflow-x-auto only)

## Implementation Highlights

### Responsiveness Strategy

```typescript
// Container width tracked dynamically
const [containerWidth, setContainerWidth] = useState(0)

useEffect(() => {
  const resizeObserver = new ResizeObserver(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)
    }
  })
  if (containerRef.current) {
    resizeObserver.observe(containerRef.current)
  }
  return () => resizeObserver.disconnect()
}, [])

// Base pixels per second (fits entire video at 1x zoom)
const basePixelsPerSecond = containerWidth / duration

// Zoom multiplier applied to base
const pixelsPerSecond = basePixelsPerSecond * zoomLevel
```

### Coordinate System

```typescript
// Click position relative to track, accounting for scroll
const rect = trackRef.current.getBoundingClientRect()
const clickX = e.clientX - rect.left + timelineScrollOffset
const time = clickX / pixelsPerSecond
```

### Zoom with Boundary Protection

```typescript
const setZoomLevel = (zoomLevel: number) =>
  set({
    zoomLevel: Math.max(0.5, Math.min(10, zoomLevel))
  })
```

## Bug Fixes Applied

### 1. Infinite Loop Bug (Fixed)

**Problem**: React error "Maximum update depth exceeded" when uploading videos.

**Root Cause**: Zustand selector hooks were creating new objects on every render:

```typescript
// ❌ BAD - Creates new object every render, causes re-render loop
const useTimelineActions = () =>
  useEditorStore((state) => ({
    setPlayhead: state.setPlayhead,
    setZoomLevel: state.setZoomLevel
    // ... more properties
  }))
```

**Solution**: Return stable references by using individual selectors:

```typescript
// ✅ GOOD - Stable references, no infinite loop
const useTimelineActions = () => {
  const setPlayhead = useEditorStore((state) => state.setPlayhead)
  const setZoomLevel = useEditorStore((state) => state.setZoomLevel)

  return { setPlayhead, setZoomLevel }
}
```

**Applied To**:

- `useTimeline()` - State selector
- `usePlayback()` - State selector
- `useTrim()` - State selector
- `useExport()` - State selector
- `useUI()` - State selector
- `useMediaActions()` - Action selector
- `usePlaybackActions()` - Action selector
- `useTrimActions()` - Action selector
- `useTimelineActions()` - Action selector
- `useExportActions()` - Action selector
- `useUIActions()` - Action selector

### 2. Responsive Timeline Fit-to-Screen (Fixed)

**Problem**: Timeline was scrollable even for 4-minute videos due to enforced 40px/second minimum.

**Root Cause**:

```typescript
// ❌ BAD - Minimum 40px/sec makes short videos too wide
// 4 minutes = 240 seconds
// 240 × 40 = 9,600px (only ~1,200px available!)
const pixelsPerSecond = Math.max(40, (containerWidth * zoomLevel) / duration)
```

**Solution**: Calculate base fit-to-screen, then apply zoom multiplier:

```typescript
// ✅ GOOD - Entire video fits at 1x zoom
const basePixelsPerSecond = containerWidth / duration
// For 4-min video: 1,200 / 240 = 5 px/sec
// Total width: 240 × 5 = 1,200px (fits perfectly!)

const pixelsPerSecond = basePixelsPerSecond * zoomLevel
// At 2x zoom: 5 × 2 = 10 px/sec (2,400px, needs scroll)
// At 0.5x: 5 × 0.5 = 2.5 px/sec (600px, half screen)
```

**Behavior**:

- **1x zoom (default)**: Entire video visible without scrolling
- **2x zoom**: Timeline 2× larger, horizontal scroll appears
- **10x zoom**: Fine-grained scrubbing, scroll through timeline
- **Auto-reset**: Selecting new video resets to 1x zoom

## Layout Structure

```
Layout (full screen flex)
├── Sidebar (w-80, overflow-hidden)
│   └── Scrollable content
└── Main Content (flex-1, overflow-hidden, flex flex-col)
    ├── Video Welcome OR
    └── Editing View (flex-1, flex flex-col, overflow-hidden, gap-6)
        ├── PreviewPlayer (flex-1, min-h-0)
        └── Timeline (flex-shrink-0)
```

## Next Steps (Phase 6)

### Trim Controls Implementation

- Create draggable handles for trim start/end
- Real-time preview as handles are dragged
- Keyboard shortcuts (I/O keys for in/out points)
- Visual feedback during drag
- Snap-to-frame capability (optional)
- Integration with timeline

## Current Blockers

- None - Timeline UI fully complete and functional

## Performance Notes

- ✅ ResizeObserver for responsive sizing (no polling)
- ✅ useMemo for expensive calculations
- ✅ Efficient event handlers with proper cleanup
- ✅ GPU-accelerated transforms (CSS left property)
- ✅ Minimal re-renders via proper hooks

## Development Environment

- **OS**: macOS (M2)
- **Node.js**: 22.11.0
- **Package Manager**: npm
- **IDE**: Cursor with TypeScript support
- **Git**: Version control ready

## Code Quality Status

- **TypeScript**: Strict mode with proper typing
- **ESLint**: All new code passes linting
- **Component Design**: Modular and testable
- **Code Style**: Single quotes, no semicolons
- **Documentation**: Comprehensive JSDoc comments
- **Responsiveness**: Fully responsive, nothing goes outside bounds
