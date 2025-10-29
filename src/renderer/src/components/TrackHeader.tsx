import React from 'react'
import { Volume2, VolumeX, Film, Music } from 'lucide-react'
import './TrackHeader.css'

interface TrackHeaderProps {
  trackType: 'video' | 'audio'
  isMuted: boolean
  onToggleMute: () => void
}

/**
 * TrackHeader Component
 * Displays track icon and mute button
 */
export const TrackHeader: React.FC<TrackHeaderProps> = ({ trackType, isMuted, onToggleMute }) => {
  const Icon = trackType === 'video' ? Film : Music
  const trackTitle = trackType === 'video' ? 'Video Track' : 'Audio Track'

  return (
    <div className="track-header">
      <button
        className={`track-icon-button ${trackType}`}
        title={trackTitle}
        aria-label={trackTitle}
      >
        <Icon size={40} />
      </button>
      <button
        className={`mute-button ${isMuted ? 'muted' : ''}`}
        onClick={onToggleMute}
        title={isMuted ? 'Unmute track' : 'Mute track'}
        aria-label={`${isMuted ? 'Unmute' : 'Mute'} ${trackType} track`}
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
    </div>
  )
}

export default TrackHeader
