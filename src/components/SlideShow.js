import React, { useState, useCallback, useEffect } from 'react';
import useKeyboard, { useTouchGestures } from '../hooks/useKeyboard';
import useImageLoader from '../hooks/useImageLoader';
import useImagePreloader from '../hooks/useImagePreloader';
import SubtitleDisplay from './SubtitleDisplay';
import VTTSubtitleDisplayManual from './VTTSubtitleDisplay';
import SubtitleDebugPanel from './SubtitleDebugPanel';
import NavigationControls from './NavigationControls';
import ImageModeControls from './ImageModeControls';
import { getCurrentSubtitle } from '../utils/subtitleTiming';

// Main slideshow container component
const SlideShow = ({ metadata }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [imageDisplayMode, setImageDisplayMode] = useState('auto'); // 'contain', 'cover', 'fill', 'auto'

  // Current slide data
  const currentSlide = metadata?.slides?.[currentSlideIndex] || null;
  const totalSlides = metadata?.totalSlides || 0;

  // Image loading hook
  const { 
    isLoading: imageLoading, 
    hasError: imageError, 
    imageDimensions,
    handleImageLoad, 
    handleImageError 
  } = useImageLoader(currentSlide?.image);

  // Image preloader hook for better performance
  useImagePreloader(metadata, currentSlideIndex);

  // State for HTML audio player
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);
  const [beatScale, setBeatScale] = useState(1);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Audio event handlers
  const handleAudioTimeUpdate = useCallback((e) => {
    const audio = e.target;
    const time = audio.currentTime;
    setCurrentTime(time);
    
    // Update subtitle based on current time
    if (currentSlide?.subtitleTimeline) {
      const subtitle = getCurrentSubtitle(currentSlide.subtitleTimeline, time);
      setCurrentSubtitle(subtitle);
    }
  }, [currentSlide?.subtitleTimeline]);

  const handleAudioPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleAudioPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleAudioEnded = useCallback(() => {
    setCurrentTime(0);
    setCurrentSubtitle(null);
    setIsPlaying(false);
    // Auto-advance to next slide
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  }, [currentSlideIndex, totalSlides]);

  const handleAudioLoadedMetadata = useCallback((e) => {
    const audio = e.target;
    setDuration(audio.duration);
  }, []);

  // Reset audio state when slide changes
  useEffect(() => {
    setCurrentTime(0);
    setCurrentSubtitle(null);
    setIsPlaying(false);
    setBeatScale(1);
  }, [currentSlide?.id]);

  // Beat animation effect when playing
  useEffect(() => {
    let beatInterval;
    if (isPlaying) {
      beatInterval = setInterval(() => {
        const randomScale = 0.8 + Math.random() * 0.4; // Random scale between 0.8 and 1.2
        setBeatScale(randomScale);
        setTimeout(() => setBeatScale(1), 100); // Return to normal size after 100ms
      }, 300 + Math.random() * 200); // Random interval between 300-500ms
    } else {
      setBeatScale(1);
    }
    
    return () => {
      if (beatInterval) clearInterval(beatInterval);
    };
  }, [isPlaying]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  }, [currentSlideIndex]);

  const goToNext = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  }, [currentSlideIndex, totalSlides]);

  // Handle image display mode change
  const handleImageModeChange = useCallback((mode) => {
    setImageDisplayMode(mode);
  }, []);

  // Calculate smart display mode based on image dimensions
  const getSmartDisplayMode = useCallback(() => {
    if (!imageDimensions) return 'contain';
    
    const { aspectRatio } = imageDimensions;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    
    // If image is much wider than screen, use contain to show full width
    if (aspectRatio > screenAspectRatio * 1.5) {
      return 'contain';
    }
    // If image is much taller than screen, use contain to show full height
    else if (aspectRatio < screenAspectRatio * 0.7) {
      return 'contain';
    }
    // If aspect ratios are similar, use cover for immersive experience
    else {
      return 'cover';
    }
  }, [imageDimensions]);

  // Get effective display mode (resolve 'auto' to actual mode)
  const effectiveDisplayMode = imageDisplayMode === 'auto' ? getSmartDisplayMode() : imageDisplayMode;

  // Handle progress bar click/touch for seeking
  const handleProgressBarClick = useCallback((e) => {
    if (audioRef && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      
      // Clamp the time between 0 and duration
      const clampedTime = Math.max(0, Math.min(newTime, duration));
      audioRef.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  }, [audioRef, duration]);

  // Custom audio control functions
  const toggleAudio = useCallback(() => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play().catch(err => {
          console.warn('Could not play audio:', err);
        });
      }
    }
  }, [audioRef, isPlaying]);



  // Handle user interaction để enable audio context
  const handleUserInteraction = useCallback(() => {
    console.log('User interaction detected');
    
    // Tạo audio context nếu chưa có
    if (typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && !window.audioContextEnabled) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              console.log('Audio context resumed');
              window.audioContextEnabled = true;
            });
          } else {
            console.log('Audio context already active');
            window.audioContextEnabled = true;
          }
        }
      } catch (err) {
        console.warn('Could not create audio context:', err);
      }
    }
    
    // Enable audio playback globally
    window.userHasInteracted = true;
  }, []);



  // Cycle through image display modes
  const cycleImageMode = useCallback(() => {
    const modes = ['auto', 'contain', 'cover', 'fill'];
    const currentIndex = modes.indexOf(imageDisplayMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setImageDisplayMode(modes[nextIndex]);
  }, [imageDisplayMode]);

  // Keyboard shortcuts
  useKeyboard({
    onPrevious: goToPrevious,
    onNext: goToNext,
    onToggleDebug: () => setShowDebugPanel(!showDebugPanel),
    onCycleImageMode: cycleImageMode,
    isEnabled: !imageLoading
  });

  // Touch gestures cho mobile
  useTouchGestures({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    onTap: handleUserInteraction, // Just enable user interaction on tap
    isEnabled: !imageLoading
  });

  // Loading state
  if (!metadata || !currentSlide) {
    return (
      <div className="slideshow-container loading">
        <div className="loading-message">
          Đang tải slideshow...
        </div>
      </div>
    );
  }

  // Error state - removed since we're using HTML audio which handles errors internally

  return (
    <div className="slideshow-container" onClick={handleUserInteraction}>
      
      {/* Hidden HTML Audio Player */}
      {currentSlide?.audio && (
        <audio 
          ref={setAudioRef}
          style={{ display: 'none' }}
          onTimeUpdate={handleAudioTimeUpdate}
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
          onEnded={handleAudioEnded}
          onLoadedMetadata={handleAudioLoadedMetadata}
          key={currentSlide.id} // Force re-create when slide changes
        >
          <source src={`/${currentSlide.audio}`} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {/* Modern Play Button */}
      {currentSlide?.audio && (
        <button
          className="modern-play-button"
          onClick={toggleAudio}
          style={{
            position: 'absolute',
            top: '30px',
            right: '30px',
            zIndex: 100,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: isPlaying 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `scale(${beatScale})`,
            boxShadow: isPlaying 
              ? '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(118, 75, 162, 0.3)' 
              : '0 8px 32px rgba(240, 147, 251, 0.4), 0 4px 16px rgba(245, 87, 108, 0.3)',
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = `scale(${beatScale * 1.05})`;
            e.target.style.filter = 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.25)) brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = `scale(${beatScale})`;
            e.target.style.filter = 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))';
          }}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{
              marginLeft: isPlaying ? '0' : '2px', // Slight offset for play icon to appear centered
            }}
          >
            {isPlaying ? (
              // Pause icon
              <g>
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </g>
            ) : (
              // Play icon
              <path d="M8 5v14l11-7z"/>
            )}
          </svg>
        </button>
      )}
      

      {/* Responsive Image Container */}
      <div className="slide-image-container">
        {currentSlide?.image && !imageError && (
          <img
            src={currentSlide.image}
            alt={`Slide ${currentSlideIndex + 1}`}
            className={`slide-image ${imageLoading ? 'loading' : ''} ${effectiveDisplayMode === 'cover' ? 'cover-mode' : ''} ${effectiveDisplayMode === 'fill' ? 'fill-mode' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              opacity: imageLoading ? 0.7 : 1,
              objectFit: effectiveDisplayMode,
            }}
          />
        )}
        
        {/* Image Error State */}
        {imageError && (
          <div className="image-error">
            <div className="error-icon">⚠️</div>
            <p>Failed to load image</p>
            <p className="error-details">Slide {currentSlideIndex + 1}</p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {imageLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Image Display Mode Controls */}
      <ImageModeControls
        currentMode={imageDisplayMode}
        onModeChange={handleImageModeChange}
        isVisible={!imageLoading}
      />

      {/* Navigation Controls - Only Previous/Next */}
      <NavigationControls
        onPrevious={goToPrevious}
        onNext={goToNext}
        canGoPrevious={currentSlideIndex > 0}
        canGoNext={currentSlideIndex < totalSlides - 1}
        isVisible={!imageLoading}
        showPlayButton={false}
      />

      {/* VTT Subtitle Display */}
      {currentSlide?.vttFile && (
        <VTTSubtitleDisplayManual
          vttFile={currentSlide.vttFile}
          currentTime={currentTime}
          isVisible={!imageLoading}
          className="slideshow-subtitle"
        />
      )}

      {/* Fallback to old subtitle display if no VTT file */}
      {!currentSlide?.vttFile && (
        <SubtitleDisplay
          currentSubtitle={currentSubtitle}
          isVisible={!imageLoading && !!currentSubtitle}
        />
      )}

      {/* Progress Indicator */}
      <div className="progress-indicator">
        <div className="slide-counter">
          {currentSlideIndex + 1} / {totalSlides}
        </div>
        
        {/* Audio Progress Bar */}
        {duration > 0 && (
          <div className="audio-progress">
            <div 
              className="progress-bar"
              onClick={handleProgressBarClick}
              role="slider"
              aria-label="Audio progress"
              aria-valuemin="0"
              aria-valuemax={Math.floor(duration)}
              aria-valuenow={Math.floor(currentTime)}
            >
              <div 
                className="progress-fill"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="time-display">
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </div>
          </div>
        )}
      </div>

      {/* Slide Thumbnails (hidden) 
      <div className="slide-thumbnails">
        {metadata.slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`thumbnail ${index === currentSlideIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            style={{
              backgroundImage: `url(${slide.image})`
            }}
            aria-label={`Đi đến slide ${index + 1}`}
          />
        ))}
      </div>
      */}

      {/* Subtitle Debug Panel */}
      <SubtitleDebugPanel
        currentSlide={currentSlide}
        currentTime={currentTime}
        currentSubtitle={currentSubtitle}
        isVisible={showDebugPanel}
      />

      {/* Keyboard Shortcuts Hint */}
      <div className="keyboard-hints">
        <div className="hint">Space: Play/Pause</div>
        <div className="hint">← →: Previous/Next</div>
        <div className="hint">M: Image Mode</div>
        <div className="hint">D: Debug Panel</div>
        <div className="hint">Esc: Stop</div>
      </div>
    </div>
  );
};

export default SlideShow;