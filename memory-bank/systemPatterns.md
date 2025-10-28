# ClipForge System Patterns

## Architecture Overview

ClipForge uses Electron's multi-process architecture with a modern React frontend and Node.js backend for video processing.

### Process Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Electron Main Process (Node.js)                        │
│  ├── FFmpeg Integration                                 │
│  ├── IPC Handlers                                       │
│  ├── File System Operations                             │
│  └── Video Processing                                   │
├─────────────────────────────────────────────────────────┤
│  Electron Renderer Process (React)                      │
│  ├── React Components                                   │
│  ├── Zustand State Management                           │
│  ├── ShadCN/UI Components                              │
│  └── Video Player (HTML5)                              │
└─────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Electron + React + Vite

- **Rationale**: Cross-platform desktop development with modern web technologies
- **Benefits**: Single codebase, native performance, modern tooling
- **Trade-offs**: Larger bundle size, but acceptable for desktop app

### 2. FFmpeg Integration

- **Approach**: Bundled static binaries for all platforms
- **Rationale**: Zero external dependencies, offline functionality
- **Implementation**: Platform detection + child process execution

### 3. State Management: Zustand

- **Rationale**: Lightweight, TypeScript-friendly, simple API
- **Benefits**: No boilerplate, easy testing, good performance
- **Pattern**: Single store with typed actions

### 4. UI Framework: ShadCN/UI + Tailwind

- **Rationale**: Professional components with utility-first styling
- **Benefits**: Consistent design system, accessibility, customization
- **Pattern**: Component composition with utility classes

### 5. IPC Communication

- **Pattern**: Type-safe IPC with contextBridge
- **Security**: Context isolation enabled, node integration disabled
- **Implementation**: Preload script exposes safe APIs

## Component Architecture

### Frontend Components

```
App
├── Layout
│   ├── ImportManager (file picker + drag/drop)
│   ├── MediaLibrary (clip list)
│   ├── PreviewPlayer (video playback)
│   ├── Timeline (visual timeline + playhead)
│   ├── TrimControls (draggable handles)
│   └── ExportModal (export UI + progress)
└── UI Components (ShadCN/UI)
```

### State Management Pattern

```typescript
interface EditorStore {
  // Immutable state
  clips: VideoClip[]
  selectedClip: VideoClip | null

  // Derived state
  duration: number
  trimDuration: number

  // Actions (pure functions)
  addClip: (clip: VideoClip) => void
  setTrimPoints: (start: number, end: number) => void
}
```

## Design Patterns

### 1. Custom Hooks Pattern

- **useVideoPlayer**: Video playback logic
- **useKeyboardShortcuts**: Keyboard event handling
- **useExport**: Export workflow management

### 2. Component Composition

- **ShadCN/UI**: Base components
- **Custom Components**: Business logic components
- **Layout Components**: Structure and positioning

### 3. Error Handling

- **React Error Boundaries**: UI error recovery
- **IPC Error Handling**: Graceful degradation
- **FFmpeg Error Handling**: User-friendly messages

### 4. Performance Optimization

- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Expensive calculations
- **Debounced Updates**: Smooth interactions

## File Organization

```
src/
├── components/          # React components
│   ├── ui/             # ShadCN/UI components
│   ├── ImportManager.tsx
│   ├── PreviewPlayer.tsx
│   └── ...
├── hooks/              # Custom React hooks
├── stores/             # Zustand stores
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── lib/                # Shared libraries
```

## Security Patterns

- **Context Isolation**: Renderer process isolated from Node.js
- **Preload Scripts**: Controlled API exposure
- **Input Validation**: All user inputs validated
- **File Path Sanitization**: Prevent directory traversal

## Testing Strategy

- **Unit Tests**: Utility functions and hooks
- **Component Tests**: React components with Testing Library
- **Integration Tests**: IPC communication
- **E2E Tests**: Full user workflows

## Performance Patterns

- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Bundle optimization
- **Memory Management**: Proper cleanup of resources
- **Debouncing**: Smooth user interactions
