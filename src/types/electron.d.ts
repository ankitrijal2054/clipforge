import {
  VideoMetadata,
  TrimExportParams,
  ExportProgress,
  VideoThumbnailParams,
  ConvertVideoParams
} from './video'

export interface ElectronAPI {
  getVideoMetadata: (path: string) => Promise<VideoMetadata>
  trimExport: (params: TrimExportParams) => Promise<string>
  selectVideoFile: () => Promise<string | undefined>
  selectExportPath: (defaultName: string) => Promise<string | undefined>
  onExportProgress: (callback: (progress: number) => void) => void
  openFolder: (path: string) => Promise<void>
}

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
    }
  }
}

export {}
