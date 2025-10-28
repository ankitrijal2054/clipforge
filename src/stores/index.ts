/**
 * State management for ClipForge
 *
 * This module exports all store-related functionality including:
 * - Main editor store
 * - Selector hooks
 * - Persistence utilities
 */

export { useEditorStore } from './editorStore'
export * from './editorStore' // Export all selectors and actions

// Persistence utilities
export {
  createPersistenceStorage,
  getDefaultPersistedState,
  clearPersistedState,
  exportPersistedState,
  importPersistedState
} from './persistence'
