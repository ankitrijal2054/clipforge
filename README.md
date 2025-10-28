# ClipForge 🎬

**Professional Desktop Video Editor** - Trim, edit, and export videos with ease

ClipForge is a modern, cross-platform desktop video editor built with Electron, React, and TypeScript. It provides an intuitive interface for video trimming, preview, and export with professional-grade performance.

## ✨ Features

### 🎥 **Video Import & Management**

- **Drag & Drop Support**: Simply drag video files into the sidebar
- **Browse Button**: Click to select videos from your file system
- **Multi-Format Support**: MP4, MOV, WebM, AVI, MKV, and more
- **Media Library**: Organized view of all imported videos

### 🎬 **Professional Video Editing**

- **Real-time Preview**: High-quality video playback with controls
- **Precise Trimming**: Frame-accurate start/end point selection
- **Timeline Interface**: Visual timeline with scrubber for easy navigation
- **Keyboard Shortcuts**: Efficient editing with hotkeys

### 🚀 **Export & Processing**

- **Multiple Export Formats**: MP4, MOV, WebM, AVI, MKV
- **Quality Settings**: Customizable resolution and bitrate
- **Progress Tracking**: Real-time export progress with cancellation
- **FFmpeg Integration**: Professional video processing engine

### 🎨 **Modern UI/UX**

- **Dark Theme**: Professional dark interface
- **Responsive Design**: Adapts to different screen sizes
- **Smooth Animations**: Framer Motion powered transitions
- **Intuitive Controls**: Clean, modern interface design

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Desktop**: Electron 38
- **UI Components**: Radix UI, ShadCN/UI
- **State Management**: Zustand
- **Video Processing**: FFmpeg
- **Build Tool**: Electron Vite
- **Styling**: Tailwind CSS with custom animations

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: For cloning the repository

### Platform-Specific Requirements

#### macOS

- macOS 10.12 or later
- Xcode Command Line Tools (for native modules)

#### Windows

- Windows 10 or later
- Visual Studio Build Tools (for native modules)

#### Linux

- Ubuntu 18.04+ or equivalent
- Build essentials package

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ankitrijal2054/clipforge.git
cd clipforge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup FFmpeg Binaries

```bash
# Navigate to FFmpeg directory
cd resources/ffmpeg/

# Follow the platform-specific instructions in README.md
# Download the required binaries for your platform
```

### 4. Development Mode

```bash
npm run dev
```

This will start the development server with hot reload enabled.

## 🏗️ Building for Production

### Quick Build (All Platforms)

```bash
# Build for all platforms
npm run build:all
```

### Platform-Specific Builds

#### macOS

```bash
# Unsigned build (for testing)
npm run build:mac

# Signed build (for distribution)
npm run build:mac:signed

# DMG only
npm run build:mac:dmg
```

**Output**: `dist/clipforge-1.0.0.dmg` and `dist/ClipForge-1.0.0-arm64-mac.zip`

#### Windows

```bash
npm run build:win
```

**Output**: `dist/ClipForge-1.0.0-setup.exe`

#### Linux

```bash
npm run build:linux
```

**Output**:

- `dist/ClipForge-1.0.0.AppImage`
- `dist/ClipForge-1.0.0.snap`
- `dist/ClipForge-1.0.0.deb`

### Build Scripts Reference

| Script                     | Description                |
| -------------------------- | -------------------------- |
| `npm run dev`              | Start development server   |
| `npm run build`            | Build for production       |
| `npm run build:mac`        | Build macOS app (unsigned) |
| `npm run build:mac:signed` | Build macOS app (signed)   |
| `npm run build:win`        | Build Windows app          |
| `npm run build:linux`      | Build Linux app            |
| `npm run build:all`        | Build for all platforms    |
| `npm run typecheck`        | Run TypeScript checks      |
| `npm run lint`             | Run ESLint                 |

## 📁 Project Structure

```
clipforge/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── ffmpeg/          # Video processing utilities
│   │   └── ipc/             # IPC handlers
│   ├── preload/             # Electron preload scripts
│   ├── renderer/            # React frontend
│   │   └── src/
│   │       ├── components/  # React components
│   │       ├── hooks/       # Custom React hooks
│   │       └── assets/      # Static assets
│   ├── stores/              # Zustand state management
│   └── types/               # TypeScript type definitions
├── build/                   # Build resources (icons, etc.)
├── resources/               # FFmpeg binaries (download required)
│   └── ffmpeg/             # Platform-specific FFmpeg binaries
├── dist/                    # Built applications
└── out/                     # Development build output
```

## 🎯 Key Components

### **ImportManager**

- Handles video file import via drag & drop or file browser
- Validates file formats and provides user feedback
- Manages the media library state

### **PreviewPlayer**

- Real-time video playback with controls
- Frame-accurate scrubbing and navigation
- Keyboard shortcut support

### **Timeline**

