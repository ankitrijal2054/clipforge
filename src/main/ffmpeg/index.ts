/**
 * FFmpeg integration module
 *
 * This module provides all FFmpeg-related functionality including:
 * - Platform detection and binary path resolution
 * - Video metadata extraction
 * - Video processing operations (trim, convert, etc.)
 */

export * from './platform'
export * from './metadata'
export * from './operations'

// Re-export types for convenience
export type { Platform, Architecture, PlatformInfo } from './platform'
export type { FFprobeFormat, FFprobeStream, FFprobeOutput } from './metadata'
export type { TrimExportParams, ExportProgress } from './operations'
