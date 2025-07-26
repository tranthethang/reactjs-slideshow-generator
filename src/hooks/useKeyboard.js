import { useEffect, useCallback } from 'react';

// Hook xử lý keyboard shortcuts
export const useKeyboard = ({
  onPlayPause,
  onPrevious,
  onNext,
  onStop,
  onToggleDebug,
  isEnabled = true
}) => {
  // Hàm xử lý key press
  const handleKeyPress = useCallback((event) => {
    if (!isEnabled) return;

    // Ngăn default behavior cho các phím được handle
    const handledKeys = [' ', 'ArrowLeft', 'ArrowRight', 'Escape', 'd', 'D'];
    if (handledKeys.includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
      case ' ': // Space - Play/Pause
        if (onPlayPause) {
          onPlayPause();
        }
        break;
        
      case 'ArrowLeft': // Arrow Left - Previous slide
        if (onPrevious) {
          onPrevious();
        }
        break;
        
      case 'ArrowRight': // Arrow Right - Next slide
        if (onNext) {
          onNext();
        }
        break;
        
      case 'Escape': // Escape - Stop và reset
        if (onStop) {
          onStop();
        }
        break;
        
      case 'd':
      case 'D': // D - Toggle Debug Panel
        if (onToggleDebug) {
          onToggleDebug();
        }
        break;
        
      default:
        break;
    }
  }, [onPlayPause, onPrevious, onNext, onStop, onToggleDebug, isEnabled]);

  // Hàm xử lý key down (cho continuous actions nếu cần)
  const handleKeyDown = useCallback((event) => {
    if (!isEnabled) return;

    // Có thể thêm logic cho continuous actions ở đây
    // Ví dụ: giữ phím để seek nhanh
    
  }, [isEnabled]);

  // Hàm xử lý key up
  const handleKeyUp = useCallback((event) => {
    if (!isEnabled) return;

    // Logic cho key up events nếu cần
    
  }, [isEnabled]);

  // Effect đăng ký event listeners
  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyPress, handleKeyDown, handleKeyUp, isEnabled]);

  // Hàm enable/disable keyboard shortcuts
  const enableKeyboard = useCallback(() => {
    // Logic enable keyboard có thể được implement ở đây
  }, []);

  const disableKeyboard = useCallback(() => {
    // Logic disable keyboard có thể được implement ở đây
  }, []);

  return {
    enableKeyboard,
    disableKeyboard
  };
};

// Hook bổ sung cho touch gestures (mobile support)
export const useTouchGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  isEnabled = true,
  swipeThreshold = 50 // Ngưỡng px để detect swipe
}) => {
  const touchStart = useCallback((event) => {
    if (!isEnabled) return;
    
    event.target.touchStartX = event.touches[0].clientX;
    event.target.touchStartY = event.touches[0].clientY;
    event.target.touchStartTime = Date.now();
  }, [isEnabled]);

  const touchEnd = useCallback((event) => {
    if (!isEnabled) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    
    const deltaX = touchEndX - event.target.touchStartX;
    const deltaY = touchEndY - event.target.touchStartY;
    const deltaTime = touchEndTime - event.target.touchStartTime;
    
    // Detect swipe
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < 100 && deltaTime < 300) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    // Detect tap (quick touch without movement)
    else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      if (onTap) {
        onTap();
      }
    }
  }, [isEnabled, swipeThreshold, onSwipeLeft, onSwipeRight, onTap]);

  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('touchstart', touchStart, { passive: true });
    document.addEventListener('touchend', touchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', touchStart);
      document.removeEventListener('touchend', touchEnd);
    };
  }, [touchStart, touchEnd, isEnabled]);

  return {
    // Touch gesture handlers được tự động đăng ký
  };
};

export default useKeyboard;