# ClipForge Technical Context

## Technology Stack

### Frontend (Renderer Process)

- **React 19.2.0**: Modern React with hooks and concurrent features
- **TypeScript 5.9.2**: Type safety and developer experience
- **Vite 7.1.6**: Fast build tool and dev server
- **Tailwind CSS 3.4.0**: Utility-first CSS framework
- **ShadCN/UI**: Professional component library
- **Framer Motion 12.23.24**: Smooth animations and gestures
- **Zustand 5.0.8**: Lightweight state management
- **Lucide React 0.548.0**: Icon system

### Backend (Main Process)

- **Electron 38.1.2**: Cross-platform desktop framework
- **Node.js**: Runtime for main process
- **FFmpeg**: Video processing (bundled static binaries)
- **child_process**: FFmpeg execution
- **fs/promises**: File system operations

### Build & Development

- **electron-vite 4.0.1**: Electron + Vite integration
- **electron-builder 25.1.8**: Application packaging
- **ESLint 9.36.0**: Code linting
- **Prettier 3.6.2**: Code formatting
- **PostCSS 8.4.31**: CSS processing

## Development Setup

### Prerequisites

- Node.js 22.11.0+ (Note: Some packages require 20.19.0+)
- npm 10.9.0+
- Git

### Project Structure

```
clipforge/
├── src/
│   ├── components/          # React components
│   │   └── ui/             # ShadCN/UI components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript definitions
│   ├── lib/                # Shared libraries
│   ├── main/               # Electron main process
│   ├── preload/            # Electron preload scripts
│   └── renderer/           # React renderer process
├── resources/              # FFmpeg binaries
├── build/                  # Build assets
└── out/                    # Build output
```

### Configuration Files

- **package.json**: Dependencies and scripts
- **electron.vite.config.ts**: Vite configuration
- **electron-builder.yml**: Packaging configuration
- **tailwind.config.js**: Tailwind CSS configuration
- **postcss.config.js**: PostCSS configuration
- **tsconfig.json**: TypeScript configuration
- **components.json**: ShadCN/UI configuration

## Dependencies

### Core Dependencies

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "zustand": "^5.0.8",
  "framer-motion": "^12.23.24",
  "lucide-react": "^0.548.0",
  "react-hook-form": "^7.65.0",
  "react-hotkeys-hook": "^5.2.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1"
}
```

### Development Dependencies

```json
{
  "electron": "^38.1.2",
  "electron-vite": "^4.0.1",
  "electron-builder": "^25.1.8",
  "typescript": "^5.9.2",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.31",
  "autoprefixer": "^10.4.16",
  "postcss-nesting": "^13.0.2",
  "tailwindcss-animate": "^1.0.7"
}
```

## Build System

### Development

```bash
npm run dev          # Start development server
npm run typecheck    # Type checking
npm run lint         # Code linting
npm run format       # Code formatting
```

### Production

```bash
npm run build        # Build application
npm run build:mac    # Build for macOS
npm run build:win    # Build for Windows
npm run build:linux  # Build for Linux
```

## Platform Support

### Primary Platform

- **macOS**: Apple Silicon (M1/M2/M3) and Intel
- **Testing**: M2 Mac (primary development platform)

### Secondary Platforms

- **Windows**: Windows 10+
- **Linux**: Ubuntu 20.04+ or equivalent

### FFmpeg Binaries

- `ffmpeg-mac-arm64`: macOS Apple Silicon
- `ffmpeg-mac-x64`: macOS Intel
- `ffmpeg-win.exe`: Windows
- `ffmpeg-linux`: Linux x64

## Performance Requirements

### Application Performance

- **Launch Time**: < 5 seconds cold start
- **UI Responsiveness**: < 16ms interaction latency
- **Video Playback**: 60fps smooth playback
- **Memory Usage**: Stable during extended use

### Bundle Size

- **Target**: ~200MB with FFmpeg binaries
- **Optimization**: Tree shaking, code splitting
- **Assets**: Optimized images and icons

## Security Considerations

### Electron Security

- **Context Isolation**: Enabled
- **Node Integration**: Disabled in renderer
- **Preload Scripts**: Controlled API exposure
- **CSP**: Content Security Policy configured

### File System Security

- **Path Validation**: All file paths validated
- **Input Sanitization**: User inputs sanitized
- **FFmpeg Execution**: Sandboxed child processes

## Development Workflow

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and TypeScript
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit linting and formatting

### Testing Strategy

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: IPC communication
- **E2E Tests**: Playwright for full workflows
- **Manual Testing**: Cross-platform verification

## Known Issues

### Node.js Version Compatibility

- Some packages require Node.js 20.19.0+ but we're using 22.11.0
- Engine warnings appear but don't affect functionality
- Consider upgrading to Node.js 20.19.0+ for full compatibility

### Platform-Specific Considerations

- **macOS**: Gatekeeper may block unsigned apps
- **Windows**: Windows Defender may flag unsigned executables
- **Linux**: AppImage requires execute permissions

## Future Considerations

### Phase 2+ Enhancements

- Auto-updater integration
- Plugin architecture
- Cloud sync capabilities
- Advanced video effects
- Multi-clip timeline
- Screen recording integration
