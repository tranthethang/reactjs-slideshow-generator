import React from 'react';

// Component hiển thị subtitle với animation
const SubtitleDisplay = ({ 
  currentSubtitle, 
  isVisible = true,
  className = ''
}) => {
  if (!isVisible || !currentSubtitle) {
    return null;
  }

  return (
    <div className={`subtitle-display ${className}`}>
      <div className="subtitle-background">
        <p className="subtitle-text">
          {currentSubtitle.text}
        </p>
      </div>
    </div>
  );
};

export default SubtitleDisplay;