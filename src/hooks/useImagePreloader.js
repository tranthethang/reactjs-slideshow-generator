import { useEffect, useRef } from 'react';

// Hook for preloading adjacent slide images for better performance
const useImagePreloader = (metadata, currentSlideIndex) => {
  const preloadedImages = useRef(new Set());

  useEffect(() => {
    if (!metadata?.slides) return;

    const preloadImage = (src) => {
      if (!src || preloadedImages.current.has(src)) return;

      const img = new Image();
      img.onload = () => {
        preloadedImages.current.add(src);
      };
      img.onerror = () => {
        // Still mark as attempted to avoid retrying
        preloadedImages.current.add(src);
      };
      img.src = src;
    };

    // Preload current, next, and previous images
    const currentSlide = metadata.slides[currentSlideIndex];
    const nextSlide = metadata.slides[currentSlideIndex + 1];
    const prevSlide = metadata.slides[currentSlideIndex - 1];

    // Preload in order of priority
    if (currentSlide?.image) preloadImage(currentSlide.image);
    if (nextSlide?.image) preloadImage(nextSlide.image);
    if (prevSlide?.image) preloadImage(prevSlide.image);

    // Preload a few more slides ahead for smooth navigation
    for (let i = 2; i <= 3; i++) {
      const futureSlide = metadata.slides[currentSlideIndex + i];
      if (futureSlide?.image) {
        // Use setTimeout to avoid blocking the main thread
        setTimeout(() => preloadImage(futureSlide.image), i * 100);
      }
    }

  }, [metadata, currentSlideIndex]);

  return {
    isPreloaded: (src) => preloadedImages.current.has(src)
  };
};

export default useImagePreloader;