- Visual timeline interface for trimming
- Start/end point selection
- Precise frame control

### **ExportModal**

- Export configuration and progress tracking
- Multiple format and quality options
- Real-time progress updates

## 🔧 Configuration

### Electron Builder Configuration

The app is configured in `electron-builder.yml`:

- **App ID**: `com.clipforge.app`
- **Product Name**: `ClipForge`
- **Icons**: Multi-platform icon support (.icns, .ico, .png)
- **Code Signing**: Configurable for distribution

### FFmpeg Integration

FFmpeg binaries are required for video processing. Download and setup instructions are provided in `resources/ffmpeg/README.md`.

**Required Binaries:**

- **macOS**: ARM64 and x64 support
- **Windows**: x64 executable
- **Linux**: x64 executable

**Setup Instructions:**

```bash
# Navigate to FFmpeg directory
cd resources/ffmpeg/

# Follow the platform-specific instructions in README.md
# The app will automatically detect and use the correct binary
```

## 🏗️ Build Guide

### Quick Start

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for all platforms
npm run build:all
```

### Platform-Specific Builds

#### macOS

```bash
# Unsigned build (for testing)
npm run build:mac

# Signed build (for distribution)
npm run build:mac:signed

# DMG only
npm run build:mac:dmg
```

**Output Files:**

- `dist/clipforge-1.0.0.dmg` - Installer
- `dist/ClipForge-1.0.0-arm64-mac.zip` - App bundle

#### Windows

```bash
npm run build:win
```

**Output Files:**

- `dist/ClipForge-1.0.0-setup.exe` - Installer

#### Linux

```bash
npm run build:linux
```

**Output Files:**

- `dist/ClipForge-1.0.0.AppImage` - Universal Linux package
- `dist/ClipForge-1.0.0.snap` - Snap package
- `dist/ClipForge-1.0.0.deb` - Debian package

### Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Build only (no packaging)
npm run build
```

### Build Configuration

#### Electron Builder Settings

- **App ID**: `com.clipforge.app`
- **Product Name**: `ClipForge`
- **Version**: `1.0.0`
- **Icons**: Multi-platform support (.icns, .ico, .png)

#### Asset Configuration

- **Icons**: Located in `build/` directory
- **FFmpeg**: Binaries in `resources/ffmpeg/` (see setup instructions above)
- **UI Assets**: In `src/renderer/public/assets/`

### Pre-Build Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] FFmpeg binaries are downloaded and placed in `resources/ffmpeg/`
- [ ] Icons are in correct locations
- [ ] App version is updated in `package.json`

### Build Troubleshooting

#### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf out/ dist/
npm run build
```

#### TypeScript Errors

```bash
# Check for type errors
npm run typecheck

# Fix formatting issues
npm run format
```

#### Icon Issues

- Ensure icons are in `build/` directory
- Check `electron-builder.yml` configuration
- Verify `asarUnpack` includes assets

#### FFmpeg Issues

- Verify FFmpeg binaries are in `resources/ffmpeg/`
- Check that binaries are executable (`chmod +x` on Unix)
- Follow platform-specific setup in `resources/ffmpeg/README.md`

## 🚀 Distribution

### macOS Distribution

1. **Direct Download**: Share the DMG file
2. **GitHub Releases**: Upload to GitHub releases
3. **App Store**: Submit for Mac App Store review
4. **Homebrew**: Create a cask for easy installation

### Windows Distribution

1. **Direct Download**: Share the setup.exe file
2. **Microsoft Store**: Submit for Windows Store
3. **Chocolatey**: Create a package for package manager

### Linux Distribution

1. **AppImage**: Universal Linux package
2. **Snap Store**: Submit to Snap Store
3. **Flatpak**: Create Flatpak package
4. **Package Repositories**: Submit to distribution repos

## 🐛 Troubleshooting

### Common Issues

#### Icons Not Displaying

- **Issue**: Icons show as broken images
- **Solution**: Ensure assets are in `src/renderer/public/assets/`
- **Check**: Verify `asarUnpack` includes `out/renderer/assets/**`

#### Build Failures

- **Issue**: TypeScript compilation errors
- **Solution**: Run `npm run typecheck` to identify issues
- **Check**: Ensure all dependencies are installed

#### FFmpeg Not Found

- **Issue**: Video processing fails
- **Solution**: Download and setup FFmpeg binaries following `resources/ffmpeg/README.md`
- **Check**: Platform-specific binary is present and executable
- **Setup**: Run the appropriate download commands for your platform

### Development Issues

#### Hot Reload Not Working

```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

#### TypeScript Errors

```bash
# Run type checking
npm run typecheck

# Fix formatting
npm run format
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Test on multiple platforms
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Electron**: Cross-platform desktop framework
- **React**: UI library
- **FFmpeg**: Video processing engine
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives

---

**Made with ❤️ for video creators everywhere**
