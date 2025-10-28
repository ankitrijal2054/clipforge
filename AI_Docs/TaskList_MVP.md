# ClipForge MVP - Technical Implementation Task List (Upgraded)

**Platform:** Cross-platform desktop application (macOS, Windows, Linux)  
**Stack:** Electron + React + Vite + TypeScript  
**Architecture:** Modern desktop application with professional UI/UX

---

## Quick Reference: Phase Checklist

| Phase | Name                   | Priority  | Dependencies |
| ----- | ---------------------- | --------- | ------------ |
| 0     | Project Foundation     | 🔴 Must   | None         |
| 1     | FFmpeg Integration     | 🔴 Must   | Phase 0      |
| 2     | State Management       | 🔴 Must   | Phase 0      |
| 3     | Import System          | 🔴 Must   | Phases 1-2   |
| 4     | Preview Player         | 🔴 Must   | Phases 1-2   |
| 5     | Timeline UI            | 🔴 Must   | Phases 2-4   |
| 6     | Trim Controls          | 🔴 Must   | Phases 2-5   |
| 7     | Export Pipeline        | 🔴 Must   | Phases 1-6   |
| 8     | UI/UX Polish           | 🟡 Should | Phases 3-7   |
| 9     | Testing & Optimization | 🔴 Must   | Phases 1-8   |
| 10    | Build & Package        | 🔴 Must   | Phases 1-9   |
| 11    | Documentation          | 🟡 Should | Phases 1-10  |
| 12    | Final Verification     | 🔴 Must   | Phases 1-11  |

---

## Phase 0: Project Foundation

### 0.1 Project Initialization

**Electron + Vite Setup:**

- [ ] Create new Electron + Vite project with TypeScript
  ```bash
  npm create @quick-start/electron
  # Choose: npm, React + TypeScript, Vite
  ```
- [ ] Verify project structure and dependencies
- [ ] Test initial app launch: `npm run dev`
- [ ] Verify both main and renderer processes start correctly
- [ ] Configure TypeScript for strict mode
- [ ] Set up ESLint and Prettier configurations

**Package Dependencies:**

- [ ] Install core React dependencies
  ```bash
  npm install react react-dom
  npm install -D @types/react @types/react-dom
  ```
- [ ] Install state management
  ```bash
  npm install zustand
  ```
- [ ] Install UI/UX libraries
  ```bash
  npm install framer-motion lucide-react
  npm install react-hook-form react-hotkeys-hook
  npm install clsx tailwind-merge
  ```
