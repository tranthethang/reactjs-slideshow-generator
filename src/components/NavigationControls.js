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
      {/* Previous Button - Góc trái */}
      <button 
        className="nav-button prev-button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="Slide trước"
      >
        <span className="nav-icon">‹</span>
      </button>

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

      {/* Next Button - Góc phải */}
      <button 
        className="nav-button next-button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Slide tiếp theo"
      >
        <span className="nav-icon">›</span>
      </button>
    </div>
  );
};

export default NavigationControls;