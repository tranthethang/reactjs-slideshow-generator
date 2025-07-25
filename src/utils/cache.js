// Cache utilities cho LocalStorage
const CACHE_KEYS = {
  METADATA: 'slideshow_metadata',
  METADATA_VERSION: 'slideshow_metadata_version'
};

// Hàm đọc metadata từ cache
export const getCachedMetadata = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEYS.METADATA);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error('Lỗi đọc cache metadata:', error);
    return null;
  }
};

// Hàm ghi metadata vào cache
export const setCachedMetadata = (data) => {
  try {
    localStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(data));
    if (data.version) {
      localStorage.setItem(CACHE_KEYS.METADATA_VERSION, data.version.toString());
    }
    return true;
  } catch (error) {
    console.error('Lỗi ghi cache metadata:', error);
    return false;
  }
};

// Hàm lấy version từ cache
export const getCachedVersion = () => {
  try {
    const version = localStorage.getItem(CACHE_KEYS.METADATA_VERSION);
    return version ? parseInt(version) : null;
  } catch (error) {
    console.error('Lỗi đọc cache version:', error);
    return null;
  }
};

// Hàm xóa cache
export const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.METADATA);
    localStorage.removeItem(CACHE_KEYS.METADATA_VERSION);
    return true;
  } catch (error) {
    console.error('Lỗi xóa cache:', error);
    return false;
  }
};

// Hàm kiểm tra cache có valid không
export const isCacheValid = (cachedData) => {
  if (!cachedData) return false;
  
  try {
    // Kiểm tra cấu trúc cơ bản
    return (
      cachedData.version &&
      cachedData.generatedAt &&
      cachedData.slides &&
      Array.isArray(cachedData.slides)
    );
  } catch (error) {
    console.error('Lỗi validate cache:', error);
    return false;
  }
};

// Hàm fetch metadata với caching logic
export const fetchMetadataWithCache = async () => {
  try {
    // 1. Kiểm tra cache trước
    const cachedData = getCachedMetadata();
    const cachedVersion = getCachedVersion();
    
    // 2. Fetch metadata.json để check version mới
    const response = await fetch('/data/metadata.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const freshData = await response.json();
    
    // 3. So sánh version
    if (cachedData && isCacheValid(cachedData) && 
        cachedVersion === freshData.version) {
      // Sử dụng cache
      console.log('Sử dụng metadata từ cache');
      return cachedData;
    }
    
    // 4. Update cache với data mới
    console.log('Cập nhật cache với metadata mới');
    setCachedMetadata(freshData);
    return freshData;
    
  } catch (error) {
    console.error('Lỗi fetch metadata:', error);
    
    // Fallback về cache nếu có
    const cachedData = getCachedMetadata();
    if (cachedData && isCacheValid(cachedData)) {
      console.log('Fallback về cache do lỗi network');
      return cachedData;
    }
    
    throw error;
  }
};

export default {
  getCachedMetadata,
  setCachedMetadata,
  getCachedVersion,
  clearCache,
  isCacheValid,
  fetchMetadataWithCache
};