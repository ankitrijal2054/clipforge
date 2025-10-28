# ClipForge Technical Context

## Technology Stack

### **Core Framework**

- **Electron**: 38.1.2 - Cross-platform desktop application framework
- **React**: 19.2.0 - UI library with modern hooks and concurrent features
- **TypeScript**: 5.9.2 - Type-safe JavaScript with strict mode
- **Vite**: 7.1.6 - Fast build tool and development server

### **UI/UX Framework**

- **Tailwind CSS**: 3.4.0 - Utility-first CSS framework
- **ShadCN/UI**: Modern component library with Radix UI primitives
- **Framer Motion**: 12.23.24 - Animation library for smooth transitions
- **Radix UI**: Accessible component primitives (Dialog, Progress, Slider, etc.)

### **State Management**

- **Zustand**: 5.0.8 - Lightweight state management with optimized selectors
- **React Hooks**: Custom hooks for feature-specific state management
- **Local Storage**: Persistent state with automatic serialization

### **Video Processing**

- **FFmpeg**: Cross-platform video processing engine
- **Platform Detection**: Automatic binary selection based on OS/architecture
- **Progress Tracking**: Real-time export progress with IPC communication

### **Build & Development**

- **Electron Vite**: 4.0.1 - Vite integration for Electron
- **Electron Builder**: 25.1.8 - Cross-platform packaging and distribution
- **ESLint**: 9.36.0 - Code linting with React and TypeScript rules
- **Prettier**: 3.6.2 - Code formatting and style consistency

## Development Environment

### **System Requirements**

- **Node.js**: 18.x or higher (tested with 22.11.0)
- **npm**: 9.x or higher
- **Git**: Version control
- **Platform**: macOS (M2), Windows 10+, Ubuntu 18.04+

### **IDE Configuration**

- **Cursor**: Primary IDE with TypeScript support
- **Extensions**: ESLint, Prettier, TypeScript, React
- **Settings**: Auto-format on save, strict TypeScript checking

### **Development Workflow**

```bash
# Development
npm run dev          # Start development server with hot reload
npm run typecheck    # TypeScript compilation check
npm run lint         # ESLint code quality check
npm run format       # Prettier code formatting

# Production
npm run build        # Build for production
npm run build:mac    # Build macOS app
npm run build:win    # Build Windows app
npm run build:linux  # Build Linux app
npm run build:all    # Build all platforms
```

## Architecture Overview

### **Main Process (Node.js)**

```
src/main/
├── index.ts              # Electron app initialization
├── ffmpeg/
│   ├── index.ts          # FFmpeg binary management
│   ├── metadata.ts       # Video metadata extraction
│   ├── operations.ts     # Video processing operations
│   └── platform.ts       # Platform detection
└── ipc/
    ├── index.ts          # IPC handler registration
    ├── videoHandlers.ts  # Video-related IPC handlers
    └── exportHandlers.ts # Export-related IPC handlers
```

### **Renderer Process (React)**

```
src/renderer/src/
├── components/
│   ├── Layout.tsx        # Main layout component
│   ├── ImportManager.tsx # Video import functionality
│   ├── MediaLibrary.tsx  # Video library management
│   ├── PreviewPlayer.tsx # Video playback component
│   ├── Timeline.tsx      # Timeline with trim controls
│   └── ExportModal.tsx   # Export configuration modal
├── hooks/
│   ├── useVideoPlayer.ts # Video player controls
│   ├── useExport.ts      # Export functionality
│   └── useKeyboardShortcuts.ts # Keyboard shortcuts
└── assets/
    └── icon.png          # App icon for UI
```

### **State Management**

```
src/stores/
├── editorStore.ts        # Main Zustand store
├── index.ts              # Store exports
└── persistence.ts        # State persistence utilities
```

### **Type Definitions**

```
src/types/
├── electron.d.ts         # Electron API types
├── store.ts              # Store state types
└── video.ts              # Video processing types
```

## Build Configuration

### **Electron Vite Config**

```typescript
// electron.vite.config.ts
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    css: {
      postcss: './postcss.config.js'
    }
  }
})
```

### **Electron Builder Config**

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

