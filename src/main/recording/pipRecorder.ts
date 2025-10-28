// Picture-in-Picture (PiP) recording implementation
// Combines screen capture with webcam overlay using Canvas API
import type { RecordingOptions, PiPOptions } from '../../types/recording'
import { DEFAULT_PIP_OPTIONS } from '../../types/recording'
import { generateRecordingFileName } from './mediaRecorder'

export interface PiPRecordingSession {
  screenStream: MediaStream
  webcamStream: MediaStream
  canvas: HTMLCanvasElement
  canvasStream: MediaStream
  screenVideoElement: HTMLVideoElement
  webcamVideoElement: HTMLVideoElement
  animationFrameId: number | null
  quality: RecordingOptions['quality']
  pipOptions: PiPOptions
  startTime: number
}

/**
 * Create canvas for PiP composition
 */
export function createPiPCanvas(width: number = 1920, height: number = 1080): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.style.display = 'none' // Hide from DOM

  // Ensure canvas is in document for some browsers
  if (typeof document !== 'undefined') {
    document.body.appendChild(canvas)
  }

  return canvas
}

/**
 * Create video element for stream playback
 */
export function createVideoElement(): HTMLVideoElement {
  const video = document.createElement('video')
  video.autoplay = true
  video.muted = true
  video.playsInline = true
  video.style.display = 'none'

  return video
}

/**
 * Calculate PiP position on canvas
 */
export function calculatePiPPosition(
  canvasWidth: number,
  canvasHeight: number,
  pipWidth: number,
  pipHeight: number,
  position: PiPOptions['position'],
  margin: number = 20
): { x: number; y: number } {
  switch (position) {
    case 'bottom-right':
      return {
        x: canvasWidth - pipWidth - margin,
        y: canvasHeight - pipHeight - margin
      }
    case 'bottom-left':
      return {
        x: margin,
        y: canvasHeight - pipHeight - margin
      }
    case 'top-right':
      return {
        x: canvasWidth - pipWidth - margin,
        y: margin
      }
    case 'top-left':
      return {
        x: margin,
        y: margin
      }
    default:
      return { x: canvasWidth - pipWidth - margin, y: canvasHeight - pipHeight - margin }
  }
}

/**
 * Draw rounded rectangle on canvas
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Composite screen and webcam streams on canvas
 */
export function createPiPCompositor(
  canvas: HTMLCanvasElement,
  screenVideo: HTMLVideoElement,
  webcamVideo: HTMLVideoElement,
  pipOptions: PiPOptions = DEFAULT_PIP_OPTIONS
): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  const pipPosition = calculatePiPPosition(
    canvas.width,
    canvas.height,
    pipOptions.size.width,
    pipOptions.size.height,
    pipOptions.position
  )

  const drawFrame = () => {
    // Draw screen video (background)
    if (screenVideo.readyState === screenVideo.HAVE_ENOUGH_DATA) {
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
    }

    // Draw PiP webcam overlay
    if (webcamVideo.readyState === webcamVideo.HAVE_ENOUGH_DATA) {
      ctx.save()

      // Add shadow if enabled
      if (pipOptions.shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      }

      // Draw rounded rectangle background
      drawRoundedRect(
        ctx,
        pipPosition.x,
        pipPosition.y,
        pipOptions.size.width,
        pipOptions.size.height,
        pipOptions.borderRadius
      )

      // Fill with border
      ctx.strokeStyle = pipOptions.borderColor
      ctx.lineWidth = pipOptions.borderWidth
      ctx.stroke()

      // Clip to rounded rectangle
      ctx.clip()

      // Draw webcam video
      ctx.drawImage(
        webcamVideo,
        pipPosition.x,
        pipPosition.y,
        pipOptions.size.width,
        pipOptions.size.height
      )

      ctx.restore()
    }

    return requestAnimationFrame(drawFrame)
  }

  return drawFrame
}

/**
 * Start compositing frames
 */
export function startPiPCompositing(compositor: () => number): number {
  return compositor()
}

/**
 * Stop compositing frames
 */
export function stopPiPCompositing(animationFrameId: number): void {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
}

/**
 * Capture canvas as media stream
 */
