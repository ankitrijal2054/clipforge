// Recording Panel Component - Minimalist Design
// Simple, clean interface for all recording modes
import React from 'react'
import { useRecording } from '../../hooks/useRecording'
import { Button } from '../../../../components/ui/button'
import { Mic, MonitorPlay, Video, Play, Pause, Square, AlertCircle } from 'lucide-react'

export const RecordingPanel: React.FC = () => {
  const recording = useRecording({
    onRecordingStart: (options) => {
      console.log('Recording started:', options)
    },
    onRecordingStopped: (data) => {
      console.log('Recording stopped:', data)
    },
    onRecordingError: (error) => {
      console.error('Recording error:', error)
    }
  })

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white">Quick Record</h3>
        <p className="text-xs text-gray-400 mt-1">Screen • Webcam • Combined</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4">
        {/* Mode Selection */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {/* Screen Mode */}
            <button
              onClick={() => recording.setRecordingType('screen')}
              disabled={recording.isRecording}
              className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                recording.recordingType === 'screen'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
              } ${recording.isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <MonitorPlay className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs">Screen</div>
            </button>

            {/* Webcam Mode */}
            <button
              onClick={() => recording.setRecordingType('webcam')}
              disabled={recording.isRecording}
              className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                recording.recordingType === 'webcam'
                  ? 'border-green-500 bg-green-500/20 text-green-300'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
              } ${recording.isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Video className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs">Webcam</div>
            </button>

            {/* PiP Mode */}
            <button
              onClick={() => recording.setRecordingType('pip')}
              disabled={recording.isRecording}
              className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                recording.recordingType === 'pip'
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
              } ${recording.isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex gap-0.5 justify-center mb-1">
                <MonitorPlay className="w-3.5 h-3.5" />
                <Video className="w-3.5 h-3.5 -ml-1" />
              </div>
              <div className="text-xs">PiP</div>
            </button>
          </div>
        </div>

        {/* Device Selection */}
        {recording.recordingType && (
          <div className="space-y-2 pt-2 border-t border-gray-700">
            {/* Screen Source */}
            {(recording.recordingType === 'screen' || recording.recordingType === 'pip') && (
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">Screen</label>
                <select
                  value={recording.selectedSource || ''}
                  onChange={(e) => recording.setSelectedSource(e.target.value)}
                  disabled={recording.isRecording}
                  className="w-full px-2.5 py-2 bg-gray-800 border border-gray-600 text-white text-sm rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose screen...</option>
                  {recording.screenSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Webcam Device */}
            {(recording.recordingType === 'webcam' || recording.recordingType === 'pip') && (
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">Camera</label>
                <select
                  value={recording.selectedWebcam || ''}
                  onChange={(e) => recording.setSelectedWebcam(e.target.value)}
                  disabled={recording.isRecording || !recording.cameraPermission}
                  className="w-full px-2.5 py-2 bg-gray-800 border border-gray-600 text-white text-sm rounded focus:outline-none focus:border-green-500"
                >
                  <option value="">Choose camera...</option>
                  {recording.webcamDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
                {!recording.cameraPermission && (
                  <div className="mt-1 text-xs text-amber-400">Camera permission needed</div>
                )}
              </div>
            )}

            {/* Audio Device */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block flex items-center gap-1">
                <Mic className="w-3 h-3" />
                Microphone
              </label>
              <select
                value={recording.selectedAudioDevice || ''}
                onChange={(e) => recording.setSelectedAudioDevice(e.target.value || null)}
                disabled={recording.isRecording}
                className="w-full px-2.5 py-2 bg-gray-800 border border-gray-600 text-white text-sm rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">System default</option>
                {recording.audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => recording.setQuality(q)}
                    disabled={recording.isRecording}
                    className={`py-1.5 px-2 text-xs font-medium rounded border transition-all ${
                      recording.quality === q
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    } ${recording.isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Display */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-white">
              {recording.isRecording
                ? recording.isPaused
                  ? '⏸️ Paused'
                  : '🔴 Recording'
                : '⏹️ Ready'}
            </div>
            <div className="text-lg font-mono text-gray-300">
              {formatDuration(recording.recordingDuration)}
            </div>
          </div>

          {/* Error Alert */}
          {recording.error && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{recording.error}</span>
              <button
                onClick={recording.clearError}
                className="ml-auto text-red-300 hover:text-red-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex gap-2">
            {!recording.isRecording ? (
              <Button
                onClick={recording.startRecording}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2 h-10"
                disabled={
                  !recording.recordingType ||
                  (recording.recordingType === 'screen' && !recording.selectedSource) ||
                  (recording.recordingType === 'webcam' && !recording.selectedWebcam) ||
                  ((recording.recordingType === 'webcam' || recording.recordingType === 'pip') &&
                    !recording.cameraPermission)
                }
              >
                <Play className="w-4 h-4" />
                Start
              </Button>
            ) : (
              <>
                <Button
                  onClick={
                    recording.isPaused ? recording.resumeRecording : recording.pauseRecording
                  }
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white gap-2 h-10"
                >
                  {recording.isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  onClick={recording.stopRecording}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white gap-2 h-10"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
