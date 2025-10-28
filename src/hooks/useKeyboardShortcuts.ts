import { useHotkeys } from 'react-hotkeys-hook'
import { useEditorStore } from '../stores/editorStore'

/**
 * Custom hook for keyboard shortcuts
 *
 * This hook provides keyboard shortcuts for common video editing operations:
 * - Space: Play/Pause
 * - Arrow keys: Seek forward/backward
 * - I/O: Set trim in/out points
 * - R: Reset trim
 * - Escape: Close modals
 * - Plus/Minus: Volume up/down
 * - M: Mute/unmute
 */
export function useKeyboardShortcuts() {
  const {
    // Playback actions
    togglePlayback,
    setPlayhead,
    setVolume,
    toggleMute,

    // Trim actions
    setTrimPoints,
    resetTrim,

    // UI actions
    setActiveModal,

    // State
    playhead,
    duration,
    trimStart,
    trimEnd,
    volume,
    isMuted
  } = useEditorStore()

  // Play/Pause toggle
  useHotkeys(
    'space',
    (e) => {
      e.preventDefault()
      togglePlayback()
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Seek backward (5 seconds)
  useHotkeys(
    'left',
    (e) => {
      e.preventDefault()
      const newTime = Math.max(0, playhead - 5)
      setPlayhead(newTime)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Seek forward (5 seconds)
  useHotkeys(
    'right',
    (e) => {
      e.preventDefault()
      const newTime = Math.min(duration, playhead + 5)
      setPlayhead(newTime)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Seek backward (1 second) - Shift + Left
  useHotkeys(
    'shift+left',
    (e) => {
      e.preventDefault()
      const newTime = Math.max(0, playhead - 1)
      setPlayhead(newTime)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Seek forward (1 second) - Shift + Right
  useHotkeys(
    'shift+right',
    (e) => {
      e.preventDefault()
      const newTime = Math.min(duration, playhead + 1)
      setPlayhead(newTime)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Set trim in point (I key)
  useHotkeys(
    'i',
    (e) => {
      e.preventDefault()
      setTrimPoints(playhead, trimEnd)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Set trim out point (O key)
  useHotkeys(
    'o',
    (e) => {
      e.preventDefault()
      setTrimPoints(trimStart, playhead)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Reset trim (R key)
  useHotkeys(
    'r',
    (e) => {
      e.preventDefault()
      resetTrim()
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Close modals (Escape key)
  useHotkeys(
    'escape',
    (e) => {
      e.preventDefault()
      setActiveModal(null)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Volume up (Plus key)
  useHotkeys(
    '=',
    (e) => {
      e.preventDefault()
      const newVolume = Math.min(1, volume + 0.1)
      setVolume(newVolume)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Volume down (Minus key)
  useHotkeys(
    '-',
    (e) => {
      e.preventDefault()
      const newVolume = Math.max(0, volume - 0.1)
      setVolume(newVolume)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Mute toggle (M key)
  useHotkeys(
    'm',
    (e) => {
      e.preventDefault()
      toggleMute()
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Jump to beginning (Home key)
  useHotkeys(
    'home',
    (e) => {
      e.preventDefault()
      setPlayhead(0)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Jump to end (End key)
  useHotkeys(
    'end',
    (e) => {
      e.preventDefault()
      setPlayhead(duration)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Export modal (Ctrl/Cmd + E)
  useHotkeys(
    'ctrl+e, cmd+e',
    (e) => {
      e.preventDefault()
      setActiveModal('export')
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Import modal (Ctrl/Cmd + I)
  useHotkeys(
    'ctrl+i, cmd+i',
    (e) => {
      e.preventDefault()
      setActiveModal('import')
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Toggle sidebar (Ctrl/Cmd + B)
  useHotkeys(
    'ctrl+b, cmd+b',
    (e) => {
      e.preventDefault()
      const { toggleSidebar } = useEditorStore.getState()
      toggleSidebar()
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Skip backward 10 seconds (J key)
  useHotkeys(
    'j',
    (e) => {
      e.preventDefault()
      const newTime = Math.max(0, playhead - 10)
      setPlayhead(newTime)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Skip forward 10 seconds (L key)
  useHotkeys(
    'l',
    (e) => {
      e.preventDefault()
      const newTime = Math.min(duration, playhead + 10)
      setPlayhead(newTime)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )

  // Toggle fullscreen (F key)
  useHotkeys(
    'f',
    (e) => {
      e.preventDefault()
      // This will be handled by the PreviewPlayer component
      const event = new CustomEvent('toggleFullscreen')
      window.dispatchEvent(event)
    },
    {
      enableOnFormTags: false,
      preventDefault: true
    }
  )
}

/**
 * Hook for getting keyboard shortcut help
 * Returns a map of shortcuts and their descriptions
 */
export function useKeyboardShortcutHelp() {
  return {
    Space: 'Play/Pause',
    'Left/Right': 'Seek backward/forward (5s)',
    'Shift + Left/Right': 'Seek backward/forward (1s)',
    'J/L': 'Skip backward/forward (10s)',
    I: 'Set trim in point',
    O: 'Set trim out point',
    R: 'Reset trim',
    F: 'Toggle fullscreen',
    Escape: 'Close modal',
    'Plus/Minus': 'Volume up/down',
    M: 'Mute/unmute',
    'Home/End': 'Jump to beginning/end',
    'Ctrl/Cmd + E': 'Export modal',
    'Ctrl/Cmd + I': 'Import modal',
    'Ctrl/Cmd + B': 'Toggle sidebar'
  }
}
