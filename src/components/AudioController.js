import React from 'react';

// Component wrapper cho HTML5 Audio element
const AudioController = ({ 
  slide, 
  onSlideEnd,
  children 
}) => {
  // Component này chủ yếu là wrapper, logic audio được handle trong useAudio hook
  // Children sẽ receive audio controls qua render props pattern
  
  return (
    <div className="audio-controller">
      {children}
    </div>
  );
};

export default AudioController;