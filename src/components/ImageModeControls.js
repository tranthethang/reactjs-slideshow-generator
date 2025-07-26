import React from 'react';

// Component for controlling image display modes
const ImageModeControls = ({ currentMode, onModeChange, isVisible = true }) => {
  if (!isVisible) {
    return null;
  }

  const modes = [
    { key: 'contain', label: 'Fit', title: 'Fit entire image (maintain aspect ratio)' },
    { key: 'cover', label: 'Fill', title: 'Fill screen (may crop image)' },
    { key: 'fill', label: 'Stretch', title: 'Stretch to fill (may distort)' },
    { key: 'auto', label: 'Auto', title: 'Smart fit based on image dimensions' }
  ];

  return (
    <div className="image-mode-controls">
      {modes.map(mode => (
        <button
          key={mode.key}
          className={`mode-button ${currentMode === mode.key ? 'active' : ''}`}
          onClick={() => onModeChange(mode.key)}
          title={mode.title}
          aria-label={mode.title}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};

export default ImageModeControls;