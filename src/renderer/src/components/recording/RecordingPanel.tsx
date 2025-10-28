// Recording Panel Component
// Provides UI for selecting recording mode, devices, quality, and controls
import React, { useState } from 'react'
import { useRecording } from '../../hooks/useRecording'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import {
  Mic,
  MonitorPlay,
  Video,
  MoreVertical,
  Play,
  Pause,
  Square,
  AlertCircle
} from 'lucide-react'

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

  const [showAdvanced, setShowAdvanced] = useState(false)

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
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card className="bg-slate-900 border-slate-700">
        {/* Header */}
        <div className="border-b border-slate-700 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-red-500" />
            Recording Studio
          </h2>
          <p className="text-slate-400 text-sm mt-1">Capture screen, webcam, or both with audio</p>
        </div>

        {/* Recording Mode Selection */}
        <div className="p-6 border-b border-slate-700">
          <label className="text-white text-sm font-semibold mb-3 block">Recording Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {/* Screen Recording Button */}
            <button
              onClick={() => recording.setRecordingType('screen')}
              className={`p-4 rounded-lg border-2 transition-all ${
                recording.recordingType === 'screen'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              } ${recording.isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={recording.isRecording}
            >
              <MonitorPlay className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-white text-sm font-medium">Screen</div>
              <div className="text-slate-400 text-xs">Full or window</div>
            </button>

            {/* Webcam Recording Button */}
            <button
              onClick={() => recording.setRecordingType('webcam')}
              className={`p-4 rounded-lg border-2 transition-all ${
                recording.recordingType === 'webcam'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              } ${recording.isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={recording.isRecording}
            >
              <Video className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-white text-sm font-medium">Webcam</div>
              <div className="text-slate-400 text-xs">Camera only</div>
            </button>

            {/* PiP Recording Button */}
            <button
              onClick={() => recording.setRecordingType('pip')}
              className={`p-4 rounded-lg border-2 transition-all ${
                recording.recordingType === 'pip'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              } ${recording.isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={recording.isRecording}
            >
              <div className="flex gap-1 justify-center mb-2">
                <MonitorPlay className="w-5 h-5 text-purple-400" />
                <Video className="w-5 h-5 text-purple-400 -ml-2" />
              </div>
              <div className="text-white text-sm font-medium">Picture-in-Picture</div>
              <div className="text-slate-400 text-xs">Screen + webcam</div>
            </button>
          </div>
        </div>

        {/* Device Selection */}
        {recording.recordingType && (
          <div className="p-6 border-b border-slate-700">
            <label className="text-white text-sm font-semibold mb-3 block">Devices</label>

            {/* Screen Source Selection */}
            {(recording.recordingType === 'screen' || recording.recordingType === 'pip') && (
              <div className="mb-4">
                <label className="text-slate-300 text-xs font-medium mb-2 block">
                  Screen/Window
                </label>
                <select
                  value={recording.selectedSource || ''}
                  onChange={(e) => recording.setSelectedSource(e.target.value)}
                  disabled={recording.isRecording}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-md text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select screen or window...</option>
                  {recording.screenSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.type === 'screen' ? '🖥️ ' : '🪟 '}
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Webcam Selection */}
            {(recording.recordingType === 'webcam' || recording.recordingType === 'pip') && (
              <div className="mb-4">
                <label className="text-slate-300 text-xs font-medium mb-2 block">Camera</label>
                <select
                  value={recording.selectedWebcam || ''}
                  onChange={(e) => recording.setSelectedWebcam(e.target.value)}
                  disabled={recording.isRecording || !recording.cameraPermission}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-md text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="">Select camera...</option>
                  {recording.webcamDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
                {!recording.cameraPermission && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/50 rounded text-amber-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Camera permission required
                  </div>
                )}
              </div>
            )}

            {/* Audio Input Selection */}
            <div className="mb-4">
              <label className="text-slate-300 text-xs font-medium mb-2 block flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Microphone
              </label>
              <select
                value={recording.selectedAudioDevice || ''}
                onChange={(e) => recording.setSelectedAudioDevice(e.target.value || null)}
                disabled={recording.isRecording}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-md text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">System default</option>
                {recording.audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Quality Settings */}
        {recording.recordingType && (
          <div className="p-6 border-b border-slate-700">
            <label className="text-white text-sm font-semibold mb-3 block">Quality</label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => recording.setQuality(q)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    recording.quality === q
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  } ${recording.isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={recording.isRecording}
                >
                  <div className="text-white text-sm font-medium capitalize">{q}</div>
                  {recording.qualitySettings[q] && (
                    <div className="text-slate-400 text-xs">
                      {recording.qualitySettings[q].description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recording Status */}
        <div className="p-6 border-b border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            {/* Timer Display */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-slate-400 text-xs font-medium mb-1">Duration</div>
              <div className="text-2xl font-mono text-white">
                {formatDuration(recording.recordingDuration)}
              </div>
            </div>

            {/* Status Display */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-slate-400 text-xs font-medium mb-1">Status</div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    recording.isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className="text-white font-medium">
                  {recording.isRecording ? (recording.isPaused ? 'Paused' : 'Recording') : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {recording.error && (
          <div className="p-4 mx-6 mt-4 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{recording.error}</span>
            <button
              onClick={recording.clearError}
              className="ml-auto text-red-300 hover:text-red-200 font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Recording Controls */}
        <div className="p-6">
          <div className="flex gap-3">
            {!recording.isRecording ? (
              <Button
                onClick={recording.startRecording}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                disabled={
                  !recording.recordingType ||
                  (recording.recordingType === 'screen' && !recording.selectedSource) ||
                  (recording.recordingType === 'webcam' && !recording.selectedWebcam) ||
                  ((recording.recordingType === 'webcam' || recording.recordingType === 'pip') &&
                    !recording.cameraPermission)
                }
              >
                <Play className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button
                  onClick={
                    recording.isPaused ? recording.resumeRecording : recording.pauseRecording
                  }
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
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
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Recording
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="p-4 border-t border-slate-700 flex justify-center">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-slate-400 hover:text-slate-300 text-xs font-medium flex items-center gap-2"
          >
            <MoreVertical className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="p-6 border-t border-slate-700 bg-slate-800/50">
            <div className="space-y-4">
              {recording.recordingType === 'pip' && (
                <>
                  <div>
                    <label className="text-slate-300 text-xs font-medium mb-2 block">
                      PiP Position
                    </label>
                    <select
                      value={recording.pipPosition}
                      onChange={(e) => recording.setPipPosition(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-xs font-medium mb-2 block">
                      PiP Size
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={recording.pipSize.width}
                          onChange={(e) =>
                            recording.setPipSize({
                              ...recording.pipSize,
                              width: parseInt(e.target.value) || 320
                            })
                          }
                          placeholder="Width"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={recording.pipSize.height}
                          onChange={(e) =>
                            recording.setPipSize({
                              ...recording.pipSize,
                              height: parseInt(e.target.value) || 180
                            })
                          }
                          placeholder="Height"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="p-3 bg-slate-700/50 rounded border border-slate-600 text-slate-300 text-xs">
                <strong>Recording Tip:</strong> Choose your source before clicking Start. You can
                pause and resume at any time.
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