export function captureCanvasStream(
  canvas: HTMLCanvasElement,
  frameRate: number = 30
): MediaStream {
  try {
    const stream = canvas.captureStream(frameRate)
    if (!stream) {
      throw new Error('Canvas.captureStream() returned null')
    }
    return stream
  } catch (error) {
    throw new Error(
      `Failed to capture canvas stream: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Combine canvas video stream with audio from sources
 */
export function createPiPMediaStream(
  canvasStream: MediaStream,
  screenAudio: MediaStream | null,
  webcamAudio: MediaStream | null,
  audioContext: AudioContext | null
): MediaStream {
  // Get video track from canvas
  const videoTrack = canvasStream.getVideoTracks()[0]
  if (!videoTrack) {
    throw new Error('Canvas stream has no video track')
  }

  // Create composite stream with video
  const compositeStream = new MediaStream()
  compositeStream.addTrack(videoTrack)

  // If we have audio context, mix audio from both sources
  if (audioContext && (screenAudio || webcamAudio)) {
    // Create audio track from canvas context
    const audioDestination = audioContext.createMediaStreamDestination()

    // Connect screen audio if available
    if (screenAudio) {
      const screenSource = audioContext.createMediaStreamSource(screenAudio)
      screenSource.connect(audioDestination)
    }

    // Connect webcam audio if available
    if (webcamAudio) {
      const webcamSource = audioContext.createMediaStreamSource(webcamAudio)
      webcamSource.connect(audioDestination)
    }

    // Add mixed audio to composite stream
    const audioTrack = audioDestination.stream.getAudioTracks()[0]
    if (audioTrack) {
      compositeStream.addTrack(audioTrack)
    }
  } else if (screenAudio) {
    // If no audio context, try to use screen audio directly
    const audioTrack = screenAudio.getAudioTracks()[0]
    if (audioTrack) {
      compositeStream.addTrack(audioTrack)
    }
  }

  return compositeStream
}

/**
 * Validate PiP recording setup
 */
export function validatePiPRecordingSetup(
  screenStream: MediaStream,
  webcamStream: MediaStream,
  quality: RecordingOptions['quality']
): { valid: boolean; error?: string } {
  // Validate screen stream
  if (!screenStream || screenStream.getTracks().length === 0) {
    return { valid: false, error: 'Screen stream is not active' }
  }

  const screenVideoTrack = screenStream.getVideoTracks()[0]
  if (!screenVideoTrack || !screenVideoTrack.enabled) {
    return { valid: false, error: 'Screen video track is not available or disabled' }
  }

  // Validate webcam stream
  if (!webcamStream || webcamStream.getTracks().length === 0) {
    return { valid: false, error: 'Webcam stream is not active' }
  }

  const webcamVideoTrack = webcamStream.getVideoTracks()[0]
  if (!webcamVideoTrack || !webcamVideoTrack.enabled) {
    return { valid: false, error: 'Webcam video track is not available or disabled' }
  }

  // Validate quality
  const validQualities = ['high', 'medium', 'low']
  if (!validQualities.includes(quality)) {
    return { valid: false, error: 'Invalid quality setting' }
  }

  return { valid: true }
}

/**
 * Get PiP recording filename
 */
export function getPiPRecordingFileName(): string {
  return generateRecordingFileName('pip')
}

/**
 * Cleanup PiP recording resources
 */
export function cleanupPiPResources(session: Partial<PiPRecordingSession>): void {
  try {
    // Stop animation frame
    if (session.animationFrameId) {
      cancelAnimationFrame(session.animationFrameId)
    }

    // Stop all stream tracks
    if (session.screenStream) {
      session.screenStream.getTracks().forEach((track) => track.stop())
    }

    if (session.webcamStream) {
      session.webcamStream.getTracks().forEach((track) => track.stop())
    }

    // Remove video elements
    if (session.screenVideoElement?.parentNode) {
      session.screenVideoElement.parentNode.removeChild(session.screenVideoElement)
    }

    if (session.webcamVideoElement?.parentNode) {
      session.webcamVideoElement.parentNode.removeChild(session.webcamVideoElement)
    }

    // Remove canvas
    if (session.canvas?.parentNode) {
      session.canvas.parentNode.removeChild(session.canvas)
    }
  } catch (error) {
    console.error('Error cleaning up PiP resources:', error)
  }
}

/**
 * Estimate PiP file size
 */
export function estimatePiPFileSize(
  durationSeconds: number,
  quality: RecordingOptions['quality']
): string {
  const bitrateMap: Record<string, number> = {
    high: 8000000, // Higher bitrate for composite video
    medium: 4000000,
    low: 2000000
  }

  const bitrate = bitrateMap[quality] || bitrateMap.medium
  const bytes = (durationSeconds * bitrate) / 8
  const mb = bytes / (1024 * 1024)

  return `~${mb.toFixed(1)} MB`
}