- [ ] Install development dependencies
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npm install -D @types/node
  ```

### 0.2 Styling and UI Framework Setup

**Tailwind CSS Configuration:**

- [ ] Initialize Tailwind CSS
  ```bash
  npx tailwindcss init -p
  ```
- [ ] Configure `tailwind.config.js` with custom theme
  ```javascript
  module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
          background: {
            primary: "#0a0a0a",
            secondary: "#1a1a1a",
            tertiary: "#2a2a2a",
          },
          accent: {
            primary: "#3b82f6",
            secondary: "#8b5cf6",
            success: "#10b981",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
        fontFamily: {
          sans: ["Inter", "system-ui", "sans-serif"],
        },
        animation: {
          "fade-in": "fadeIn 0.2s ease-out",
          "slide-in": "slideIn 0.3s ease-out",
          "scale-in": "scaleIn 0.2s ease-out",
        },
      },
    },
    plugins: [],
  };
  ```
- [ ] Add Tailwind directives to main CSS file
- [ ] Configure PostCSS for Tailwind processing

**ShadCN/UI Setup:**

- [ ] Initialize ShadCN/UI
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Install essential components
  ```bash
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add dialog
  npx shadcn-ui@latest add slider
  npx shadcn-ui@latest add progress
  npx shadcn-ui@latest add toast
  npx shadcn-ui@latest add tooltip
  npx shadcn-ui@latest add card
  npx shadcn-ui@latest add input
  npx shadcn-ui@latest add label
  ```

### 0.3 Project Structure and Configuration

**Directory Structure:**

- [ ] Create comprehensive project structure
  ```
  src/
  ├── components/
  │   ├── ui/                   # ShadCN/UI components
  │   ├── ImportManager.tsx
  │   ├── MediaLibrary.tsx
  │   ├── PreviewPlayer.tsx
  │   ├── Timeline.tsx
  │   ├── TrimControls.tsx
  │   ├── ExportModal.tsx
  │   └── Layout.tsx
  ├── hooks/
  │   ├── useKeyboardShortcuts.ts
  │   ├── useVideoPlayer.ts
  │   └── useExport.ts
  ├── stores/
  │   └── editorStore.ts
  ├── utils/
  │   ├── formatters.ts
  │   ├── validators.ts
  │   └── constants.ts
  ├── types/
  │   ├── video.ts
  │   ├── electron.d.ts
  │   └── store.ts
  ├── styles/
  │   ├── globals.css
  │   └── components.css
  ├── App.tsx
  └── main.tsx
  ```

**TypeScript Configuration:**

- [ ] Create comprehensive type definitions

  ```typescript
  // src/types/video.ts
  export interface VideoClip {
    id: string;
    name: string;
    path: string;
    duration: number;
    width: number;
    height: number;
    fileSize: number;
    bitRate: number;
    thumbnail?: string;
  }

  export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
    fileSize: number;
    bitRate: number;
  }

  export interface ExportSettings {
    format: "mp4";
    quality: "high" | "medium" | "low";
    bitrate?: number;
  }
  ```

**Electron Configuration:**

- [ ] Configure `electron.vite.config.ts` for optimal development
- [ ] Set up hot reload for both main and renderer processes
- [ ] Configure context isolation and security settings
- [ ] Set up preload script structure

### 0.4 Git and Development Setup

**Version Control:**

- [ ] Initialize Git repository
- [ ] Create comprehensive `.gitignore`

  ```gitignore
  # Dependencies
  node_modules/

  # Build outputs
  dist/
  dist-electron/

  # FFmpeg binaries
  resources/ffmpeg-*

  # IDE
  .vscode/
  .idea/

  # OS
  .DS_Store
  Thumbs.db

  # Logs
  *.log
  npm-debug.log*
  ```

- [ ] Create initial commit with project structure

**Development Scripts:**

- [ ] Configure package.json scripts
  ```json
  {
    "scripts": {
      "dev": "electron-vite dev",
      "build": "electron-vite build",
      "preview": "electron-vite preview",
      "build:mac": "electron-builder --mac",
      "build:win": "electron-builder --win",
      "build:linux": "electron-builder --linux",
      "lint": "eslint . --ext .ts,.tsx",
      "format": "prettier --write ."
    }
  }
  ```

---

## Phase 1: FFmpeg Integration

### 1.1 FFmpeg Binary Management

**Download and Organize Binaries:**

- [ ] Create resources directory structure
  ```bash
  mkdir -p resources
  ```
- [ ] Download FFmpeg for macOS Apple Silicon
  ```bash
  wget https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -O ffmpeg-mac-arm64.zip
  unzip ffmpeg-mac-arm64.zip
  mv ffmpeg resources/ffmpeg-mac-arm64
  chmod +x resources/ffmpeg-mac-arm64
  rm ffmpeg-mac-arm64.zip
  ```
- [ ] Download FFmpeg for macOS Intel
  ```bash
  wget https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -O ffmpeg-mac-x64.zip
  unzip ffmpeg-mac-x64.zip
  mv ffmpeg resources/ffmpeg-mac-x64
  chmod +x resources/ffmpeg-mac-x64
  rm ffmpeg-mac-x64.zip
  ```
- [ ] Download FFmpeg for Windows
  - Download from: https://www.gyan.dev/ffmpeg/builds/
  - Extract `ffmpeg.exe` to `resources/ffmpeg-win.exe`
- [ ] Download FFmpeg for Linux
  ```bash
  wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
  tar -xf ffmpeg-release-amd64-static.tar.xz
  cp ffmpeg-*-amd64-static/ffmpeg resources/ffmpeg-linux
  chmod +x resources/ffmpeg-linux
  rm -rf ffmpeg-*-amd64-static*
  ```

**Binary Validation:**

- [ ] Create binary validation script
  ```typescript
  // electron/main/ffmpeg.ts
  export function validateFFmpegBinary(): boolean {
    const ffmpegPath = getFFmpegPath();
    try {
      fs.accessSync(ffmpegPath, fs.constants.F_OK | fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  ```
- [ ] Test all binaries on respective platforms
- [ ] Add error handling for missing binaries

### 1.2 Platform Detection and Path Resolution

**Platform Detection Logic:**

- [ ] Implement `getFFmpegPath()` function

  ```typescript
  export function getFFmpegPath(): string {
    const isDev = process.env.NODE_ENV === "development";
    const resourcesPath = isDev
      ? path.join(__dirname, "../../resources")
      : process.resourcesPath;

    let binaryName: string;
    if (process.platform === "darwin") {
      binaryName =
        process.arch === "arm64" ? "ffmpeg-mac-arm64" : "ffmpeg-mac-x64";
    } else if (process.platform === "win32") {
      binaryName = "ffmpeg-win.exe";
    } else {
      binaryName = "ffmpeg-linux";
    }

    return path.join(resourcesPath, binaryName);
  }
  ```

- [ ] Add platform-specific path handling
- [ ] Implement fallback mechanisms for missing binaries

### 1.3 FFmpeg Operations Implementation

**Metadata Extraction:**

- [ ] Create `getVideoMetadata()` function

  ```typescript
  export async function getVideoMetadata(
    filePath: string
  ): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn(getFFmpegPath().replace("ffmpeg", "ffprobe"), [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=width,height,bit_rate",
        "-of",
        "json",
        filePath,
      ]);

      let output = "";
      ffprobe.stdout.on("data", (data) => {
        output += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(output);
            const format = metadata.format;
            const stream = metadata.streams[0];

            resolve({
              duration: parseFloat(format.duration),
              width: stream.width,
              height: stream.height,
              fileSize: parseInt(format.size),
              bitRate: parseInt(format.bit_rate),
            });
          } catch (error) {
            reject(new Error("Failed to parse metadata"));
          }
        } else {
          reject(new Error("FFprobe failed"));
        }
      });
    });
  }
  ```

**Video Trimming and Export:**

- [ ] Create `trimAndExport()` function

  ```typescript
  export async function trimAndExport(
    params: {
      inputPath: string;
      startTime: number;
      endTime: number;
      outputPath: string;
      duration: number;
    },
    onProgress: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(getFFmpegPath(), [
        "-i",
        params.inputPath,
        "-ss",
        params.startTime.toString(),
        "-to",
        params.endTime.toString(),
        "-c",
        "copy",
        params.outputPath,
      ]);

      ffmpeg.stderr.on("data", (data) => {
        const output = data.toString();
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          const currentTime = parseTimeToSeconds(timeMatch);
          const progress = (currentTime / params.duration) * 100;
          onProgress(Math.min(progress, 100));
        }
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve(params.outputPath);
        } else {
          reject(new Error("FFmpeg export failed"));
        }
      });
    });
  }
  ```

### 1.4 IPC Integration

**IPC Handlers:**

- [ ] Create IPC handlers for FFmpeg operations

  ```typescript
  // electron/main/ipc-handlers.ts
  import { ipcMain } from "electron";
  import { getVideoMetadata, trimAndExport } from "./ffmpeg";

  export function registerIpcHandlers() {
    ipcMain.handle("video:getMetadata", async (_, path: string) => {
      return await getVideoMetadata(path);
    });

    ipcMain.handle("video:trimExport", async (event, params) => {
      return await trimAndExport(params, (progress) => {
        event.sender.send("export:progress", progress);
      });
    });
  }
  ```

**Preload Script:**

- [ ] Update preload script with FFmpeg APIs

  ```typescript
  // electron/preload/index.ts
  import { contextBridge, ipcRenderer } from "electron";

  contextBridge.exposeInMainWorld("electronAPI", {
    getVideoMetadata: (path: string) =>
      ipcRenderer.invoke("video:getMetadata", path),
    trimExport: (params: TrimExportParams) =>
      ipcRenderer.invoke("video:trimExport", params),
    onExportProgress: (callback: (progress: number) => void) => {
      ipcRenderer.on("export:progress", (_, progress) => callback(progress));
    },
  });
  ```

---

## Phase 2: State Management

### 2.1 Zustand Store Implementation

**Store Structure:**

- [ ] Create comprehensive Zustand store

  ```typescript
  // src/stores/editorStore.ts
  import { create } from "zustand";
  import { devtools } from "zustand/middleware";

  interface EditorStore {
    // Media
    clips: VideoClip[];
    selectedClip: VideoClip | null;
    importHistory: string[];

    // Timeline
    timelineClips: TimelineClip[];
    playhead: number;
    duration: number;
    zoomLevel: number;

    // Playback
    isPlaying: boolean;
    playbackRate: number;
    volume: number;
    isMuted: boolean;

    // Trim
    trimStart: number;
    trimEnd: number;
    isDragging: boolean;

    // Export
    isExporting: boolean;
    exportProgress: number;
    exportSettings: ExportSettings;

    // UI State
    activeModal: string | null;
    sidebarCollapsed: boolean;
    theme: "dark" | "light";

    // Actions
    addClip: (clip: VideoClip) => void;
    selectClip: (id: string) => void;
    removeClip: (id: string) => void;
    setTrimPoints: (start: number, end: number) => void;
    setPlayhead: (time: number) => void;
    togglePlayback: () => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    startExport: () => Promise<void>;
    resetTrim: () => void;
    setActiveModal: (modal: string | null) => void;
    toggleSidebar: () => void;
  }

  export const useEditorStore = create<EditorStore>()(
    devtools(
      (set, get) => ({
        // Initial state
        clips: [],
        selectedClip: null,
        importHistory: [],
        timelineClips: [],
        playhead: 0,
        duration: 0,
        zoomLevel: 1,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        trimStart: 0,
        trimEnd: 0,
        isDragging: false,
        isExporting: false,
        exportProgress: 0,
        exportSettings: { format: "mp4", quality: "high" },
        activeModal: null,
        sidebarCollapsed: false,
        theme: "dark",

        // Actions
        addClip: (clip) =>
          set((state) => ({
            clips: [...state.clips, clip],
            selectedClip: clip,
            duration: clip.duration,
            trimEnd: clip.duration,
          })),

        selectClip: (id) =>
          set((state) => {
            const clip = state.clips.find((c) => c.id === id);
            return {
              selectedClip: clip || null,
              duration: clip?.duration || 0,
              trimEnd: clip?.duration || 0,
              playhead: 0,
            };
          }),

        setTrimPoints: (start, end) =>
          set({
            trimStart: Math.max(0, start),
            trimEnd: Math.min(get().duration, end),
          }),

        togglePlayback: () =>
          set((state) => ({
            isPlaying: !state.isPlaying,
          })),

        resetTrim: () =>
          set((state) => ({
            trimStart: 0,
            trimEnd: state.duration,
          })),

        // ... other actions
      }),
      { name: "editor-store" }
    )
  );
  ```

### 2.2 Custom Hooks

**Video Player Hook:**

- [ ] Create `useVideoPlayer` hook

  ```typescript
  // src/hooks/useVideoPlayer.ts
  import { useRef, useEffect } from "react";
  import { useEditorStore } from "../stores/editorStore";

  export function useVideoPlayer() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { selectedClip, isPlaying, playhead, setPlayhead } = useEditorStore();

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        setPlayhead(video.currentTime);
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      return () => video.removeEventListener("timeupdate", handleTimeUpdate);
    }, [setPlayhead]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      if (isPlaying) {
        video.play();
      } else {
        video.pause();
      }
    }, [isPlaying]);

    return { videoRef };
  }
  ```

**Keyboard Shortcuts Hook:**

- [ ] Create `useKeyboardShortcuts` hook

  ```typescript
  // src/hooks/useKeyboardShortcuts.ts
  import { useHotkeys } from "react-hotkeys-hook";
  import { useEditorStore } from "../stores/editorStore";

  export function useKeyboardShortcuts() {
    const { togglePlayback, resetTrim, setActiveModal } = useEditorStore();

    useHotkeys("space", (e) => {
      e.preventDefault();
      togglePlayback();
    });

    useHotkeys("r", () => {
      resetTrim();
    });

    useHotkeys("escape", () => {
      setActiveModal(null);
    });

    useHotkeys("i", () => {
      // Set trim in point
    });

    useHotkeys("o", () => {
      // Set trim out point
    });
  }
  ```

### 2.3 Utility Functions

**Formatters:**

- [ ] Create comprehensive formatter functions

  ```typescript
  // src/utils/formatters.ts
  export function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  export function formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  export function formatResolution(width: number, height: number): string {
    return `${width}×${height}`;
  }
  ```

**Validators:**

- [ ] Create input validation functions

  ```typescript
  // src/utils/validators.ts
  export function isValidVideoFile(filename: string): boolean {
    const validExtensions = [".mp4", ".mov", ".webm"];
    const extension = filename
      .toLowerCase()
      .substring(filename.lastIndexOf("."));
    return validExtensions.includes(extension);
  }

  export function isValidFilename(filename: string): boolean {
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(filename) && filename.length > 0;
  }
  ```

---

## Phase 3: Import System

### 3.1 File Dialog Integration

**IPC Handlers:**

- [ ] Create file dialog IPC handlers

  ```typescript
  // electron/main/ipc-handlers.ts
  import { dialog } from "electron";

  ipcMain.handle("dialog:selectVideo", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Videos", extensions: ["mp4", "mov", "webm"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    return result.filePaths[0];
  });
  ```

**Preload Integration:**

- [ ] Expose file dialog APIs
  ```typescript
  // electron/preload/index.ts
  contextBridge.exposeInMainWorld("electronAPI", {
    selectVideoFile: () => ipcRenderer.invoke("dialog:selectVideo"),
    // ... other APIs
  });
  ```

### 3.2 Import Manager Component

**Component Implementation:**

- [ ] Create `ImportManager` component

  ```typescript
  // src/components/ImportManager.tsx
  import React, { useCallback, useState } from "react";
  import { motion } from "framer-motion";
  import { Upload, FileVideo, AlertCircle } from "lucide-react";
  import { useEditorStore } from "../stores/editorStore";
  import { isValidVideoFile } from "../utils/validators";

  export function ImportManager() {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const { addClip } = useEditorStore();

    const handleFileImport = useCallback(
      async (filePath: string) => {
        if (!isValidVideoFile(filePath)) {
          // Show error toast
          return;
        }

        setIsImporting(true);
        try {
          const metadata = await window.electronAPI.getVideoMetadata(filePath);
          const clip: VideoClip = {
            id: crypto.randomUUID(),
            name: filePath.split("/").pop() || "Unknown",
            path: filePath,
            ...metadata,
          };
          addClip(clip);
        } catch (error) {
          // Handle error
        } finally {
          setIsImporting(false);
        }
      },
      [addClip]
    );

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const videoFile = files.find((f) => isValidVideoFile(f.name));

        if (videoFile) {
          handleFileImport(videoFile.path);
        }
      },
      [handleFileImport]
    );

    return (
      <motion.div
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg"
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        animate={{
          borderColor: isDragOver ? "#3b82f6" : "#4b5563",
          backgroundColor: isDragOver ? "#1e3a8a" : "transparent",
        }}
      >
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Import Video</h3>
        <p className="text-gray-400 text-center mb-4">
          Drag and drop a video file or click to browse
        </p>
        <button
          onClick={() =>
            window.electronAPI.selectVideoFile().then(handleFileImport)
          }
          disabled={isImporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isImporting ? "Importing..." : "Browse Files"}
        </button>
      </motion.div>
    );
  }
  ```

### 3.3 Media Library Component

**Component Implementation:**

- [ ] Create `MediaLibrary` component

  ```typescript
  // src/components/MediaLibrary.tsx
  import React from "react";
  import { motion } from "framer-motion";
  import { FileVideo, Play, Trash2 } from "lucide-react";
  import { useEditorStore } from "../stores/editorStore";
  import {
    formatDuration,
    formatFileSize,
    formatResolution,
  } from "../utils/formatters";

  export function MediaLibrary() {
    const { clips, selectedClip, selectClip, removeClip } = useEditorStore();

    if (clips.length === 0) {
      return (
        <div className="p-4 text-center text-gray-400">
          <FileVideo className="w-12 h-12 mx-auto mb-4" />
          <p>No videos imported yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {clips.map((clip) => (
          <motion.div
            key={clip.id}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              selectedClip?.id === clip.id
                ? "bg-blue-600 border-2 border-blue-500"
                : "bg-gray-800 hover:bg-gray-700 border-2 border-transparent"
            }`}
            onClick={() => selectClip(clip.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <FileVideo className="w-8 h-8 text-gray-400" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">
                  {clip.name}
                </h4>
                <div className="flex space-x-4 text-xs text-gray-400">
                  <span>{formatDuration(clip.duration)}</span>
                  <span>{formatResolution(clip.width, clip.height)}</span>
                  <span>{formatFileSize(clip.fileSize)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeClip(clip.id);
                }}
                className="p-1 text-gray-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
  ```

---

## Phase 4: Preview Player

### 4.1 Video Player Component

**Component Implementation:**

- [ ] Create `PreviewPlayer` component

  ```typescript
  // src/components/PreviewPlayer.tsx
  import React, { useRef, useEffect } from "react";
  import { motion } from "framer-motion";
  import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    SkipBack,
    SkipForward,
  } from "lucide-react";
  import { useEditorStore } from "../stores/editorStore";
  import { useVideoPlayer } from "../hooks/useVideoPlayer";
  import { formatDuration } from "../utils/formatters";

  export function PreviewPlayer() {
    const { videoRef } = useVideoPlayer();
    const {
      selectedClip,
      isPlaying,
      playhead,
      duration,
      volume,
      isMuted,
      togglePlayback,
      setVolume,
      toggleMute,
      setPlayhead,
    } = useEditorStore();

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setPlayhead(time);
      }
    };

    const handleSkip = (seconds: number) => {
      if (videoRef.current) {
        const newTime = Math.max(
          0,
          Math.min(
            videoRef.current.duration,
            videoRef.current.currentTime + seconds
          )
        );
        videoRef.current.currentTime = newTime;
        setPlayhead(newTime);
      }
    };

    if (!selectedClip) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
          <p className="text-gray-400">Select a video to preview</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={`file://${selectedClip.path}`}
            className="w-full h-64 object-contain"
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setPlayhead(0);
              }
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              onClick={togglePlayback}
              className="p-4 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8" />
              )}
            </motion.button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max={duration}
              value={playhead}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-400 min-w-0">
              {formatDuration(playhead)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSkip(-10)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayback}
                className="p-2 text-gray-400 hover:text-white"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-400 hover:text-white"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

### 4.2 Custom Video Controls

**Advanced Controls:**

- [ ] Implement fullscreen support
- [ ] Add playback rate controls
- [ ] Implement keyboard shortcuts
- [ ] Add volume visualization
- [ ] Create custom scrubber with hover preview

---

## Phase 5: Timeline UI

### 5.1 Timeline Component

**Component Implementation:**

- [ ] Create `Timeline` component

  ```typescript
  // src/components/Timeline.tsx
  import React, { useRef, useMemo } from "react";
  import { motion } from "framer-motion";
  import { useEditorStore } from "../stores/editorStore";
  import { formatDuration } from "../utils/formatters";

  export function Timeline() {
    const timelineRef = useRef<HTMLDivElement>(null);
    const { selectedClip, playhead, duration, trimStart, trimEnd } =
      useEditorStore();

    const pixelsPerSecond = useMemo(() => {
      if (!timelineRef.current || duration === 0) return 0;
      return timelineRef.current.offsetWidth / duration;
    }, [duration]);

    const timeMarkers = useMemo(() => {
      const markers = [];
      const interval = duration > 60 ? 10 : 5; // 10s for long videos, 5s for short

      for (let i = 0; i <= duration; i += interval) {
        markers.push({
          time: i,
          position: i * pixelsPerSecond,
          label: formatDuration(i),
        });
      }

      return markers;
    }, [duration, pixelsPerSecond]);

    const handleTimelineClick = (e: React.MouseEvent) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickedTime = clickX / pixelsPerSecond;

      // Seek to clicked time
      if (videoRef.current) {
        videoRef.current.currentTime = clickedTime;
        setPlayhead(clickedTime);
      }
    };

    if (!selectedClip) {
      return (
        <div className="h-20 bg-gray-800 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">No video selected</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatDuration(trimStart)}</span>
          <span>{formatDuration(trimEnd - trimStart)}</span>
          <span>{formatDuration(trimEnd)}</span>
        </div>

        <div
          ref={timelineRef}
          className="relative h-16 bg-gray-800 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          {timeMarkers.map((marker) => (
            <div
              key={marker.time}
              className="absolute top-0 h-full w-px bg-gray-600"
              style={{ left: marker.position }}
            >
              <div className="absolute -top-5 left-1 text-xs text-gray-400">
                {marker.label}
              </div>
            </div>
          ))}

          {/* Clip bar */}
          <div className="absolute top-2 left-0 h-12 bg-blue-600 rounded">
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded" />
          </div>

          {/* Trim region highlight */}
          <div
            className="absolute top-2 h-12 bg-blue-400 bg-opacity-50 rounded"
            style={{
              left: trimStart * pixelsPerSecond,
              width: (trimEnd - trimStart) * pixelsPerSecond,
            }}
          />

          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-red-500"
            style={{ left: playhead * pixelsPerSecond }}
          />
        </div>
      </div>
    );
  }
  ```

### 5.2 Timeline Features

**Advanced Features:**

- [ ] Implement zoom functionality
- [ ] Add pan/scroll capabilities
- [ ] Create snap-to-frame functionality
- [ ] Add timeline ruler with time markers
- [ ] Implement timeline scrubbing

---

## Phase 6: Trim Controls

### 6.1 Trim Controls Component

**Component Implementation:**

- [ ] Create `TrimControls` component

  ```typescript
  // src/components/TrimControls.tsx
  import React, { useState, useRef, useCallback } from "react";
  import { motion } from "framer-motion";
  import { RotateCcw } from "lucide-react";
  import { useEditorStore } from "../stores/editorStore";
  import { formatDuration } from "../utils/formatters";

  export function TrimControls() {
    const {
      trimStart,
      trimEnd,
      duration,
      setTrimPoints,
      resetTrim,
      isDragging,
      setIsDragging,
    } = useEditorStore();

    const [dragHandle, setDragHandle] = useState<"start" | "end" | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    const pixelsPerSecond = timelineRef.current
      ? timelineRef.current.offsetWidth / duration
      : 0;

    const handleMouseDown = useCallback(
      (handle: "start" | "end") => {
        setDragHandle(handle);
        setIsDragging(true);
      },
      [setIsDragging]
    );

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!dragHandle || !timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const time = mouseX / pixelsPerSecond;

        if (dragHandle === "start") {
          setTrimPoints(Math.max(0, Math.min(time, trimEnd - 0.1)), trimEnd);
        } else {
          setTrimPoints(
            trimStart,
            Math.max(trimStart + 0.1, Math.min(time, duration))
          );
        }
      },
      [dragHandle, pixelsPerSecond, trimStart, trimEnd, duration, setTrimPoints]
    );

    const handleMouseUp = useCallback(() => {
      setDragHandle(null);
      setIsDragging(false);
    }, [setIsDragging]);

    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Trim Controls</h3>
          <button
            onClick={resetTrim}
            className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Start: {formatDuration(trimStart)}</span>
            <span>Duration: {formatDuration(trimEnd - trimStart)}</span>
            <span>End: {formatDuration(trimEnd)}</span>
          </div>

          <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
            {/* Trim region */}
            <div
              className="absolute top-0 h-full bg-blue-500 bg-opacity-50"
              style={{
                left: trimStart * pixelsPerSecond,
                width: (trimEnd - trimStart) * pixelsPerSecond,
              }}
            />

            {/* Start handle */}
            <div
              className="absolute top-0 w-2 h-full bg-blue-500 cursor-ew-resize hover:bg-blue-400"
              style={{ left: trimStart * pixelsPerSecond - 1 }}
              onMouseDown={() => handleMouseDown("start")}
            />

            {/* End handle */}
            <div
              className="absolute top-0 w-2 h-full bg-blue-500 cursor-ew-resize hover:bg-blue-400"
              style={{ left: trimEnd * pixelsPerSecond - 1 }}
              onMouseDown={() => handleMouseDown("end")}
            />
          </div>
        </div>
      </div>
    );
  }
  ```

### 6.2 Trim Features

**Advanced Features:**

- [ ] Implement snap-to-frame functionality
- [ ] Add keyboard shortcuts (I/O keys)
- [ ] Create visual feedback during drag
- [ ] Implement trim region highlighting
- [ ] Add trim duration display

---

## Phase 7: Export Pipeline

### 7.1 Export Modal Component

**Component Implementation:**

- [ ] Create `ExportModal` component

  ```typescript
  // src/components/ExportModal.tsx
  import React, { useState, useEffect } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import {
    X,
    Download,
    FolderOpen,
    CheckCircle,
    AlertCircle,
  } from "lucide-react";
  import { useEditorStore } from "../stores/editorStore";
  import { Button } from "./ui/button";
  import { Input } from "./ui/input";
  import { Progress } from "./ui/progress";

  export function ExportModal() {
    const {
      selectedClip,
      trimStart,
      trimEnd,
      isExporting,
      exportProgress,
      activeModal,
      setActiveModal,
      startExport,
    } = useEditorStore();

    const [filename, setFilename] = useState("clip_trimmed.mp4");
    const [exportPath, setExportPath] = useState("");
    const [exportStatus, setExportStatus] = useState<
      "idle" | "exporting" | "success" | "error"
    >("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
      if (selectedClip) {
        const baseName = selectedClip.name.replace(/\.[^/.]+$/, "");
        setFilename(`${baseName}_trimmed.mp4`);
      }
    }, [selectedClip]);

    useEffect(() => {
      if (isExporting) {
        setExportStatus("exporting");
      } else if (exportProgress === 100) {
        setExportStatus("success");
      }
    }, [isExporting, exportProgress]);

    const handleExport = async () => {
      if (!selectedClip || !exportPath) return;

      try {
        setExportStatus("exporting");
        await startExport();
      } catch (error) {
        setExportStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Export failed"
        );
      }
    };

    const handleBrowse = async () => {
      const path = await window.electronAPI.selectExportPath(filename);
      if (path) {
        setExportPath(path);
      }
    };

    const handleOpenFolder = async () => {
      if (exportPath) {
        const folderPath = exportPath.substring(0, exportPath.lastIndexOf("/"));
        await window.electronAPI.openFolder(folderPath);
      }
    };

    if (activeModal !== "export") return null;

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Export Video</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filename
                </label>
                <Input
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Save Location
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={exportPath}
                    onChange={(e) => setExportPath(e.target.value)}
                    className="flex-1"
                    placeholder="Choose export location"
                  />
                  <Button onClick={handleBrowse} variant="outline">
                    Browse
                  </Button>
                </div>
              </div>

              {exportStatus === "exporting" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Exporting...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                </div>
              )}

              {exportStatus === "success" && (
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Export completed successfully!</span>
                </div>
              )}

              {exportStatus === "error" && (
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button onClick={() => setActiveModal(null)} variant="outline">
                  Cancel
                </Button>
                {exportStatus === "success" && (
                  <Button onClick={handleOpenFolder} variant="outline">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Open Folder
                  </Button>
                )}
                <Button
                  onClick={handleExport}
                  disabled={!exportPath || exportStatus === "exporting"}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
  ```

### 7.2 Export Features

**Advanced Features:**

- [ ] Implement export progress tracking
- [ ] Add export quality settings
- [ ] Create export history
- [ ] Implement batch export
- [ ] Add export validation

---

## Phase 8: UI/UX Polish

### 8.1 Animation System

**Framer Motion Setup:**

- [ ] Create animation variants

  ```typescript
  // src/utils/animations.ts
  export const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2, ease: "easeOut" },
  };

  export const slideIn = {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: { duration: 0.3, ease: "easeInOut" },
  };

  export const scaleIn = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.2, ease: "easeOut" },
  };
  ```

### 8.2 Loading States

**Skeleton Loaders:**

- [ ] Create skeleton components
- [ ] Implement loading states for all async operations
- [ ] Add progress indicators
- [ ] Create loading animations

### 8.3 Error Handling

**Error Boundaries:**

- [ ] Create React error boundary
- [ ] Implement global error handling
- [ ] Add error recovery mechanisms
- [ ] Create user-friendly error messages

### 8.4 Accessibility

**Accessibility Features:**

- [ ] Add ARIA labels
- [ ] Implement keyboard navigation
- [ ] Create focus management
- [ ] Add screen reader support
- [ ] Implement high contrast mode

---

## Phase 9: Testing & Optimization

### 9.1 Unit Testing

**Test Setup:**

- [ ] Configure Jest and React Testing Library
- [ ] Create test utilities
- [ ] Write component tests
- [ ] Create integration tests
- [ ] Add E2E tests with Playwright

### 9.2 Performance Optimization

**Optimization Tasks:**

- [ ] Implement React.memo for pure components
- [ ] Add useMemo and useCallback optimizations
- [ ] Optimize bundle size
- [ ] Implement code splitting
- [ ] Add performance monitoring

### 9.3 Cross-Platform Testing

**Platform Testing:**

- [ ] Test on macOS (primary)
- [ ] Test on Windows
- [ ] Test on Linux
- [ ] Verify FFmpeg functionality
- [ ] Test file system operations

---

## Phase 10: Build & Package

### 10.1 Build Configuration

**Electron Builder Setup:**

- [ ] Configure electron-builder.yml
- [ ] Set up code signing
- [ ] Configure notarization
- [ ] Set up auto-updater

### 10.2 Cross-Platform Builds

**Build Tasks:**

- [ ] Build for macOS
- [ ] Build for Windows
- [ ] Build for Linux
- [ ] Test all builds
- [ ] Create distribution packages

---

## Phase 11: Documentation

### 11.1 User Documentation

**Documentation Tasks:**

- [ ] Create user guide
- [ ] Write installation instructions
- [ ] Create troubleshooting guide
- [ ] Add keyboard shortcuts reference
- [ ] Create video tutorials

### 11.2 Developer Documentation

**Technical Documentation:**

- [ ] Write API documentation
- [ ] Create architecture overview
- [ ] Document build process
- [ ] Add contribution guidelines
- [ ] Create deployment guide

---

## Phase 12: Final Verification

### 12.1 Quality Assurance

**QA Tasks:**

- [ ] Verify all acceptance criteria
- [ ] Test all user workflows
- [ ] Validate cross-platform compatibility
- [ ] Check performance metrics
- [ ] Verify accessibility compliance

### 12.2 Release Preparation

**Release Tasks:**

- [ ] Create release notes
- [ ] Prepare distribution packages
- [ ] Set up update channels
- [ ] Create marketing materials
- [ ] Plan launch strategy

---

## Success Metrics

### Functional Requirements

- ✅ User can import video files via drag-and-drop or file picker
- ✅ User can preview video with professional controls
- ✅ User can trim video using intuitive drag handles
- ✅ User can export trimmed video maintaining quality
- ✅ App works offline without external dependencies
- ✅ Cross-platform compatibility (macOS, Windows, Linux)

### Performance Requirements

- ✅ App launches in under 5 seconds
- ✅ UI interactions respond within 16ms
- ✅ Video playback maintains 60fps
- ✅ Export completes without UI freezing
- ✅ Memory usage remains stable during extended use

### User Experience Requirements

- ✅ Intuitive interface requiring no training
- ✅ Professional visual design and animations
- ✅ Comprehensive keyboard shortcuts
- ✅ Accessible to users with disabilities
- ✅ Clear error messages and recovery options

### Technical Requirements

- ✅ Secure IPC communication
- ✅ Proper error handling and logging
- ✅ Type-safe codebase with TypeScript
- ✅ Optimized bundle size and performance
- ✅ Cross-platform build system
