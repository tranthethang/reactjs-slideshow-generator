import React, { useState, useEffect, useRef } from 'react';

// Component hiển thị VTT subtitles với HTML5 track element
const VTTSubtitleDisplay = ({ 
  vttFile, 
  audioRef,
  isVisible = true,
  className = ''
}) => {
  const [currentCue, setCurrentCue] = useState(null);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!audioRef || !vttFile) return;

    // Tạo track element cho VTT
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Vietnamese';
    track.srclang = 'vi';
    track.src = `/${vttFile}`;
    track.default = true;

    // Thêm track vào audio element
    audioRef.appendChild(track);
    trackRef.current = track;

    // Lắng nghe sự kiện cuechange
    const handleCueChange = () => {
      const textTrack = track.track;
      if (textTrack && textTrack.activeCues && textTrack.activeCues.length > 0) {
        const activeCue = textTrack.activeCues[0];
        setCurrentCue({
          text: activeCue.text,
          startTime: activeCue.startTime,
          endTime: activeCue.endTime
        });
      } else {
        setCurrentCue(null);
      }
    };

    // Đợi track load xong
    track.addEventListener('load', () => {
      const textTrack = track.track;
      if (textTrack) {
        textTrack.mode = 'hidden'; // Ẩn subtitle mặc định của browser
        textTrack.addEventListener('cuechange', handleCueChange);
      }
    });

    // Cleanup
    return () => {
      if (trackRef.current) {
        const textTrack = trackRef.current.track;
        if (textTrack) {
          textTrack.removeEventListener('cuechange', handleCueChange);
        }
        if (audioRef.contains(trackRef.current)) {
          audioRef.removeChild(trackRef.current);
        }
      }
    };
  }, [audioRef, vttFile]);

  if (!isVisible || !currentCue) {
    return null;
  }

  return (
    <div className={`vtt-subtitle-display ${className}`}>
      <div className="subtitle-background">
        <p className="subtitle-text">
          {currentCue.text}
        </p>
      </div>
    </div>
  );
};

// Component hiển thị VTT subtitles bằng cách parse file VTT thủ công
const VTTSubtitleDisplayManual = ({ 
  vttFile, 
  currentTime,
  isVisible = true,
  className = ''
}) => {
  const [cues, setCues] = useState([]);
  const [currentCue, setCurrentCue] = useState(null);

  // Parse VTT file
  useEffect(() => {
    if (!vttFile) return;

    const loadVTT = async () => {
      try {
        const response = await fetch(`/${vttFile}`);
        const vttContent = await response.text();
        const parsedCues = parseVTT(vttContent);
        setCues(parsedCues);
      } catch (error) {
        console.error('Error loading VTT file:', error);
      }
    };

    loadVTT();
  }, [vttFile]);

  // Tìm cue hiện tại dựa trên currentTime
  useEffect(() => {
    if (cues.length === 0) return;

    const activeCue = cues.find(cue => 
      currentTime >= cue.startTime && currentTime <= cue.endTime
    );

    setCurrentCue(activeCue || null);
  }, [currentTime, cues]);

  if (!isVisible || !currentCue) {
    return null;
  }

  return (
    <div className={`vtt-subtitle-display ${className}`}>
      <div className="subtitle-background">
        <p className="subtitle-text">
          {currentCue.text}
        </p>
      </div>
    </div>
  );
};

// Hàm parse VTT content
function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const cues = [];
  let i = 0;

  // Bỏ qua header "WEBVTT"
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map(s => s.trim());
      const startTime = parseTimeString(startStr);
      const endTime = parseTimeString(endStr);
      
      // Đọc text của cue
      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() !== '') {
        if (text) text += ' ';
        text += lines[i].trim();
        i++;
      }
      
      if (text) {
        cues.push({
          startTime,
          endTime,
          text: text.replace(/<[^>]*>/g, '') // Loại bỏ HTML tags
        });
      }
    }
    i++;
  }

  return cues;
}

// Hàm parse time string (00:00:01.000 -> seconds)
function parseTimeString(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

export default VTTSubtitleDisplayManual;
export { VTTSubtitleDisplay };