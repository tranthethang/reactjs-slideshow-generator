import { useState, useEffect } from 'react';
import { fetchMetadataWithCache } from '../utils/cache';

// Hook quản lý metadata với caching logic
export const useMetadata = () => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hàm load metadata
  const loadMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchMetadataWithCache();
      setMetadata(data);
      
    } catch (err) {
      console.error('Lỗi load metadata:', err);
      setError(err.message || 'Không thể tải metadata');
    } finally {
      setLoading(false);
    }
  };

  // Hàm reload metadata (force refresh)
  const reloadMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Force fetch without cache
      const response = await fetch('/data/metadata.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMetadata(data);
      
    } catch (err) {
      console.error('Lỗi reload metadata:', err);
      setError(err.message || 'Không thể reload metadata');
    } finally {
      setLoading(false);
    }
  };

  // Load metadata khi component mount
  useEffect(() => {
    loadMetadata();
  }, []);

  return {
    metadata,
    loading,
    error,
    reloadMetadata
  };
};

export default useMetadata;