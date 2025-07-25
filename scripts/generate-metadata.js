const fs = require('fs');
const path = require('path');
const { getAudioDurationInSeconds } = require('get-audio-duration');

// Hàm phân chia text thành segments tại dấu câu
function splitByPunctuation(text, punctuations) {
  const segments = [];
  let currentSegment = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentSegment += char;
    
    if (punctuations.includes(char)) {
      const cleanText = currentSegment.trim();
      if (cleanText) {
        segments.push({
          text: cleanText,
          charCount: cleanText.replace(/[.,!?;:\s]/g, '').length,
          endPunctuation: char
        });
      }
      currentSegment = '';
    }
  }
  
  // Thêm phần còn lại nếu có
  if (currentSegment.trim()) {
    segments.push({
      text: currentSegment.trim(),
      charCount: currentSegment.trim().replace(/[.,!?;:\s]/g, '').length,
      endPunctuation: ''
    });
  }
  
  return segments;
}

// Thuật toán tính toán subtitle timing theo spec
function calculateSubtitleTiming(textContent, audioDuration) {
  // 1. Tách text thành segments tại dấu câu
  const segments = splitByPunctuation(textContent, ['.', ',', '!', '?', ';', ':']);
  
  // 2. Tính toán timing
  const totalChars = textContent.replace(/[.,!?;:\s]/g, '').length; // Chỉ đếm chữ
  const baseTimePerChar = audioDuration / totalChars;
  
  // 3. Thời gian nghỉ tại dấu câu
  const pauseTimes = {
    '.': 0, // giây
    '!': 0,
    '?': 0,
    ',': 0,
    ';': 0,
    ':': 0
  };
  
  // 4. Tạo timeline với pause
  let currentTime = 0;
  const timeline = segments.map(segment => {
    const duration = segment.charCount * baseTimePerChar;
    const pauseTime = pauseTimes[segment.endPunctuation] || 0.05;
    
    const item = {
      text: segment.text.trim(),
      startTime: currentTime,
      endTime: currentTime + duration,
      pauseAfter: pauseTime
    };
    
    currentTime = item.endTime + pauseTime;
    return item;
  });
  
  return timeline;
}

// Hàm quét và validate files
function scanFiles() {
  const publicDir = path.join(__dirname, '../public');
  const imagesDir = path.join(publicDir, 'images');
  const audiosDir = path.join(publicDir, 'audios');
  const subtitlesDir = path.join(publicDir, 'subtitles');
  
  // Kiểm tra thư mục tồn tại
  if (!fs.existsSync(imagesDir) || !fs.existsSync(audiosDir) || !fs.existsSync(subtitlesDir)) {
    throw new Error('Thiếu thư mục cần thiết: images/, audios/, hoặc subtitles/');
  }
  
  // Lấy danh sách files
  const imageFiles = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
  const audioFiles = fs.readdirSync(audiosDir).filter(f => /\.(mp3|wav|ogg)$/i.test(f));
  const subtitleFiles = fs.readdirSync(subtitlesDir).filter(f => /\.txt$/i.test(f));
  
  // Tìm các slide hợp lệ (có đủ 3 files tương ứng)
  const validSlides = [];
  
  imageFiles.forEach(imageFile => {
    const baseName = path.parse(imageFile).name;
    const audioFile = audioFiles.find(f => path.parse(f).name === baseName);
    const subtitleFile = subtitleFiles.find(f => path.parse(f).name === baseName);
    
    if (audioFile && subtitleFile) {
      validSlides.push({
        id: parseInt(baseName) || baseName,
        image: imageFile,
        audio: audioFile,
        subtitle: subtitleFile
      });
    } else {
      console.warn(`Cảnh báo: Slide ${baseName} thiếu files tương ứng`);
    }
  });
  
  // Sắp xếp theo ID
  validSlides.sort((a, b) => {
    if (typeof a.id === 'number' && typeof b.id === 'number') {
      return a.id - b.id;
    }
    return a.id.toString().localeCompare(b.id.toString());
  });
  
  return validSlides;
}

// Hàm chính generate metadata
async function generateMetadata() {
  try {
    console.log('Bắt đầu generate metadata...');
    
    // 1. Scan files
    const validSlides = scanFiles();
    console.log(`Tìm thấy ${validSlides.length} slides hợp lệ`);
    
    if (validSlides.length === 0) {
      throw new Error('Không tìm thấy slides hợp lệ nào');
    }
    
    // 2. Process từng slide
    const processedSlides = [];
    
    for (const slide of validSlides) {
      console.log(`Đang xử lý slide ${slide.id}...`);
      
      try {
        // Đọc audio duration
        const audioPath = path.join(__dirname, '../public/audios', slide.audio);
        const audioDuration = await getAudioDurationInSeconds(audioPath);
        
        // Đọc subtitle content
        const subtitlePath = path.join(__dirname, '../public/subtitles', slide.subtitle);
        const subtitleContent = fs.readFileSync(subtitlePath, 'utf8').trim();
        
        // Tính toán subtitle timeline
        const subtitleTimeline = calculateSubtitleTiming(subtitleContent, audioDuration);
        
        processedSlides.push({
          id: slide.id,
          image: `images/${slide.image}`,
          audio: `audios/${slide.audio}`,
          audioDuration: Math.round(audioDuration * 100) / 100, // Làm tròn 2 chữ số thập phân
          subtitleContent,
          subtitleTimeline
        });
        
        console.log(`✓ Slide ${slide.id} hoàn thành`);
      } catch (error) {
        console.error(`✗ Lỗi xử lý slide ${slide.id}:`, error.message);
      }
    }
    
    // 3. Tạo metadata object
    const metadata = {
      version: 1,
      generatedAt: new Date().toISOString(),
      totalSlides: processedSlides.length,
      slides: processedSlides
    };
    
    // 4. Ghi file metadata.json
    const metadataPath = path.join(__dirname, '../public/data/metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`✓ Metadata đã được tạo thành công: ${metadataPath}`);
    console.log(`✓ Tổng cộng ${processedSlides.length} slides`);
    
  } catch (error) {
    console.error('✗ Lỗi generate metadata:', error.message);
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  generateMetadata();
}

module.exports = {
  generateMetadata,
  calculateSubtitleTiming,
  splitByPunctuation
};