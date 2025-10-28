import path from 'path'
import fs from 'fs'

/**
 * Platform detection and FFmpeg binary path resolution
 */

export type Platform = 'darwin' | 'win32' | 'linux'
export type Architecture = 'arm64' | 'x64'

export interface PlatformInfo {
  platform: Platform
  architecture: Architecture
  binaryName: string
}

/**
 * Get current platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const currentPlatform = process.platform as Platform
  const currentArch = process.arch as Architecture

  let binaryName: string
  if (currentPlatform === 'darwin') {
    binaryName = currentArch === 'arm64' ? 'ffmpeg-mac-arm64' : 'ffmpeg-mac-x64'
  } else if (currentPlatform === 'win32') {
    binaryName = 'ffmpeg-win.exe'
  } else {
    binaryName = 'ffmpeg-linux'
  }

  return {
    platform: currentPlatform,
    architecture: currentArch,
    binaryName
  }
}

/**
 * Get FFmpeg binary path based on current platform
 */
export function getFFmpegPath(): string {
  const isDev = process.env.NODE_ENV === 'development'
  let resourcesPath: string

  if (isDev) {
    resourcesPath = path.join(__dirname, '../../resources/ffmpeg')
  } else {
    // In production, FFmpeg binaries are in app.asar.unpacked/resources/ffmpeg/
    resourcesPath = process.resourcesPath
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'ffmpeg')
      : path.join(__dirname, '../../resources/ffmpeg')
  }

  const { binaryName } = getPlatformInfo()
  return path.join(resourcesPath, binaryName)
}

/**
 * Get FFprobe binary path based on current platform
 */
export function getFFprobePath(): string {
  const isDev = process.env.NODE_ENV === 'development'
  let resourcesPath: string

  if (isDev) {
    resourcesPath = path.join(__dirname, '../../resources/ffmpeg')
  } else {
    // In production, FFmpeg binaries are in app.asar.unpacked/resources/ffmpeg/
    resourcesPath = process.resourcesPath
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'ffmpeg')
      : path.join(__dirname, '../../resources/ffmpeg')
  }

  const { platform, architecture } = getPlatformInfo()
  let binaryName: string
  if (platform === 'darwin') {
    binaryName = architecture === 'arm64' ? 'ffprobe-mac-arm64' : 'ffprobe-mac-x64'
  } else if (platform === 'win32') {
    binaryName = 'ffprobe-win.exe'
  } else {
    binaryName = 'ffprobe-linux'
  }

  return path.join(resourcesPath, binaryName)
}

/**
 * Validate that FFmpeg binary exists and is executable
 */
export function validateFFmpegBinary(): boolean {
  try {
    const ffmpegPath = getFFmpegPath()
    fs.accessSync(ffmpegPath, fs.constants.F_OK | fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Validate that FFprobe binary exists and is executable
 */
export function validateFFprobeBinary(): boolean {
  try {
    const ffprobePath = getFFprobePath()
    fs.accessSync(ffprobePath, fs.constants.F_OK | fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Get platform-specific error message for missing binaries
 */
export function getMissingBinaryError(): string {
  const { platform: currentPlatform, architecture } = getPlatformInfo()

  if (currentPlatform === 'darwin') {
    return `FFmpeg binary not found for macOS ${architecture}. Please ensure the binary is placed in resources/ffmpeg/`
  } else if (currentPlatform === 'win32') {
    return 'FFmpeg binary not found for Windows. Please ensure ffmpeg-win.exe is placed in resources/ffmpeg/'
  } else {
    return 'FFmpeg binary not found for Linux. Please ensure ffmpeg-linux is placed in resources/ffmpeg/'
  }
}
