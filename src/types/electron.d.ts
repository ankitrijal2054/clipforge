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
    electronAPI: ElectronAPI
  }
}

export {}
