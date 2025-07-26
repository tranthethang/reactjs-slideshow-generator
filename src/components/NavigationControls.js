import React from 'react';

// Component điều khiển navigation
const NavigationControls = ({
  onPrevious,
  onNext,
  onPlayPause,
  isPlaying,
  canGoPrevious,
  canGoNext,
  isVisible = true,
  showPlayButton = true,
  className = ''
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`navigation-controls ${className}`}>
      {/* Previous and Next buttons are hidden since keyboard navigation (arrow keys) is available */}
      
      {/* Play/Pause Button - Góc phải, trên cùng */}
      {showPlayButton && (
        <button 
          className={`nav-button play-pause-button ${isPlaying ? 'playing' : 'paused'}`}
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          <span className="nav-icon">
            {isPlaying ? '⏸' : '▶'}
          </span>
        </button>
      )}
    </div>
  );
};

export default NavigationControls;