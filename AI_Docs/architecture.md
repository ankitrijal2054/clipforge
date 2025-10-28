graph TB
subgraph "Frontend Layer (React + Vite + TypeScript)"
UI[User Interface]

        subgraph "React Components"
            IM[ImportManager<br/>Drag & Drop<br/>File Picker]
            ML[MediaLibrary<br/>Clip List<br/>Metadata Display]
            PP[PreviewPlayer<br/>HTML5 Video<br/>Playback Controls]
            TL[Timeline<br/>Visual Timeline<br/>Playhead]
            TC[TrimControls<br/>Draggable Handles<br/>Trim Logic]
            EM[ExportModal<br/>Progress UI<br/>Save Dialog]
            ShadCN[ShadCN/UI Components<br/>Button, Dialog, Slider, Progress]
        end

        subgraph "State Management"
            ZS[Zustand Store<br/>clips, trimPoints, playhead<br/>isPlaying, exportProgress]
        end

        subgraph "Utils"
            FMT[Formatters<br/>formatDuration<br/>formatFileSize<br/>formatResolution]
        end
    end

    subgraph "IPC Bridge (Electron IPC)"
        CMD1[get_video_metadata]
        CMD2[trim_export]
        CMD3[select_video_file]
        CMD4[select_export_path]
    end

    subgraph "Backend Layer (Node.js + Electron)"
        MAIN[main.js<br/>Electron Main Process]

        subgraph "Node.js Modules"
            CMDS[ipc-handlers.js<br/>IPC Command Handlers]
            FFMPEG[ffmpeg.js<br/>Platform Detection<br/>Binary Path Resolution]
        end

        subgraph "Electron APIs"
            FS[fs/promises<br/>File Operations]
            DIALOG[dialog API<br/>File/Save Pickers]
            SHELL[child_process<br/>FFmpeg Execution]
        end
    end

    subgraph "External Dependencies"
        BIN[FFmpeg Binaries<br/>macos-arm64/ffmpeg<br/>macos-x64/ffmpeg<br/>windows/ffmpeg.exe<br/>linux/ffmpeg]
        VIDEO[Video Files<br/>MP4, MOV, WebM]
    end

    subgraph "Output"
        EXPORT[Exported MP4<br/>Trimmed Video]
    end

    %% Frontend Connections
    UI --> IM
    UI --> ML
    UI --> PP
    UI --> TL
    UI --> TC
    UI --> EM

    IM --> ShadCN
    ML --> ShadCN
    PP --> ShadCN
    TL --> ShadCN
    TC --> ShadCN
    EM --> ShadCN

    IM --> ZS
    ML --> ZS
    PP --> ZS
    TL --> ZS
    TC --> ZS
    EM --> ZS

    IM --> FMT
    ML --> FMT
    TL --> FMT

    %% IPC Calls
    IM -.->|invoke| CMD1
    IM -.->|invoke| CMD3
    EM -.->|invoke| CMD2
    EM -.->|invoke| CMD4

    %% Backend Processing
    CMD1 --> CMDS
    CMD2 --> CMDS
    CMD3 --> CMDS
    CMD4 --> CMDS

    CMDS --> FFMPEG
    CMDS --> DIALOG
    CMDS --> FS
    CMDS --> SHELL

    FFMPEG --> SHELL
    SHELL --> BIN

    %% Data Flow
    VIDEO -->|import| IM
    BIN -->|metadata| CMD1
    BIN -->|trim & encode| CMD2
    CMD2 --> EXPORT

    DIALOG -.->|file path| IM
    DIALOG -.->|save path| EM

    %% Styling
    classDef frontend fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef backend fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef ipc fill:#10b981,stroke:#059669,color:#fff
    classDef external fill:#f59e0b,stroke:#d97706,color:#fff
    classDef state fill:#ec4899,stroke:#db2777,color:#fff

    class IM,ML,PP,TL,TC,EM,ShadCN,UI frontend
    class MAIN,CMDS,FFMPEG,FS,DIALOG,SHELL backend
    class CMD1,CMD2,CMD3,CMD4 ipc
    class BIN,VIDEO,EXPORT external
    class ZS,FMT state
