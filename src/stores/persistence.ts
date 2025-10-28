import { StateStorage } from 'zustand/middleware'

/**
 * State persistence configuration for ClipForge
 *
 * This module handles saving and loading application state to/from localStorage
 * with proper serialization and error handling.
 */

// Define which parts of the state should be persisted
const PERSISTED_KEYS = [
  'importHistory',
  'exportSettings',
  'sidebarCollapsed',
  'theme',
  'volume',
  'isMuted'
] as const

type PersistedState = Pick<import('../types/store').EditorStore, (typeof PERSISTED_KEYS)[number]>

/**
 * Custom storage implementation for Zustand persistence
 */
export const createPersistenceStorage = (): StateStorage => ({
  getItem: (name: string): string | null => {
    try {
      const item = localStorage.getItem(name)
      if (!item) return null

      // Check if the item is already a stringified object (corrupted data)
      if (item === '[object Object]') {
        console.warn('Corrupted data found in localStorage, clearing...')
        localStorage.removeItem(name)
        return null
      }

      const parsed = JSON.parse(item)

      // Only return persisted keys
      const persistedState: Partial<PersistedState> = {}
      PERSISTED_KEYS.forEach((key) => {
        if (key in parsed) {
          persistedState[key] = parsed[key]
        }
      })

      return Object.keys(persistedState).length > 0 ? JSON.stringify(persistedState) : null
    } catch (error) {
      console.error('Failed to load persisted state:', error)
      // Clear corrupted data
      try {
        localStorage.removeItem(name)
      } catch (clearError) {
        console.error('Failed to clear corrupted data:', clearError)
      }
      return null
    }
  },

  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value)
    } catch (error) {
      console.error('Failed to save persisted state:', error)
    }
  },

  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name)
    } catch (error) {
      console.error('Failed to remove persisted state:', error)
    }
  }
})

/**
 * Default state values for persistence
 */
export const getDefaultPersistedState = (): Partial<PersistedState> => ({
  importHistory: [],
  exportSettings: { format: 'mp4', quality: 'high' },
  sidebarCollapsed: false,
  theme: 'dark',
  volume: 1,
  isMuted: false
})

/**
 * Clear all persisted state
 */
export const clearPersistedState = (): void => {
  try {
    localStorage.removeItem('clipforge-editor-store')
  } catch (error) {
    console.error('Failed to clear persisted state:', error)
  }
}

/**
 * Export persisted state for debugging
 */
export const exportPersistedState = (): string | null => {
  try {
    return localStorage.getItem('clipforge-editor-store')
  } catch (error) {
    console.error('Failed to export persisted state:', error)
    return null
  }
}

/**
 * Import persisted state from string
 */
export const importPersistedState = (stateJson: string): boolean => {
  try {
    JSON.parse(stateJson) // Validate JSON format
    localStorage.setItem('clipforge-editor-store', stateJson)
    return true
  } catch (error) {
    console.error('Failed to import persisted state:', error)
    return false
  }
}
