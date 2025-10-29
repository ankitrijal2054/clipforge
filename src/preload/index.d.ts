import { ElectronAPI } from '@electron-toolkit/preload'
import {
  VideoMetadata,
  TrimExportParams,
  ExportProgress,
  VideoThumbnailParams,
  ConvertVideoParams
} from '../types/video'
import type {
  ScreenSource,
  RecordingOptions,
  MediaDeviceInfo,
  RecordingState,
  RecordingQuality
} from '../types/recording'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // Video metadata operations
      getVideoMetadata: (filePath: string) => Promise<VideoMetadata>

      // Video thumbnail generation
      getVideoThumbnail: (params: VideoThumbnailParams) => Promise<string>

      // Video trimming and export
      trimExport: (params: TrimExportParams) => Promise<string>

      // Video conversion
      convertVideo: (params: ConvertVideoParams) => Promise<string>

      // Progress event listeners
      onExportProgress: (callback: (progress: ExportProgress) => void) => () => void
      onConvertProgress: (callback: (progress: ExportProgress) => void) => () => void

      // File dialog operations
      selectVideoFile: () => Promise<string | null>
      selectExportPath: (defaultFilename: string) => Promise<string | null>
      openFolder: (folderPath: string) => Promise<void>

      // Recording operations
      getScreenSources: () => Promise<ScreenSource[]>
      getAudioDevices: () => Promise<MediaDeviceInfo[]>
      startRecording: (options: RecordingOptions) => Promise<{ success: boolean; error?: string }>
      stopRecording: () => Promise<{ success: boolean; filePath?: string; error?: string }>
      pauseRecording: () => Promise<{ success: boolean; error?: string }>
      resumeRecording: () => Promise<{ success: boolean; error?: string }>
      getRecordingState: () => Promise<RecordingState>
      saveRecordingData: (
        data: ArrayBuffer,
        fileName: string
      ) => Promise<{ success: boolean; filePath?: string; error?: string }>
      getRecordingQualitySettings: () => Promise<Record<string, RecordingQuality>>
      cleanupRecordings: () => Promise<{ success: boolean; cleanedFiles?: number; error?: string }>

      // Recording file management (auto-import, metadata, cleanup)
      getRecordedVideos: () => Promise<any[]>
      importRecording: (
        filePath: string,
        metadata?: any
      ) => Promise<{ success: boolean; clipData?: any; error?: string }>
      getRecordingMetadata: (filePath: string) => Promise<any | null>
      deleteRecording: (filePath: string) => Promise<{ success: boolean; error?: string }>

      // Recording event listeners
      onRecordingStateChanged: (callback: (state: RecordingState) => void) => () => void
      onRecordingStopped: (
        callback: (data: { filePath: string; duration: number }) => void
      ) => () => void
      onRecordingDataSaved: (callback: (data: { filePath: string }) => void) => () => void
    }
  }
}
