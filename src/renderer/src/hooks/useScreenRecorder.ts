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
        if (options.type === 'screen' || options.type === 'pip') {
          // Screen recording using Electron's desktopCapturer
          console.log('Screen recording: getting source with ID:', options.sourceId)
          if (!options.sourceId) {
            throw new Error('Screen source ID is required for screen/PiP recording')
          }

          try {
            console.log('Attempting getUserMedia with chromeMediaSource...')
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
            console.log('Successfully got screen stream')
          } catch (error) {
            console.warn('chromeMediaSource failed, trying getDisplayMedia...')
            // Fallback to getDisplayMedia
            try {
              stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                  displaySurface: 'monitor' as any
                },
                audio: false
              } as any)
              console.log('Successfully got screen stream via getDisplayMedia')
            } catch (fallbackError) {
              throw new Error(
                `Failed to get screen: ${error instanceof Error ? error.message : 'Unknown error'}`
              )
            }
          }
        } else if (options.type === 'webcam') {
          // Webcam recording
          console.log('Webcam recording: device ID:', options.webcamDeviceId)
          if (!options.webcamDeviceId) {
            throw new Error('Webcam device ID is required for webcam recording')
          }

          try {
            console.log(
              'Requesting webcam with deviceId:',
              options.webcamDeviceId.substring(0, 10) + '...'
            )

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(
                      'getUserMedia timeout - camera may not be available or permissions denied at OS level'
                    )
                  ),
                5000
              )
            )

            // Race between getUserMedia and timeout
            stream = await Promise.race([
              navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: { exact: options.webcamDeviceId }
                } as any,
                audio: true // Include audio from webcam
              }) as Promise<MediaStream>,
              timeoutPromise as Promise<MediaStream>
            ])

            console.log('Successfully got webcam stream with audio')
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.error('Failed to get webcam - Full error:', error)
            console.error('Error message:', errorMsg)
            console.error('Device ID used:', options.webcamDeviceId)

            // Try without audio if that failed
            try {
              console.log('Retrying without audio...')

              const timeoutPromise2 = new Promise((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error('getUserMedia timeout (video-only) - camera may not be available')
                    ),
                  5000
                )
              )

              stream = await Promise.race([
                navigator.mediaDevices.getUserMedia({
                  video: {
                    deviceId: { exact: options.webcamDeviceId }
                  } as any,
                  audio: false
                }) as Promise<MediaStream>,
                timeoutPromise2 as Promise<MediaStream>
              ])

              console.log('Successfully got webcam stream (video only)')
            } catch (retryError) {
              const retryMsg = retryError instanceof Error ? retryError.message : String(retryError)
              console.error('Retry also failed:', retryError)
              throw new Error(`Failed to get webcam: ${retryMsg}`)
            }
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
            console.log('Preparing to save recording...')
            console.log('File name:', fileName)
            console.log('Blob size:', recordingData.size)

            const arrayBuffer = await recordingData.arrayBuffer()
            console.log('Converted to ArrayBuffer, size:', arrayBuffer.byteLength)

            const result = await (window.api as any).saveRecordingData(arrayBuffer, fileName)
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
