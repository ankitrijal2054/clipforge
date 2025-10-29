import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import { getFFmpegPath, validateFFmpegBinary, getMissingBinaryError } from './platform'
import { getVideoMetadata } from './metadata'
import { TimelineClip } from '../../types/timeline'
import type { VideoClip } from '../../types/video'

/**
 * Interface for timeline export parameters
 */
export interface TimelineExportParams {
  videoClips: TimelineClip[]
  audioClips: TimelineClip[]
  isMuted: {
    video: boolean
    audio: boolean
  }
  outputPath: string
  quality: 'high' | 'medium' | 'low'
}

/**
 * Interface for progress tracking
 */
export interface ExportProgress {
  phase: string
  progress: number
  totalPhases: number
}

/**
 * Helper function to create a unique temp directory for this export
 */
async function createExportTempDir(): Promise<string> {
  const timestamp = Date.now()
  const tempDir = path.join(os.tmpdir(), `clipforge-export-${timestamp}`)
  await fs.mkdir(tempDir, { recursive: true })
  return tempDir
}

/**
 * Extract a single segment from a source video using FFmpeg
 * Uses stream copy (-c copy) for speed
 *
 * @param sourceFile - Path to source video file
 * @param trimStart - Start time in seconds
 * @param trimEnd - End time in seconds
 * @param outputFile - Path to output segment
 */
async function extractSegment(
  sourceFile: string,
  trimStart: number,
  trimEnd: number,
  outputFile: string
): Promise<void> {
  if (!validateFFmpegBinary()) {
    throw new Error(getMissingBinaryError())
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getFFmpegPath(), [
      '-i',
      sourceFile,
      '-ss',
      trimStart.toString(),
      '-to',
      trimEnd.toString(),
      '-c',
      'copy', // Stream copy for speed
      '-avoid_negative_ts',
      'make_zero',
      outputFile
    ])

    let errorOutput = ''

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString()
      // Could parse progress here if needed
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg segment extraction failed: ${errorOutput}`))
      }
    })

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg for segment extraction: ${error.message}`))
    })
  })
}

/**
 * Extract a single AUDIO segment from a source media using FFmpeg
 * Forces consistent PCM WAV output to guarantee safe concatenation later
 */
async function extractAudioSegment(
  sourceFile: string,
  trimStart: number,
  trimEnd: number,
  outputFile: string
): Promise<void> {
  if (!validateFFmpegBinary()) {
    throw new Error(getMissingBinaryError())
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getFFmpegPath(), [
      '-i',
      sourceFile,
      '-ss',
      trimStart.toString(),
      '-to',
      trimEnd.toString(),
      '-vn', // drop any video
      '-acodec',
      'pcm_s16le', // WAV PCM 16-bit
      '-ar',
      '48000', // 48kHz sample rate
      '-ac',
      '2', // stereo
      outputFile
    ])

    let errorOutput = ''

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg audio segment extraction failed: ${errorOutput}`))
      }
    })

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg for audio extraction: ${error.message}`))
    })
  })
}

/**
 * Create an FFmpeg concat demuxer file
 * Format: "file '/absolute/path/to/file.mp4'\n"
 *
 * @param segments - Array of segment file paths (must be absolute)
 * @param outputFile - Path to concat.txt file to create
 */
async function createConcatFile(segments: string[], outputFile: string): Promise<void> {
  const concatContent = segments.map((segment) => `file '${segment}'`).join('\n')
  await fs.writeFile(outputFile, concatContent, 'utf-8')
}

/**
 * Concatenate segments using FFmpeg concat demuxer
 * Uses stream copy (-c copy) for speed
 *
 * @param concatFile - Path to concat.txt file
 * @param outputFile - Path to output video
 */
async function concatSegments(concatFile: string, outputFile: string): Promise<void> {
  if (!validateFFmpegBinary()) {
    throw new Error(getMissingBinaryError())
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getFFmpegPath(), [
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatFile,
      '-c',
      'copy',
      outputFile
    ])

    let errorOutput = ''

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString()
      // Could parse progress here if needed
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg concat failed: ${errorOutput}`))
      }
    })

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg for concat: ${error.message}`))
    })
  })
}

