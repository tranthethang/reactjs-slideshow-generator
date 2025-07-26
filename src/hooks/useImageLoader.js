import { useState, useEffect, useCallback } from 'react';

// Custom hook for handling image loading states and preloading
const useImageLoader = (imageSrc) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);

  const handleImageLoad = useCallback((e) => {
    setIsLoading(false);
    setHasError(false);
    
    // Get image dimensions for responsive handling
    const img = e.target;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight
    });
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    setImageDimensions(null);
  }, []);

  // Reset states when image source changes
  useEffect(() => {
    if (imageSrc) {
      setIsLoading(true);
      setHasError(false);
      setImageDimensions(null);
    }
  }, [imageSrc]);

  return {
    isLoading,
    hasError,
    imageDimensions,
    handleImageLoad,
    handleImageError
  };
};

export default useImageLoader;