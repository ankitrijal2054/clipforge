import React, { useState, useEffect } from 'react'
import { useEditorStore } from '../../../stores/editorStore'
import { Button } from '../../../components/ui/button'
import {
  AlertCircle,
  CheckCircle,
  Sparkles,
  Download,
  ChevronDown,
  ChevronUp,
  Key,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react'
import type { Subtitle } from '../../../types/subtitles'

const API_KEY_STORAGE_KEY = 'clipforge_openai_api_key'

interface AISubsPanelProps {
  onSubtitlesGenerated?: (subtitles: Subtitle[]) => void
}

export const AISubsPanel: React.FC<AISubsPanelProps> = ({ onSubtitlesGenerated }) => {
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
    setSubtitles,
    clearSubtitles
  } = useEditorStore()

  const [apiKey, setApiKey] = useState<string>('')
  const [showKey, setShowKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true)
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false)

  // Load API key from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (stored) {
      setApiKey(stored)
      setIsSaved(true)
    }
    setIsLoadingApiKey(false)
  }, [])

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
      setIsSaved(true)
      setTestStatus('idle')
      setTestMessage('')
    }
  }

  const handleClearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
    setApiKey('')
    setIsSaved(false)
    setTestStatus('idle')
    setTestMessage('')
  }

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestMessage('Please enter an API key first')
      setTestStatus('error')
      return
    }

    setTestStatus('testing')
    setTestMessage('Testing connection...')

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      })

      if (response.ok) {
        setTestStatus('success')
        setTestMessage('✓ API connection successful!')
      } else if (response.status === 401) {
        setTestStatus('error')
        setTestMessage('✗ Invalid API key')
      } else {
        setTestStatus('error')
        setTestMessage(`✗ API error: ${response.statusText}`)
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage('✗ Network error. Check your internet connection.')
    }
  }

  const handleGenerateSubtitles = async () => {
    if (!selectedClip) {
      setSubtitleError('Please select a video first')
      return
    }

    if (!apiKey) {
      setSubtitleError('Please configure OpenAI API key first')
      setIsSettingsExpanded(true) // Auto-expand settings if key is missing
      return
    }

    setGeneratingSubtitles(true)
    setSubtitleError(null)

    try {
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
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Subtitles
        </h3>
        <p className="text-xs text-gray-400 mt-1">AI-powered transcription with OpenAI Whisper</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4">
        {/* AI Settings - Expandable Section */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          {/* Settings Header - Collapsible */}
          <button
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            className="w-full p-3 bg-gray-800/50 hover:bg-gray-800 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">API Settings</span>
              {apiKey && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
            </div>
            {isSettingsExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Settings Content - Collapsible */}
          {isSettingsExpanded && (
            <div className="p-3 border-t border-gray-700 space-y-3">
              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-xs text-gray-300 font-medium block">OpenAI API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      setIsSaved(false)
                    }}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white text-xs rounded focus:outline-none focus:border-blue-500 font-mono pr-9"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    type="button"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>

              {/* Status Messages */}
              {isSaved && testStatus !== 'testing' && (
                <div className="p-2 bg-green-500/10 border border-green-500/50 rounded flex items-center gap-2 text-green-400 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>API key saved</span>
                </div>
              )}

              {testStatus === 'error' && (
                <div className="p-2 bg-red-500/10 border border-red-500/50 rounded flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{testMessage}</span>
                </div>
              )}

              {testStatus === 'success' && (
                <div className="p-2 bg-green-500/10 border border-green-500/50 rounded flex items-center gap-2 text-green-400 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{testMessage}</span>
                </div>
              )}

              {testStatus === 'testing' && (
                <div className="p-2 bg-blue-500/10 border border-blue-500/50 rounded flex items-center gap-2 text-blue-400 text-xs">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>{testMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleTestConnection}
                  disabled={!apiKey.trim() || testStatus === 'testing'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={!apiKey.trim() || isSaved}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleClearApiKey}
                    disabled={!apiKey.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-800/30 rounded p-2.5 border border-gray-700">
                <p className="text-xs text-gray-400">
                  <span className="text-blue-400">•</span> Cost: ~$0.006 per minute
                  <br />
                  <span className="text-blue-400">•</span> Stored locally in browser
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Section */}
        <div className="space-y-2">
          <div className="text-sm text-gray-300 font-medium">
            Source: <span className="text-purple-400">{selectedClip?.name || 'None selected'}</span>
          </div>
          {selectedClip && (
            <div className="text-xs text-gray-400">
              Trim: {trimStart.toFixed(2)}s - {trimEnd.toFixed(2)}s (
              {(trimEnd - trimStart).toFixed(2)}s total)
            </div>
          )}
        </div>

        {/* API Key Status Badge */}
        {!apiKey && (
          <div className="p-2.5 rounded-lg border border-amber-500/50 bg-amber-500/10 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-xs text-amber-400">
              Please configure API key above to generate subtitles
            </span>
          </div>
        )}

        {/* Error Alert */}
        {subtitleError && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/50 rounded flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{subtitleError}</span>
          </div>
        )}

        {/* Progress Section */}
        {isGeneratingSubtitles && (
          <div className="space-y-2 p-3 bg-purple-500/10 border border-purple-500/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm text-purple-400 font-medium">{subtitleGenerationPhase}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${subtitleGenerationProgress}%` }}
              />
            </div>
            <div className="text-xs text-purple-300 text-right">{subtitleGenerationProgress}%</div>
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
        {!currentSubtitles && !isGeneratingSubtitles && apiKey && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-8">
            <Sparkles className="w-12 h-12 text-gray-600 mb-3 opacity-50" />
            <p className="text-sm">Generate AI subtitles</p>
            <p className="text-xs text-gray-500 mt-1">Click the button below</p>
          </div>
        )}
      </div>

      {/* Actions - Fixed at Bottom */}
      <div className="border-t border-gray-700 p-4 flex-shrink-0 space-y-2">
        <Button
          onClick={handleGenerateSubtitles}
          disabled={!selectedClip || !apiKey || isGeneratingSubtitles}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10 text-sm font-medium"
        >
          {isGeneratingSubtitles ? 'Generating...' : 'Generate Subtitles'}
        </Button>

        {currentSubtitles && currentSubtitles.length > 0 && !isGeneratingSubtitles && (
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadSRT}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-sm gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
            <Button
              onClick={clearSubtitles}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white h-9 text-sm gap-2"
              title="Clear subtitles"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