/**
 * Mix video and audio tracks using FFmpeg
 * Handles duration mismatch with -shortest flag
 *
 * @param videoFile - Path to video file (may contain audio that will be replaced)
 * @param audioFile - Path to audio file
 * @param outputFile - Path to output video
 * @param quality - Quality setting (affects audio encoding)
 * @param onProgress - Progress callback
 */
async function mixAudioVideo(
  videoFile: string,
  audioFile: string,
  outputFile: string,
  quality: 'high' | 'medium' | 'low' = 'high',
  options?: { videoDurationSec?: number }
): Promise<void> {
  if (!validateFFmpegBinary()) {
    throw new Error(getMissingBinaryError())
  }

  // Audio codec quality settings
  const audioQuality = quality === 'high' ? '192k' : quality === 'medium' ? '128k' : '96k'

  return new Promise((resolve, reject) => {
    const videoDuration = Math.max(0, options?.videoDurationSec ?? 0)
    const args = [
      '-i',
      videoFile,
      '-i',
      audioFile,
      // Pad external audio with silence, then trim exactly to video duration
      '-filter_complex',
      `[1:a]apad,atrim=0:${videoDuration},asetpts=PTS-STARTPTS[aud]`,
      '-map',
      '0:v:0',
      '-map',
      '[aud]',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      audioQuality,
      '-avoid_negative_ts',
      'make_zero',
      outputFile
    ]

    const ffmpeg = spawn(getFFmpegPath(), args)

    let errorOutput = ''

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg audio mix failed: ${errorOutput}`))
      }
    })

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg for audio mix: ${error.message}`))
    })
  })
}

/**
 * Clean up temporary export directory
 * Does not throw if directory doesn't exist
 */
async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    const files = await fs.readdir(tempDir)
    for (const file of files) {
      await fs.unlink(path.join(tempDir, file))
    }
    await fs.rmdir(tempDir)
  } catch {
    // Ignore cleanup errors - directory may have already been deleted
  }
}

/**
 * Main export function for timeline with multiple clips
 *
 * Flow:
 * 1. Validate timeline has at least one clip
 * 2. Create temp directory
 * 3. Phase 1 (25%): Extract video segments from all clips
 * 4. Phase 2 (5%): Create concat demuxer file
 * 5. Phase 3 (25%): Concat video segments
 * 6. Phase 4 (15%): Extract audio segments (if needed)
 * 7. Phase 5 (20%): Mix audio + video (if needed)
 * 8. Phase 6 (10%): Cleanup temp files
 * 9. Return output path
 *
 * @param params - Timeline export parameters
 * @param onProgress - Progress callback for UI updates
 */
