import React, { useState, useCallback, useEffect } from 'react';
import useKeyboard, { useTouchGestures } from '../hooks/useKeyboard';
import SubtitleDisplay from './SubtitleDisplay';
import NavigationControls from './NavigationControls';
import { getCurrentSubtitle } from '../utils/subtitleTiming';

// Main slideshow container component
const SlideShow = ({ metadata }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(!!window.userHasInteracted);

  // Current slide data
  const currentSlide = metadata?.slides?.[currentSlideIndex] || null;
  const totalSlides = metadata?.totalSlides || 0;

  // State for HTML audio player
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);
  const [beatScale, setBeatScale] = useState(1);

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

  const goToSlide = useCallback((index) => {
    if (index >= 0 && index < totalSlides && index !== currentSlideIndex) {
      setCurrentSlideIndex(index);
    }
  }, [currentSlideIndex, totalSlides]);

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
    setUserHasInteracted(true);
  }, []);



  // Keyboard shortcuts
  useKeyboard({
    onPrevious: goToPrevious,
    onNext: goToNext,
    isEnabled: !isLoading
  });

  // Touch gestures cho mobile
  useTouchGestures({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    onTap: handleUserInteraction, // Just enable user interaction on tap
    isEnabled: !isLoading
  });

  // Effect để preload image
  useEffect(() => {
    if (currentSlide?.image) {
      setIsLoading(true);
      const img = new Image();
      img.onload = () => setIsLoading(false);
      img.onerror = () => setIsLoading(false);
      img.src = currentSlide.image;
    }
  }, [currentSlide?.image]);

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

      {/* Custom Play Button */}
      {currentSlide?.audio && (
        <button
          className="custom-play-button"
          onClick={toggleAudio}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 100,
            width: '30px', // Reduced by half from 60px
            height: '30px', // Reduced by half from 60px
            borderRadius: '50%',
            border: 'none',
            background: isPlaying ? '#0066FF' : '#FF0000', // Blue when playing, red when paused
            color: 'white',
            fontSize: `${12 * beatScale}px`, // Reduced base size and apply beat scale
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: isPlaying ? 'background-color 0.3s ease' : 'all 0.3s ease',
            transform: `scale(${beatScale})`, // Apply beat animation
            boxShadow: isPlaying ? '0 0 15px rgba(0, 102, 255, 0.5)' : '0 0 10px rgba(255, 0, 0, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (!isPlaying) {
              e.target.style.background = '#CC0000';
              e.target.style.transform = `scale(${beatScale * 1.1})`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying) {
              e.target.style.background = '#FF0000';
              e.target.style.transform = `scale(${beatScale})`;
            }
          }}
        >
          {isPlaying ? '⏸' : '▶'} {/* Using font icons instead of emojis */}
        </button>
      )}
      
      {/* Welcome Message for First Interaction */}
      {!userHasInteracted && (
        <div className="welcome-overlay">
          <div className="welcome-message">
            <h2>🎵 Slideshow với Audio</h2>
            <p>Click vào màn hình để bắt đầu</p>
            <p>Sử dụng:</p>
            <ul>
              <li><strong>Audio Player</strong>: Điều khiển phát nhạc</li>
              <li><strong>← →</strong>: Previous/Next slide</li>
              <li><strong>Swipe</strong>: Vuốt để chuyển slide</li>
            </ul>
          </div>
        </div>
      )}
      {/* Background Image */}
      <div 
        className={`slide-background ${isLoading ? 'loading' : ''}`}
        style={{
          backgroundImage: currentSlide?.image ? `url(${currentSlide.image})` : 'none',
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Navigation Controls - Only Previous/Next */}
      <NavigationControls
        onPrevious={goToPrevious}
        onNext={goToNext}
        canGoPrevious={currentSlideIndex > 0}
        canGoNext={currentSlideIndex < totalSlides - 1}
        isVisible={!isLoading}
        showPlayButton={false}
      />

      {/* Subtitle Display */}
      <SubtitleDisplay
        currentSubtitle={currentSubtitle}
        isVisible={!isLoading && !!currentSubtitle}
      />

      {/* Progress Indicator */}
      <div className="progress-indicator">
        <div className="slide-counter">
          {currentSlideIndex + 1} / {totalSlides}
        </div>
        
        {/* Audio Progress Bar */}
        {duration > 0 && (
          <div className="audio-progress">
            <div className="progress-bar">
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

      {/* Keyboard Shortcuts Hint */}
      <div className="keyboard-hints">
        <div className="hint">Space: Play/Pause</div>
        <div className="hint">← →: Previous/Next</div>
        <div className="hint">Esc: Stop</div>
      </div>
    </div>
  );
};

export default SlideShow;