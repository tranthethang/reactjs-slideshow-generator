import React, { useState } from 'react';

// Component debug panel để hiển thị thông tin về subtitle timing
const SubtitleDebugPanel = ({ 
  currentSlide, 
  currentTime, 
  currentSubtitle,
  isVisible = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !currentSlide) return null;

  const timeline = currentSlide.subtitleTimeline || [];
  const currentIndex = currentSubtitle?.index ?? -1;

  return (
    <div className="subtitle-debug-panel">
      <button 
        className="debug-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        🐛 Debug Subtitles {isExpanded ? '▼' : '▶'}
      </button>
      
      {isExpanded && (
        <div className="debug-content">
          <div className="debug-header">
            <h4>Slide {currentSlide.id} - Audio: {currentSlide.audioDuration}s</h4>
            <p>Current Time: {currentTime.toFixed(2)}s</p>
            <p>Active Subtitle: {currentIndex + 1}/{timeline.length}</p>
          </div>
          
          <div className="debug-timeline">
            {timeline.map((item, index) => (
              <div 
                key={index}
                className={`timeline-item ${index === currentIndex ? 'active' : ''} ${currentTime > item.endTime ? 'passed' : ''}`}
              >
                <div className="timeline-header">
                  <span className="timeline-index">#{index + 1}</span>
                  <span className="timeline-timing">
                    {item.startTime.toFixed(2)}s - {item.endTime.toFixed(2)}s
                  </span>
                  <span className="timeline-duration">
                    ({(item.endTime - item.startTime).toFixed(2)}s)
                  </span>
                </div>
                
                <div className="timeline-text">
                  "{item.text}"
                </div>
                
                <div className="timeline-meta">
                  <span>Words: {item.wordCount}</span>
                  <span>Complexity: {(item.complexityScore * 100).toFixed(0)}%</span>
                  <span>Pause: {item.pauseAfter.toFixed(2)}s</span>
                </div>
                
                {index === currentIndex && (
                  <div className="timeline-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${Math.max(0, Math.min(100, ((currentTime - item.startTime) / (item.endTime - item.startTime)) * 100))}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="debug-stats">
            <h5>Statistics</h5>
            <p>Total Segments: {timeline.length}</p>
            <p>Avg Complexity: {timeline.length > 0 ? (timeline.reduce((sum, item) => sum + item.complexityScore, 0) / timeline.length * 100).toFixed(1) : 0}%</p>
            <p>Total Duration: {timeline.length > 0 ? (timeline[timeline.length - 1].endTime + timeline[timeline.length - 1].pauseAfter).toFixed(2) : 0}s</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtitleDebugPanel;