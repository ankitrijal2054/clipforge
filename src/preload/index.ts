import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  VideoMetadata,
  TrimExportParams,
  ExportProgress,
  VideoThumbnailParams,
  ConvertVideoParams
} from '../types/video'

// Custom APIs for renderer
const api = {
  // Video metadata operations
  getVideoMetadata: (filePath: string): Promise<VideoMetadata> =>
    ipcRenderer.invoke('video:getMetadata', { filePath }),

  // Video thumbnail generation
  getVideoThumbnail: (params: VideoThumbnailParams): Promise<string> =>
    ipcRenderer.invoke('video:getThumbnail', params),

  // Video trimming and export
  trimExport: (params: TrimExportParams): Promise<string> =>
    ipcRenderer.invoke('video:trimExport', params),

  // Video conversion
  convertVideo: (params: ConvertVideoParams): Promise<string> =>
    ipcRenderer.invoke('video:convert', params),

  // Progress event listeners
  onExportProgress: (callback: (progress: ExportProgress) => void): (() => void) => {
    const handler = (_event: any, progress: ExportProgress) => callback(progress)
    ipcRenderer.on('video:exportProgress', handler)
    return () => ipcRenderer.removeListener('video:exportProgress', handler)
  },

  onConvertProgress: (callback: (progress: ExportProgress) => void): (() => void) => {
    const handler = (_event: any, progress: ExportProgress) => callback(progress)
    ipcRenderer.on('video:convertProgress', handler)
    return () => ipcRenderer.removeListener('video:convertProgress', handler)
  },

  // File dialog operations
  selectVideoFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectVideo'),

  selectExportPath: (defaultFilename: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:selectExportPath', defaultFilename),

  openFolder: (folderPath: string): Promise<void> =>
    ipcRenderer.invoke('dialog:openFolder', folderPath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
