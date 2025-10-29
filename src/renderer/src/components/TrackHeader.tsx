import React from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import './TrackHeader.css'

interface TrackHeaderProps {
  trackType: 'video' | 'audio'
  isMuted: boolean
  onToggleMute: () => void
}

/**
 * TrackHeader Component
 * Displays track label and mute button
 */
export const TrackHeader: React.FC<TrackHeaderProps> = ({ trackType, isMuted, onToggleMute }) => {
  const label = trackType === 'video' ? '🎬 Video Track' : '🎵 Audio Track'
  const trackColor = trackType === 'video' ? 'text-blue-400' : 'text-amber-400'

  return (
    <div className="track-header">
      <div className={`track-label ${trackColor}`}>{label}</div>
      <button
        className={`mute-button ${isMuted ? 'muted' : ''}`}
        onClick={onToggleMute}
        title={isMuted ? 'Unmute track' : 'Mute track'}
        aria-label={`${isMuted ? 'Unmute' : 'Mute'} ${trackType} track`}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  )
}

export default TrackHeader
