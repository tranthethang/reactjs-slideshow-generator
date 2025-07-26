// Utilities cho subtitle timing

// Hàm tìm subtitle hiện tại dựa trên thời gian audio
export const getCurrentSubtitle = (subtitleTimeline, currentTime) => {
  if (!subtitleTimeline || subtitleTimeline.length === 0) return null;
  
  for (let i = 0; i < subtitleTimeline.length; i++) {
    const subtitle = subtitleTimeline[i];
    if (currentTime >= subtitle.startTime && currentTime <= subtitle.endTime) {
      return {
        ...subtitle,
        index: i
      };
    }
  }
  
  return null;
};

// Hàm tìm index của subtitle tiếp theo
export const getNextSubtitleIndex = (subtitleTimeline, currentTime) => {
  if (!subtitleTimeline || subtitleTimeline.length === 0) return -1;
  
  for (let i = 0; i < subtitleTimeline.length; i++) {
    if (currentTime < subtitleTimeline[i].startTime) {
      return i;
    }
  }
  
  return -1; // Không có subtitle tiếp theo
};

// Hàm tính phần trăm progress của subtitle hiện tại
export const getSubtitleProgress = (subtitleTimeline, currentTime) => {
  const currentSubtitle = getCurrentSubtitle(subtitleTimeline, currentTime);
  if (!currentSubtitle) return 0;
  
  const duration = currentSubtitle.endTime - currentSubtitle.startTime;
  const elapsed = currentTime - currentSubtitle.startTime;
  
  return Math.max(0, Math.min(1, elapsed / duration));
};

// Hàm format thời gian thành mm:ss
export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Hàm tính tổng thời gian của tất cả subtitles
export const getTotalSubtitleDuration = (subtitleTimeline) => {
  if (!subtitleTimeline || subtitleTimeline.length === 0) return 0;
  
  const lastSubtitle = subtitleTimeline[subtitleTimeline.length - 1];
  return lastSubtitle.endTime + lastSubtitle.pauseAfter;
};

// Hàm validate subtitle timeline
export const validateSubtitleTimeline = (subtitleTimeline) => {
  if (!Array.isArray(subtitleTimeline)) return false;
  
  for (let i = 0; i < subtitleTimeline.length; i++) {
    const subtitle = subtitleTimeline[i];
    
    // Kiểm tra cấu trúc cơ bản
    if (!subtitle.text || 
        typeof subtitle.startTime !== 'number' ||
        typeof subtitle.endTime !== 'number' ||
        typeof subtitle.pauseAfter !== 'number') {
      return false;
    }
    
    // Kiểm tra thời gian hợp lệ
    if (subtitle.startTime >= subtitle.endTime) {
      return false;
    }
    
    // Kiểm tra thứ tự thời gian với subtitle trước đó
    if (i > 0) {
      const prevSubtitle = subtitleTimeline[i - 1];
      if (subtitle.startTime < prevSubtitle.endTime + prevSubtitle.pauseAfter) {
        return false;
      }
    }
  }
  
  return true;
};

// Hàm tạo preview subtitle timeline (cho debugging)
export const createSubtitlePreview = (subtitleTimeline, maxItems = 5) => {
  if (!subtitleTimeline || subtitleTimeline.length === 0) return [];
  
  return subtitleTimeline.slice(0, maxItems).map((subtitle, index) => ({
    index,
    text: subtitle.text.length > 50 ? 
          subtitle.text.substring(0, 50) + '...' : 
          subtitle.text,
    timing: `${formatTime(subtitle.startTime)} - ${formatTime(subtitle.endTime)}`,
    duration: subtitle.endTime - subtitle.startTime,
    pause: subtitle.pauseAfter
  }));
};

export default {
  getCurrentSubtitle,
  getNextSubtitleIndex,
  getSubtitleProgress,
  formatTime,
  getTotalSubtitleDuration,
  validateSubtitleTimeline,
  createSubtitlePreview
};