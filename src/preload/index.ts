import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
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
    ipcRenderer.invoke('dialog:openFolder', folderPath),

  // Recording operations
  getScreenSources: (): Promise<ScreenSource[]> => ipcRenderer.invoke('recording:getSources'),

  getAudioDevices: (): Promise<MediaDeviceInfo[]> =>
    ipcRenderer.invoke('recording:getAudioDevices'),

  startRecording: (options: RecordingOptions): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('recording:start', options),

  stopRecording: (): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('recording:stop'),

  pauseRecording: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('recording:pause'),

  resumeRecording: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('recording:resume'),

  getRecordingState: (): Promise<RecordingState> => ipcRenderer.invoke('recording:getState'),

  saveRecordingData: (
    data: ArrayBuffer,
    fileName: string,
    recordingDuration?: number
  ): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('recording:saveData', data, fileName, recordingDuration),

  getRecordingQualitySettings: (): Promise<Record<string, RecordingQuality>> =>
    ipcRenderer.invoke('recording:getQualitySettings'),

  cleanupRecordings: (): Promise<{ success: boolean; cleanedFiles?: number; error?: string }> =>
    ipcRenderer.invoke('recording:cleanup'),

  // Recording file management (auto-import, metadata, cleanup)
  getRecordedVideos: (): Promise<any[]> => ipcRenderer.invoke('recording:getRecordedVideos'),

  importRecording: (
    filePath: string,
    metadata?: any
  ): Promise<{ success: boolean; clipData?: any; error?: string }> =>
    ipcRenderer.invoke('recording:importRecording', filePath, metadata),

  getRecordingMetadata: (filePath: string): Promise<any | null> =>
    ipcRenderer.invoke('recording:getMetadata', filePath),

  deleteRecording: (filePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('recording:delete', filePath),

  // Recording event listeners
  onRecordingStateChanged: (callback: (state: RecordingState) => void): (() => void) => {
    const handler = (_event: any, state: RecordingState) => callback(state)
    ipcRenderer.on('recording:stateChanged', handler)
    return () => ipcRenderer.removeListener('recording:stateChanged', handler)
  },

  onRecordingStopped: (
    callback: (data: { filePath: string; duration: number }) => void
  ): (() => void) => {
    const handler = (_event: any, data: { filePath: string; duration: number }) => callback(data)
    ipcRenderer.on('recording:stopped', handler)
    return () => ipcRenderer.removeListener('recording:stopped', handler)
  },

  onRecordingDataSaved: (callback: (data: { filePath: string }) => void): (() => void) => {
    const handler = (_event: any, data: { filePath: string }) => callback(data)
    ipcRenderer.on('recording:dataSaved', handler)
    return () => ipcRenderer.removeListener('recording:dataSaved', handler)
  }
}

// Combine electronAPI with custom export APIs for ExportModal
const combinedAPI = {
  ...api,
  // These are the same, but expose them for ExportModal
  selectExportPath: api.selectExportPath,
  openFolder: api.openFolder
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', combinedAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.electronAPI = combinedAPI
}