export async function exportTimeline(
  params: TimelineExportParams & { clips: VideoClip[] }, // clips from library
  onProgress?: (progress: ExportProgress) => void
): Promise<string> {
  const { videoClips, audioClips, isMuted, outputPath, quality, clips: libraryClips } = params

  // Validation
  if (!validateFFmpegBinary()) {
    throw new Error(getMissingBinaryError())
  }

  if (videoClips.length === 0 && audioClips.length === 0) {
    throw new Error('Timeline is empty - add at least one clip to export')
  }

  // Create temp directory
  const tempDir = await createExportTempDir()

  try {
    const phases = {
      extractVideo: 'Extracting video segments...',
      createConcat: 'Preparing concat file...',
      concatVideo: 'Concatenating video...',
      extractAudio: 'Extracting audio segments...',
      mixAudio: 'Mixing audio with video...',
      cleanup: 'Cleaning up temporary files...'
    }

    let totalProgress = 0

    // Phase 1: Extract video segments (25%)
    onProgress?.({ phase: phases.extractVideo, progress: totalProgress, totalPhases: 6 })

    const videoSegments: string[] = []
    for (let i = 0; i < videoClips.length; i++) {
      const clip = videoClips[i]
      const libraryClip = libraryClips.find((c) => c.id === clip.libraryId)

      if (!libraryClip) {
        throw new Error(`Source file not found for clip ${clip.id}`)
      }

      const segmentPath = path.join(tempDir, `video_${i}.mp4`)
      await extractSegment(libraryClip.path, clip.trimStart, clip.trimEnd, segmentPath)
      videoSegments.push(segmentPath)

      // Update progress for this phase
      totalProgress = 25 * ((i + 1) / videoClips.length)
      onProgress?.({ phase: phases.extractVideo, progress: totalProgress, totalPhases: 6 })
    }

    // Phase 2: Create concat file (5%)
    totalProgress = 25
    onProgress?.({ phase: phases.createConcat, progress: totalProgress, totalPhases: 6 })

    const concatFile = path.join(tempDir, 'concat.txt')
    await createConcatFile(videoSegments, concatFile)

    // Phase 3: Concat video segments (25%)
    totalProgress = 30
    onProgress?.({ phase: phases.concatVideo, progress: totalProgress, totalPhases: 6 })

    const videoOutput = path.join(tempDir, 'video_concat.mp4')
    await concatSegments(concatFile, videoOutput)

    totalProgress = 55

    // Phase 4 & 5: Handle audio (15% + 20%)
    let finalOutput = videoOutput

    if (audioClips.length > 0 && !isMuted.audio) {
      onProgress?.({ phase: phases.extractAudio, progress: totalProgress, totalPhases: 6 })

      const audioSegments: string[] = []
      for (let i = 0; i < audioClips.length; i++) {
        const clip = audioClips[i]
        const libraryClip = libraryClips.find((c) => c.id === clip.libraryId)

        if (!libraryClip) {
          throw new Error(`Source file not found for audio clip ${clip.id}`)
        }

        const segmentPath = path.join(tempDir, `audio_${i}.wav`)
        await extractAudioSegment(libraryClip.path, clip.trimStart, clip.trimEnd, segmentPath)
        audioSegments.push(segmentPath)

        totalProgress = 55 + 15 * ((i + 1) / audioClips.length)
        onProgress?.({ phase: phases.extractAudio, progress: totalProgress, totalPhases: 6 })
      }

      // Concat audio segments if multiple
      let audioOutput: string
      if (audioSegments.length === 1) {
        audioOutput = audioSegments[0]
      } else {
        audioOutput = path.join(tempDir, 'audio_concat.wav')
        const audioConcatFile = path.join(tempDir, 'audio_concat.txt')
        await createConcatFile(audioSegments, audioConcatFile)

        onProgress?.({ phase: phases.extractAudio, progress: 70, totalPhases: 6 })
        await concatSegments(audioConcatFile, audioOutput)
      }

      // Mix audio with video
      totalProgress = 70
      onProgress?.({ phase: phases.mixAudio, progress: totalProgress, totalPhases: 6 })

      finalOutput = outputPath // Final output is the mixed file

      // Get actual concatenated video duration via FFprobe to avoid keyframe rounding issues
      const videoMeta = await getVideoMetadata(videoOutput)
      const totalVideoDuration = Number.isFinite(videoMeta.duration)
        ? videoMeta.duration
        : videoClips.reduce((sum, c) => sum + (c.trimEnd - c.trimStart), 0)

      await mixAudioVideo(videoOutput, audioOutput, finalOutput, quality, {
        videoDurationSec: totalVideoDuration
      })

      totalProgress = 90
      onProgress?.({ phase: phases.mixAudio, progress: totalProgress, totalPhases: 6 })
    } else if (videoClips.length > 0) {
      // No audio overlay (either none or muted)
      if (!isMuted.video) {
        // Keep original concatenated video (with its embedded audio)
        await fs.rename(videoOutput, outputPath)
        finalOutput = outputPath
        totalProgress = 90
      } else {
        // Video track is muted – strip audio from the concatenated video
        const mutedOutput = outputPath
        await new Promise<void>((resolve, reject) => {
          const ff = spawn(getFFmpegPath(), [
            '-i',
            videoOutput,
            '-c:v',
            'copy',
            '-an', // no audio
            '-avoid_negative_ts',
            'make_zero',
            mutedOutput
          ])
          let err = ''
          ff.stderr.on('data', (d) => (err += d.toString()))
          ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err))))
          ff.on('error', (e) => reject(e))
        })
        finalOutput = mutedOutput
        totalProgress = 90
      }
    }

    // Phase 6: Cleanup (10%)
    totalProgress = 90
    onProgress?.({ phase: phases.cleanup, progress: totalProgress, totalPhases: 6 })

    await cleanupTempDir(tempDir)

    totalProgress = 100
    onProgress?.({ phase: 'Export complete!', progress: totalProgress, totalPhases: 6 })

    return finalOutput
  } catch (error) {
    // Cleanup on error
    try {
      await cleanupTempDir(tempDir)
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}
