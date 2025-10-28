import { ElectronAPI } from '@electron-toolkit/preload'
import {
  VideoMetadata,
  TrimExportParams,
  ExportProgress,
  VideoThumbnailParams,
  ConvertVideoParams
} from '../types/video'

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
    }
  }
}
