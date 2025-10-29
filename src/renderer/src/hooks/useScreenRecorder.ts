// useScreenRecorder - Handles actual recording capture for screen, webcam, and PiP
import { useCallback, useRef, useState } from 'react'
import type { RecordingOptions } from '../../../types/recording'

interface ScreenRecorderState {
  isRecording: boolean
  isPaused: boolean
  recordingStream: MediaStream | null
  mediaRecorder: MediaRecorder | null
  chunks: Blob[]
  recordingData: Blob | null
}

export function useScreenRecorder() {
  const [state, setState] = useState<ScreenRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingStream: null,
    mediaRecorder: null,
    chunks: [],
    recordingData: null
  })

  const stateRef = useRef(state)
  stateRef.current = state

  /**
   * Get recording stream based on recording type
   */
  const getRecordingStream = useCallback(
    async (options: RecordingOptions): Promise<MediaStream> => {
      let stream: MediaStream | null = null

      try {
        if (options.type === 'screen') {
          // Screen recording using Electron's desktopCapturer
          if (!options.sourceId) {
            throw new Error('Screen source ID is required for screen recording')
          }

          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop' as any,
                  chromeMediaSourceId: options.sourceId,
                  minWidth: 1280,
                  maxWidth: 1920,
                  minHeight: 720,
                  maxHeight: 1080
                }
              } as any
            })
          } catch (error) {
            // Fallback to getDisplayMedia
            try {
              stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                  displaySurface: 'monitor' as any
                },
                audio: false
              } as any)
            } catch (fallbackError) {
              throw new Error(
                `Failed to get screen: ${error instanceof Error ? error.message : 'Unknown error'}`
              )
            }
          }
        } else if (options.type === 'pip') {
          // Picture-in-Picture: get both screen and webcam streams
          if (!options.sourceId) {
            throw new Error('Screen source ID is required for PiP recording')
          }
          if (!options.webcamDeviceId) {
            throw new Error('Webcam device ID is required for PiP recording')
          }

          // Get screen stream
          let screenStream: MediaStream
          try {
            screenStream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop' as any,
                  chromeMediaSourceId: options.sourceId,
                  minWidth: 1280,
                  maxWidth: 1920,
                  minHeight: 720,
                  maxHeight: 1080
                }
              } as any
            })
          } catch (error) {
            throw new Error(
              `Failed to get screen for PiP: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }

          // Get webcam stream
          let webcamStream: MediaStream
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Webcam timeout')), 5000)
            )

            webcamStream = await Promise.race([
              navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: { exact: options.webcamDeviceId }
                } as any,
                audio: true
              }) as Promise<MediaStream>,
              timeoutPromise as Promise<MediaStream>
            ])
          } catch (error) {
            throw new Error(
              `Failed to get webcam for PiP: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }

          // Create canvas for compositing
          const canvas = document.createElement('canvas')
          canvas.width = 1920
          canvas.height = 1080

          // Create video elements
          const screenVideo = document.createElement('video')
          screenVideo.autoplay = true
          screenVideo.muted = true
          screenVideo.playsInline = true
          screenVideo.srcObject = screenStream

          const webcamVideo = document.createElement('video')
          webcamVideo.autoplay = true
          webcamVideo.muted = true
          webcamVideo.playsInline = true
          webcamVideo.srcObject = webcamStream

          // Start drawing frames
          const ctx = canvas.getContext('2d')!
          const drawFrame = () => {
            if (screenVideo.readyState === screenVideo.HAVE_ENOUGH_DATA) {
              ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
            }

            if (webcamVideo.readyState === webcamVideo.HAVE_ENOUGH_DATA) {
              // Draw webcam in bottom-right corner (PiP)
              const pipWidth = 320
              const pipHeight = 180
              const pipX = canvas.width - pipWidth - 20
              const pipY = canvas.height - pipHeight - 20

              ctx.save()
              ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
              ctx.shadowBlur = 10
              ctx.drawImage(webcamVideo, pipX, pipY, pipWidth, pipHeight)
              ctx.restore()
            }

            requestAnimationFrame(drawFrame)
          }
          drawFrame()

          // Get canvas stream and combine with audio
          const canvasStream = canvas.captureStream(30)
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

          // Mix audio from screen and webcam
          const screenAudioTrack = screenStream.getAudioTracks()[0]
          const webcamAudioTrack = webcamStream.getAudioTracks()[0]

          if (screenAudioTrack || webcamAudioTrack) {
            const destination = audioContext.createMediaStreamDestination()

            if (screenAudioTrack) {
              const source = audioContext.createMediaStreamSource(screenStream)
              source.connect(destination)
            }

            if (webcamAudioTrack) {
              const source = audioContext.createMediaStreamSource(webcamStream)
              source.connect(destination)
            }

            const audioTrack = destination.stream.getAudioTracks()[0]
            if (audioTrack) {
              canvasStream.addTrack(audioTrack)
            }
          }

          stream = canvasStream
        } else if (options.type === 'webcam') {
          // Webcam recording
          if (!options.webcamDeviceId) {
            throw new Error('Webcam device ID is required for webcam recording')
          }

          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Webcam timeout')), 5000)
            )

            stream = await Promise.race([
              navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: { exact: options.webcamDeviceId }
                } as any,
                audio: true
              }) as Promise<MediaStream>,
              timeoutPromise as Promise<MediaStream>
            ])
          } catch (error) {
            throw new Error(
              `Failed to get webcam: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        }

        if (!stream) {
          throw new Error('Failed to get recording stream - no stream object')
        }

        console.log('Stream tracks:', {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        })

        // Add audio for screen recording if specified
        if (options.type === 'screen' && options.audioDeviceId) {
          try {
            console.log('Adding audio track for screen recording...')
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: { exact: options.audioDeviceId } } as any,
              video: false
            })
            const audioTrack = audioStream.getAudioTracks()[0]
            if (audioTrack) {
              stream.addTrack(audioTrack)
              console.log('Audio track added successfully')
            }
          } catch (error) {
            console.warn('Failed to add audio track:', error)
          }
        }

        return stream
      } catch (error) {
        console.error('getRecordingStream error:', error)
        throw error
      }
    },
    []
  )

  /**
   * Start recording
   */
  const startScreenRecording = useCallback(
    async (options: RecordingOptions) => {
      try {
        if (stateRef.current.isRecording) {
          throw new Error('Recording already in progress')
        }

        console.log('Getting recording stream for type:', options.type)

        // Get the appropriate stream
        const recordingStream = await getRecordingStream(options)

        console.log('Got recording stream, creating MediaRecorder')

        // Create MediaRecorder
        const mimeType = 'video/webm;codecs=vp9'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error(`Unsupported MIME type: ${mimeType}`)
        }

        const chunks: Blob[] = []
        const recordingStartTime = Date.now() // Track when recording started
        const mediaRecorder = new MediaRecorder(recordingStream, {
          mimeType,
          videoBitsPerSecond:
            options.quality === 'high' ? 5000000 : options.quality === 'medium' ? 2500000 : 1000000
        })

        // Handle data available
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
            console.log('Recording data chunk:', event.data.size, 'bytes')
          }
        }

        // Handle stop
        mediaRecorder.onstop = async () => {
          console.log('MediaRecorder stopped, total chunks:', chunks.length)
          console.log(
            'Chunks data:',
            chunks.map((c) => c.size)
          )

          if (chunks.length === 0) {
            console.error('ERROR: No data chunks collected during recording!')
            return
          }

          const recordingData = new Blob(chunks, { type: mimeType })
          console.log('Created blob, size:', recordingData.size)

          setState((prev) => ({
            ...prev,
            recordingData,
            isRecording: false
          }))

          // Save the recording
          try {
            const fileName = `recording-${Date.now()}.webm`
            const recordingDuration = (Date.now() - recordingStartTime) / 1000 // Duration in seconds

            console.log('Preparing to save recording...')
            console.log('File name:', fileName)
            console.log('Blob size:', recordingData.size)
            console.log('Recording duration:', recordingDuration.toFixed(2), 'seconds')

            const arrayBuffer = await recordingData.arrayBuffer()
            console.log('Converted to ArrayBuffer, size:', arrayBuffer.byteLength)

            const result = await (window.api as any).saveRecordingData(
              arrayBuffer,
              fileName,
              recordingDuration
            )
            console.log('IPC saveRecordingData result:', result)

            if (result.success) {
              console.log('✅ Recording saved successfully to:', result.filePath)
            } else {
              console.error('❌ IPC error:', result.error)
            }
          } catch (error) {
            console.error('❌ Failed to save recording:', error)
            console.error('Error details:', {
              name: error instanceof Error ? error.name : 'unknown',
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : 'no stack'
            })
          }

          // Stop all tracks
          console.log('Stopping all tracks...')
          recordingStream.getTracks().forEach((track) => {
            console.log('Stopping track:', track.kind, track.label)
            track.stop()
          })
          console.log('All tracks stopped')
        }

        // Handle error
        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event.error)
          setState((prev) => ({
            ...prev,
            isRecording: false
          }))
        }

        // Start recording
        mediaRecorder.start(1000) // Collect data every second
        console.log('MediaRecorder started')

        setState((prev) => ({
          ...prev,
          isRecording: true,
          recordingStream,
          mediaRecorder,
          chunks: []
        }))

        return recordingStream
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Start recording error:', message, error)
        throw error
      }
    },
    [getRecordingStream]
  )

  /**
   * Stop recording
   */
  const stopScreenRecording = useCallback(async () => {
    try {
      if (!stateRef.current.mediaRecorder || !stateRef.current.isRecording) {
        throw new Error('No recording in progress')
      }

      console.log('Stopping recording...')
      stateRef.current.mediaRecorder.stop()

      // Wait for onstop to be called
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!stateRef.current.isRecording) {
            clearInterval(checkInterval)
            resolve(null)
          }
        }, 100)
      })
    } catch (error) {
      console.error('Stop recording error:', error)
      throw error
    }
  }, [])

  /**
   * Pause recording
   */
  const pauseScreenRecording = useCallback(() => {
    try {
      if (!stateRef.current.mediaRecorder || !stateRef.current.isRecording) {
        throw new Error('No recording in progress')
      }

      stateRef.current.mediaRecorder.pause()
      setState((prev) => ({
        ...prev,
        isPaused: true
      }))
    } catch (error) {
      console.error('Pause recording error:', error)
      throw error
    }
  }, [])

  /**
   * Resume recording
   */
  const resumeScreenRecording = useCallback(() => {
    try {
      if (!stateRef.current.mediaRecorder || !stateRef.current.isRecording) {
        throw new Error('No recording in progress')
      }

      stateRef.current.mediaRecorder.resume()
      setState((prev) => ({
        ...prev,
        isPaused: false
      }))
    } catch (error) {
      console.error('Resume recording error:', error)
      throw error
    }
  }, [])

  return {
    ...state,
    startScreenRecording,
    stopScreenRecording,
    pauseScreenRecording,
    resumeScreenRecording
  }
}
