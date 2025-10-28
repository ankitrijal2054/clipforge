# ClipForge Project Brief

## Project Overview

ClipForge is a modern, lightweight desktop video editor designed for the core editing workflow: **Import → Preview → Trim → Export**. Built with Electron and React, it delivers professional-grade video editing capabilities with zero external dependencies and 100% offline functionality.

## Core Value Proposition

A fast, intuitive video trimming tool that combines the power of professional video editing with the simplicity of modern desktop applications, perfect for creators who need to quickly cut and export video clips without the complexity of enterprise editing software.

## Target Users

- Content creators
- Video editors
- Professionals who need quick video trimming
- Users who want offline video editing capabilities

## Key Requirements

1. **Performance**: Sub-5-second app launch and 60fps UI interactions
2. **Usability**: Complete video trimming workflow in under 2 minutes
3. **Reliability**: 99.9% uptime with zero data loss
4. **Cross-Platform**: Seamless experience across macOS, Windows, and Linux
5. **Offline-First**: 100% functional without internet connectivity

## Success Criteria

- User can import video files via drag-and-drop or file picker
- User can preview video with professional controls
- User can trim video using intuitive drag handles
- User can export trimmed video maintaining quality
- App works offline without external dependencies
- Cross-platform compatibility (macOS, Windows, Linux)

## Technical Foundation

- **Framework**: Electron + React + Vite + TypeScript
- **UI/UX**: ShadCN/UI + Tailwind CSS + Framer Motion
- **State Management**: Zustand
- **Video Processing**: FFmpeg (bundled)
- **Architecture**: Modern desktop application with professional UI/UX

## Project Status

- **Phase 0.1**: ✅ Complete - Project foundation and setup
- **Phase 1**: 🔄 Ready to start - FFmpeg integration
- **Current Focus**: Building core video processing capabilities