asarUnpack:
  - resources/**
  - out/renderer/assets/**
```

### **TypeScript Configuration**

```json
// tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.web.json" }]
}
```

## FFmpeg Integration

### **Binary Management**

- **Location**: `resources/ffmpeg/`
- **Platform Detection**: Automatic based on `process.platform` and `process.arch`
- **Binaries Required**:
  - macOS: `ffmpeg-mac-arm64`, `ffmpeg-mac-x64`
  - Windows: `ffmpeg-win.exe`
  - Linux: `ffmpeg-linux`

### **Setup Process**

```bash
# Navigate to FFmpeg directory
cd resources/ffmpeg/

# Follow platform-specific instructions in README.md
# Download required binaries for your platform
```

### **Usage Pattern**

```typescript
// Platform-specific binary selection
const getFFmpegPath = (): string => {
  const platform = process.platform
  const arch = process.arch

  if (platform === 'darwin') {
    return arch === 'arm64' ? 'ffmpeg-mac-arm64' : 'ffmpeg-mac-x64'
  }
  if (platform === 'win32') return 'ffmpeg-win.exe'
  if (platform === 'linux') return 'ffmpeg-linux'

  throw new Error(`Unsupported platform: ${platform}`)
}
```

## Performance Optimizations

### **State Management**

- **Optimized Selectors**: Individual selectors to prevent unnecessary re-renders
- **Memoization**: `useMemo` for expensive calculations
- **Debounced Updates**: 60fps limit for drag operations
- **Event Delegation**: Single event listeners for multiple elements

### **Rendering**

- **CSS Transforms**: GPU-accelerated animations
- **ResizeObserver**: Efficient container size tracking
- **Lazy Loading**: Modal components only render when needed
- **Virtual Scrolling**: For large media libraries (future enhancement)

### **Video Processing**

- **Async Operations**: Non-blocking video processing
- **Progress Streaming**: Real-time progress updates via IPC
- **Memory Management**: Proper cleanup of video elements
- **Error Handling**: Graceful failure recovery

## Security Considerations

### **Context Isolation**

- **Preload Scripts**: Secure API exposure via `contextBridge`
- **No Node.js Access**: Renderer process isolated from Node.js APIs
- **Input Validation**: All user inputs validated before processing
- **File Path Sanitization**: Secure file path handling

### **File System Security**

- **Sandboxed Access**: Limited file system access through IPC
- **Path Validation**: All file paths validated before use
- **Permission Checks**: Proper error handling for file access issues

## Cross-Platform Compatibility

### **macOS**

- **Target**: macOS 10.12+
- **Architecture**: ARM64 (Apple Silicon) and x64 (Intel)
- **Build**: DMG and ZIP packages
- **Code Signing**: Ready for notarization and App Store

### **Windows**

- **Target**: Windows 10+
- **Architecture**: x64
- **Build**: NSIS installer
- **Code Signing**: Ready for Microsoft Store

### **Linux**

- **Target**: Ubuntu 18.04+ (AppImage), Snap, DEB
- **Architecture**: x64
- **Build**: AppImage, Snap, DEB packages
- **Distribution**: Ready for package repositories

## Development Dependencies

### **Core Dependencies**

```json
{
  "electron": "^38.1.2",
  "react": "^19.2.0",
  "typescript": "^5.9.2",
  "vite": "^7.1.6",
  "electron-vite": "^4.0.1",
  "electron-builder": "^25.1.8"
}
```

### **UI Dependencies**

```json
{
  "tailwindcss": "^3.4.0",
  "framer-motion": "^12.23.24",
  "zustand": "^5.0.8",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-progress": "^1.1.7",
  "@radix-ui/react-slider": "^1.3.6"
}
```

### **Development Dependencies**

```json
{
  "eslint": "^9.36.0",
  "prettier": "^3.6.2",
  "@types/node": "^22.18.12",
  "@types/react": "^19.2.2",
  "@types/react-dom": "^19.2.2"
}
```

## Build Output

### **Development Build**

```
out/
├── main/
│   └── index.js          # Main process bundle
├── preload/
│   └── index.js          # Preload script bundle
└── renderer/
    ├── index.html        # Renderer HTML
    └── assets/
        ├── index-*.css   # Styles bundle
        └── index-*.js    # JavaScript bundle
```

### **Production Build**

```
dist/
├── clipforge-1.0.0.dmg              # macOS DMG
├── ClipForge-1.0.0-arm64-mac.zip   # macOS ZIP
├── ClipForge-1.0.0-setup.exe       # Windows installer
├── ClipForge-1.0.0.AppImage        # Linux AppImage
├── ClipForge-1.0.0.snap            # Linux Snap
└── ClipForge-1.0.0.deb             # Linux DEB
```

## Quality Assurance

### **Code Quality**

- **TypeScript**: Strict mode with comprehensive type checking
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Automatic code formatting
- **Git Hooks**: Pre-commit validation (future enhancement)

### **Testing Strategy**

- **Manual Testing**: Comprehensive feature testing across platforms
- **Build Testing**: Production build verification
- **Performance Testing**: Launch time and UI responsiveness
- **Cross-Platform Testing**: Consistent behavior across platforms

### **Documentation**

- **README**: Comprehensive project documentation
- **Code Comments**: JSDoc comments for complex functions
- **Type Definitions**: Complete TypeScript type coverage
- **Build Guides**: Platform-specific build instructions

## Future Technical Considerations

### **Potential Enhancements**

- **GPU Acceleration**: Hardware-accelerated video processing
- **Web Workers**: Background video processing
- **Electron Updates**: Regular framework updates
- **Performance Monitoring**: Real-time performance metrics
- **Automated Testing**: Unit and integration test suite

### **Scalability**

- **Modular Architecture**: Easy to add new features
- **Plugin System**: Extensible functionality (future)
- **Multi-threading**: Background processing capabilities
- **Memory Optimization**: Efficient resource management

The technical foundation of ClipForge is solid, modern, and well-positioned for future growth and enhancement.
