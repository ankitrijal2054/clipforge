import React, { useState, useEffect } from 'react'
import { Key, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui/button'

const API_KEY_STORAGE_KEY = 'clipforge_openai_api_key'

export const AISettings: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('')
  const [showKey, setShowKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (stored) {
      setApiKey(stored)
      setIsSaved(true)
    }
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
      // Simple test: check if API key format is valid and can reach OpenAI
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

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-400" />
          AI Settings
        </h3>
        <p className="text-xs text-gray-400 mt-1">Configure OpenAI API for subtitle generation</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-6">
        {/* API Key Input */}
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-300 font-medium mb-2 block">OpenAI API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setIsSaved(false)
                }}
                placeholder="sk-..."
                className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-600 text-white text-sm rounded focus:outline-none focus:border-blue-500 font-mono pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                type="button"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
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
            <div className="p-2.5 bg-green-500/10 border border-green-500/50 rounded flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>API key saved</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/50 rounded flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{testMessage}</span>
            </div>
          )}

          {testStatus === 'success' && (
            <div className="p-2.5 bg-green-500/10 border border-green-500/50 rounded flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{testMessage}</span>
            </div>
          )}

          {testStatus === 'testing' && (
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/50 rounded flex items-center gap-2 text-blue-400 text-xs">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>{testMessage}</span>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gray-800/50 rounded-lg p-3.5 border border-gray-700 space-y-2.5">
          <h4 className="text-sm font-semibold text-white">How it works</h4>
          <ul className="text-xs text-gray-400 space-y-1.5">
            <li className="flex gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>Your API key is stored locally in your browser</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>Audio is sent to OpenAI Whisper for transcription</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>Subtitles are burned directly into your exported video</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>Cost: ~$0.006 per minute of audio</span>
            </li>
          </ul>
        </div>

        {/* Pricing Info */}
        <div className="bg-gray-800/30 rounded-lg p-3.5 border border-gray-700 space-y-1">
          <h4 className="text-sm font-semibold text-white">Pricing</h4>
          <p className="text-xs text-gray-400">
            OpenAI Whisper API is very affordable. A 10-minute video costs approximately $0.06.
          </p>
        </div>
      </div>

      {/* Actions - Fixed at Bottom */}
      <div className="border-t border-gray-700 p-4 flex-shrink-0 space-y-2">
        <Button
          onClick={handleTestConnection}
          disabled={!apiKey.trim() || testStatus === 'testing'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
        >
          {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={handleSaveApiKey}
            disabled={!apiKey.trim() || isSaved}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
          >
            Save Key
          </Button>
          <Button
            onClick={handleClearApiKey}
            disabled={!apiKey.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9 text-sm"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}
