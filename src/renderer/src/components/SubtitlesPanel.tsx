import React, { useState, useEffect } from 'react'
import { useEditorStore } from '../../../stores/editorStore'
import { Button } from '../../../components/ui/button'
import { AlertCircle, CheckCircle, Zap, Download } from 'lucide-react'
import type { Subtitle } from '../../../types/subtitles'

const API_KEY_STORAGE_KEY = 'clipforge_openai_api_key'

interface SubtitlePanelProps {
  onSubtitlesGenerated?: (subtitles: Subtitle[]) => void
}

export const SubtitlesPanel: React.FC<SubtitlePanelProps> = ({ onSubtitlesGenerated }) => {
  const {
    selectedClip,
    trimStart,
    trimEnd,
    currentSubtitles,
    isGeneratingSubtitles,
    subtitleGenerationProgress,
    subtitleGenerationPhase,
    subtitleError,
    setGeneratingSubtitles,
    setSubtitleError,
    setSubtitles
  } = useEditorStore()

  const [apiKey, setApiKey] = useState<string>('')
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true)

  // Load API key from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
    setApiKey(stored || '')
    setIsLoadingApiKey(false)
  }, [])

  const handleGenerateSubtitles = async () => {
    if (!selectedClip) {
      setSubtitleError('Please select a video first')
      return
    }

    if (!apiKey) {
      setSubtitleError('Please configure OpenAI API key in AI Settings tab')
      return
    }

    setGeneratingSubtitles(true)
    setSubtitleError(null)

    try {
      // Call main process IPC handler
      const result = await (window.api as any).generateSubtitles({
        clipPath: selectedClip.path,
        trimStart,
        trimEnd,
        apiKey
      })

      setSubtitles(result.subtitles)
      if (onSubtitlesGenerated) {
        onSubtitlesGenerated(result.subtitles)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setSubtitleError(errorMessage)
      console.error('Subtitle generation error:', error)
    } finally {
      setGeneratingSubtitles(false)
    }
  }

  const handleDownloadSRT = () => {
    if (!currentSubtitles || currentSubtitles.length === 0) return

    const srtContent = currentSubtitles
      .map((sub) => `${sub.index}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}`)
      .join('\n\n')

    const blob = new Blob([srtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedClip?.name.replace(/\.[^/.]+$/, '') || 'subtitles'}.srt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoadingApiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-gray-400 text-sm">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Generate Subtitles
        </h3>
        <p className="text-xs text-gray-400 mt-1">AI-powered transcription with OpenAI Whisper</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4">
        {/* Status Section */}
        <div className="space-y-2">
          <div className="text-sm text-gray-300 font-medium">
            Source: <span className="text-blue-400">{selectedClip?.name || 'None selected'}</span>
          </div>
          {selectedClip && (
            <div className="text-xs text-gray-400">
              Trim: {trimStart.toFixed(2)}s - {trimEnd.toFixed(2)}s (
              {(trimEnd - trimStart).toFixed(2)}s total)
            </div>
          )}
        </div>

        {/* API Key Status */}
        <div className="p-3 rounded-lg border">
          {apiKey ? (
            <div className="flex items-center gap-2 text-xs text-green-400 border border-green-500/50 bg-green-500/10 p-2 rounded">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>API key configured</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-400 border border-amber-500/50 bg-amber-500/10 p-2 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Configure API key in AI Settings</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {subtitleError && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/50 rounded flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{subtitleError}</span>
          </div>
        )}

        {/* Progress Section */}
        {isGeneratingSubtitles && (
          <div className="space-y-2 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm text-blue-400 font-medium">{subtitleGenerationPhase}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${subtitleGenerationProgress}%` }}
              />
            </div>
            <div className="text-xs text-blue-300 text-right">{subtitleGenerationProgress}%</div>
          </div>
        )}

        {/* Subtitles Preview */}
        {currentSubtitles && currentSubtitles.length > 0 && !isGeneratingSubtitles && (
          <div className="space-y-2">
            <div className="text-sm text-gray-300 font-medium">
              Preview ({currentSubtitles.length} subtitles)
            </div>
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-h-48 overflow-y-auto">
              <div className="space-y-2 p-3">
                {currentSubtitles.map((subtitle) => (
                  <div key={subtitle.index} className="text-xs space-y-1">
                    <div className="text-gray-400">
                      {subtitle.startTime} → {subtitle.endTime}
                    </div>
                    <div className="text-gray-100 line-clamp-2">{subtitle.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentSubtitles && !isGeneratingSubtitles && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-8">
            <Zap className="w-12 h-12 text-gray-600 mb-3 opacity-50" />
            <p className="text-sm">Generate subtitles to get started</p>
            <p className="text-xs text-gray-500 mt-1">Click the button below</p>
          </div>
        )}
      </div>

      {/* Actions - Fixed at Bottom */}
      <div className="border-t border-gray-700 p-4 flex-shrink-0 space-y-2">
        <Button
          onClick={handleGenerateSubtitles}
          disabled={!selectedClip || !apiKey || isGeneratingSubtitles}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-10 text-sm font-medium"
        >
          {isGeneratingSubtitles ? 'Generating...' : 'Generate Subtitles'}
        </Button>

        {currentSubtitles && currentSubtitles.length > 0 && !isGeneratingSubtitles && (
          <Button
            onClick={handleDownloadSRT}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-sm gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download SRT
          </Button>
        )}
      </div>
    </div>
  )
}
