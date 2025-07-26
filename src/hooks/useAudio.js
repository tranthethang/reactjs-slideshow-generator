import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentSubtitle } from '../utils/subtitleTiming';

// Hook quản lý audio control và sync với subtitle
export const useAudio = (slide, onSlideEnd) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const slideRef = useRef(slide);



  // Update slide ref when slide changes
  useEffect(() => {
    slideRef.current = slide;
  }, [slide]);

  // Hàm update current time và subtitle
  const updateTime = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Update subtitle hiện tại - use current slide from ref
      if (slideRef.current?.subtitleTimeline) {
        const subtitle = getCurrentSubtitle(slideRef.current.subtitleTimeline, time);
        setCurrentSubtitle(subtitle);
      }
    }
  }, []); // No dependencies needed since we use refs

  // Hàm play audio
  const play = useCallback(async () => {
    console.log('=== PLAY FUNCTION CALLED ===');
    console.log('audioRef.current:', audioRef.current);
    console.log('slide:', slide);
    
    if (!audioRef.current) {
      console.error('Audio ref is null');
      console.error('Slide data:', slide);
      return;
    }

    console.log('Attempting to play audio...');
    console.log('Audio readyState:', audioRef.current.readyState);
    console.log('Audio src:', audioRef.current.src);
    console.log('Audio networkState:', audioRef.current.networkState);
    console.log('Audio error:', audioRef.current.error);
    console.log('User has interacted:', window.userHasInteracted);
    
    // Check if user has interacted
    if (!window.userHasInteracted) {
      console.warn('User has not interacted yet, cannot play audio');
      setError('Vui lòng click vào màn hình để enable audio');
      return;
    }

    // Check if audio has an error
    if (audioRef.current.error) {
      console.error('Audio has error before play:', audioRef.current.error);
      setError(`Audio error: ${audioRef.current.error.message}`);
      return;
    }

    try {
      // Wait for audio to be ready if needed
      if (audioRef.current.readyState < 2) {
        console.log('Audio not ready, waiting for loadeddata event...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio loading timeout'));
          }, 5000);
          
          const onLoadedData = () => {
            clearTimeout(timeout);
            audioRef.current.removeEventListener('loadeddata', onLoadedData);
            audioRef.current.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e) => {
            clearTimeout(timeout);
            audioRef.current.removeEventListener('loadeddata', onLoadedData);
            audioRef.current.removeEventListener('error', onError);
            reject(e);
          };
          
          audioRef.current.addEventListener('loadeddata', onLoadedData);
          audioRef.current.addEventListener('error', onError);
        });
      }

      // Play audio
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Audio playing successfully');
        setIsPlaying(true);
        
        // Start time tracking
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(updateTime, 100);
      }
      
    } catch (err) {
      console.error('Play error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      
      if (err.name === 'NotAllowedError') {
        setError('Trình duyệt chặn auto-play. Vui lòng click vào màn hình trước khi phát audio.');
      } else if (err.name === 'NotSupportedError') {
        setError('Định dạng audio không được hỗ trợ.');
      } else if (err.message === 'Audio loading timeout') {
        setError('Audio loading timeout. Kiểm tra file audio có tồn tại không.');
      } else {
        setError(`Lỗi phát audio: ${err.message}`);
      }
    }
  }, []); // Remove updateTime dependency since updateTime has no dependencies

  // Hàm pause audio
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearInterval(intervalRef.current);
    }
  }, []);

  // Hàm toggle play/pause
  const togglePlay = useCallback(() => {
    console.log('=== TOGGLE PLAY CALLED ===');
    console.log('togglePlay called, isPlaying:', isPlaying);
    console.log('audioRef.current exists:', !!audioRef.current);
    if (isPlaying) {
      console.log('Calling pause()');
      pause();
    } else {
      console.log('Calling play()');
      play();
    }
  }, [isPlaying, play, pause]);

  // Hàm seek đến thời điểm cụ thể
  const seekTo = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
      updateTime();
    }
  }, [duration, updateTime]);

  // Hàm stop và reset
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentSubtitle(null);
      clearInterval(intervalRef.current);
    }
  }, []);

  // Effect tạo audio element khi slide thay đổi
  useEffect(() => {
    console.log('=== AUDIO ELEMENT CREATION EFFECT ===');
    console.log('useEffect: Creating audio element for slide:', slide?.id);
    console.log('slide?.audio:', slide?.audio);
    
    // Cleanup existing audio
    if (audioRef.current) {
      console.log('Cleaning up existing audio element');
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!slide?.audio) {
      console.log('No audio in slide, skipping audio creation');
      return;
    }

    // Create new audio element
    const audioPath = slide.audio.startsWith('/') ? slide.audio : `/${slide.audio}`;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = audioPath;
    audioRef.current = audio;
    
    console.log('Audio element created and assigned to ref');
    console.log('Loading audio:', audioPath);
    console.log('Full audio URL:', new URL(audioPath, window.location.origin).href);

    // Audio event listeners
    audio.addEventListener('loadstart', () => {
      console.log('Audio loadstart');
      setLoading(true);
      setError(null);
    });

    audio.addEventListener('loadedmetadata', () => {
      console.log('Audio loadedmetadata, duration:', audio.duration);
      setDuration(audio.duration);
      setLoading(false);
    });

    audio.addEventListener('canplaythrough', () => {
      console.log('Audio canplaythrough');
      setLoading(false);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      console.error('Error details:', e.target.error);
      console.error('Audio path:', audioPath);
      console.error('Audio src:', audio.src);
      console.error('Audio readyState:', audio.readyState);
      console.error('Audio networkState:', audio.networkState);
      setError(`Không thể tải audio: ${audioPath} - ${e.target.error?.message || 'Unknown error'}`);
      setLoading(false);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      clearInterval(intervalRef.current);
      
      // Auto-advance để chuyển slide tiếp theo
      if (onSlideEnd) {
        onSlideEnd();
      }
    });

    // Force load audio
    console.log('Calling audio.load()...');
    audio.load();
    
    // Test if audio can be accessed immediately
    setTimeout(() => {
      console.log('Audio state after load:', {
        readyState: audio.readyState,
        networkState: audio.networkState,
        error: audio.error,
        src: audio.src,
        duration: audio.duration,
        paused: audio.paused
      });
      console.log('audioRef.current after creation:', audioRef.current);
    }, 100);
    
    // Also test after a longer delay
    setTimeout(() => {
      console.log('Audio state after 1 second:', {
        readyState: audio.readyState,
        networkState: audio.networkState,
        error: audio.error,
        duration: audio.duration
      });
    }, 1000);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearInterval(intervalRef.current);
    };
  }, [slide?.audio, slide?.id, onSlideEnd]);

  // Effect reset khi slide thay đổi
  useEffect(() => {
    setCurrentTime(0);
    setCurrentSubtitle(null);
    setIsPlaying(false);
    setError(null);
    clearInterval(intervalRef.current);
  }, [slide?.id]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    loading,
    error,
    currentSubtitle,
    play,
    pause,
    togglePlay,
    seekTo,
    stop
  };
};

export default useAudio;