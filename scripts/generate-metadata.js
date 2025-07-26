const fs = require('fs');
const path = require('path');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const { stringify } = require('subtitle');

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

// Thuật toán tính toán subtitle timing cải tiến với phân tích ngữ nghĩa
function calculateSubtitleTiming(textContent, audioDuration) {
  // 1. Tách text thành segments chỉ tại dấu chấm để hiển thị cả câu
  const segments = splitByPunctuation(textContent, ['.', '!', '?']);
  
  if (segments.length === 0) return [];
  
  // 2. Phân tích độ phức tạp của từng segment
  const analyzedSegments = segments.map(segment => {
    const words = segment.text.trim().split(/\s+/);
    const syllableCount = estimateSyllables(segment.text);
    const complexityScore = calculateComplexityScore(words);
    
    return {
      ...segment,
      wordCount: words.length,
      syllableCount,
      complexityScore,
      // Điều chỉnh thời gian dựa trên độ phức tạp
      adjustedCharCount: segment.charCount * (1 + complexityScore * 0.3)
    };
  });
  
  // 3. Tính toán timing dựa trên phân tích
  const totalAdjustedChars = analyzedSegments.reduce((sum, seg) => sum + seg.adjustedCharCount, 0);
  const baseSpeed = totalAdjustedChars / audioDuration; // ký tự điều chỉnh/giây
  
  // 4. Thời gian nghỉ thông minh dựa trên ngữ cảnh (chỉ cho dấu chấm câu)
  const pauseTimes = {
    '.': Math.max(0.4, audioDuration * 0.02), // Tối thiểu 0.4s cho câu kết thúc
    '!': Math.max(0.3, audioDuration * 0.015), // Chấm than
    '?': Math.max(0.3, audioDuration * 0.015)  // Chấm hỏi
  };
  
  // 5. Tạo timeline với timing thông minh
  let currentTime = 0;
  const timeline = analyzedSegments.map((segment, index) => {
    // Tính thời gian đọc dựa trên độ phức tạp
    const baseDuration = segment.adjustedCharCount / baseSpeed;
    
    // Điều chỉnh cho segment đầu và cuối
    let adjustedDuration = baseDuration;
    if (index === 0) {
      adjustedDuration *= 1.1; // Chậm hơn một chút ở đầu
    }
    if (index === analyzedSegments.length - 1) {
      adjustedDuration *= 1.05; // Chậm hơn một chút ở cuối
    }
    
    const pauseTime = pauseTimes[segment.endPunctuation] || Math.max(0.1, audioDuration * 0.005);
    
    const item = {
      text: segment.text.trim(),
      startTime: Math.round(currentTime * 1000) / 1000,
      endTime: Math.round((currentTime + adjustedDuration) * 1000) / 1000,
      pauseAfter: Math.round(pauseTime * 1000) / 1000,
      // Thêm metadata để debug
      wordCount: segment.wordCount,
      complexityScore: Math.round(segment.complexityScore * 100) / 100
    };
    
    currentTime = item.endTime + pauseTime;
    return item;
  });
  
  // 6. Điều chỉnh cuối cùng để fit với audio duration
  if (timeline.length > 0) {
    const lastItem = timeline[timeline.length - 1];
    const totalCalculatedTime = lastItem.endTime + lastItem.pauseAfter;
    
    // Chỉ điều chỉnh nếu chênh lệch > 5%
    if (Math.abs(totalCalculatedTime - audioDuration) / audioDuration > 0.05) {
      const compressionRatio = (audioDuration * 0.95) / totalCalculatedTime; // Để lại 5% buffer
      let adjustedTime = 0;
      
      timeline.forEach(item => {
        const originalDuration = item.endTime - item.startTime;
        const adjustedDuration = originalDuration * compressionRatio;
        const adjustedPause = item.pauseAfter * compressionRatio;
        
        item.startTime = Math.round(adjustedTime * 1000) / 1000;
        item.endTime = Math.round((adjustedTime + adjustedDuration) * 1000) / 1000;
        item.pauseAfter = Math.round(adjustedPause * 1000) / 1000;
        
        adjustedTime = item.endTime + item.pauseAfter;
      });
    }
  }
  
  return timeline;
}

// Hàm ước tính số âm tiết
function estimateSyllables(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  let totalSyllables = 0;
  
  words.forEach(word => {
    if (word.length === 0) return;
    
    // Đếm nguyên âm
    const vowels = word.match(/[aeiouy]+/g);
    let syllables = vowels ? vowels.length : 1;
    
    // Điều chỉnh cho 'e' cuối
    if (word.endsWith('e') && syllables > 1) {
      syllables--;
    }
    
    // Tối thiểu 1 âm tiết
    totalSyllables += Math.max(1, syllables);
  });
  
  return totalSyllables;
}

// Hàm tính điểm độ phức tạp
function calculateComplexityScore(words) {
  let score = 0;
  
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    // Từ dài = phức tạp hơn
    if (cleanWord.length > 8) score += 0.3;
    else if (cleanWord.length > 5) score += 0.1;
    
    // Từ có nhiều âm tiết
    const syllables = estimateSyllables(cleanWord);
    if (syllables > 3) score += 0.2;
    else if (syllables > 2) score += 0.1;
    
    // Từ chuyên môn (có chứa các pattern phổ biến)
    if (/tion|sion|ment|ness|ity|ous|ful/.test(cleanWord)) {
      score += 0.15;
    }
  });
  
  return Math.min(1, score / words.length); // Normalize theo số từ
}

// Hàm chuyển đổi timeline thành format subtitle chuẩn
function timelineToSubtitleNodes(timeline) {
  return timeline.map((item, index) => ({
    type: 'cue',
    data: {
      start: Math.floor(item.startTime * 1000), // milliseconds
      end: Math.floor(item.endTime * 1000),
      text: item.text
    }
  }));
}

// Hàm tạo file SRT
function generateSRTFile(timeline, outputPath) {
  const subtitleNodes = timelineToSubtitleNodes(timeline);
  
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);
    const stringifyStream = stringify({ format: 'SRT' });
    
    stringifyStream.pipe(writeStream);
    
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
    stringifyStream.on('error', reject);
    
    // Ghi từng subtitle node
    subtitleNodes.forEach(node => {
      stringifyStream.write(node);
    });
    
    stringifyStream.end();
  });
}

// Hàm tạo file VTT
function generateVTTFile(timeline, outputPath) {
  const subtitleNodes = timelineToSubtitleNodes(timeline);
  
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);
    const stringifyStream = stringify({ format: 'WebVTT' });
    
    stringifyStream.pipe(writeStream);
    
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
    stringifyStream.on('error', reject);
    
    // Ghi từng subtitle node
    subtitleNodes.forEach(node => {
      stringifyStream.write(node);
    });
    
    stringifyStream.end();
  });
}

// Hàm quét và validate files
function scanFiles() {
  const publicDir = path.join(__dirname, '../public');
  const imagesDir = path.join(publicDir, 'images');
  const audiosDir = path.join(publicDir, 'audios');
  const subtitlesDir = path.join(publicDir, 'subtitles');
  const srtDir = path.join(publicDir, 'srt');
  const vttDir = path.join(publicDir, 'vtt');
  
  // Kiểm tra thư mục tồn tại
  if (!fs.existsSync(imagesDir) || !fs.existsSync(audiosDir) || !fs.existsSync(subtitlesDir)) {
    throw new Error('Thiếu thư mục cần thiết: images/, audios/, hoặc subtitles/');
  }
  
  // Tạo thư mục SRT và VTT nếu chưa tồn tại
  if (!fs.existsSync(srtDir)) {
    fs.mkdirSync(srtDir, { recursive: true });
    console.log('✓ Đã tạo thư mục srt/');
  }
  
  if (!fs.existsSync(vttDir)) {
    fs.mkdirSync(vttDir, { recursive: true });
    console.log('✓ Đã tạo thư mục vtt/');
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
        
        // Tạo file SRT
        const srtPath = path.join(__dirname, '../public/srt', `${slide.id}.srt`);
        await generateSRTFile(subtitleTimeline, srtPath);
        console.log(`  ✓ Đã tạo file SRT: ${slide.id}.srt`);
        
        // Tạo file VTT
        const vttPath = path.join(__dirname, '../public/vtt', `${slide.id}.vtt`);
        await generateVTTFile(subtitleTimeline, vttPath);
        console.log(`  ✓ Đã tạo file VTT: ${slide.id}.vtt`);
        
        processedSlides.push({
          id: slide.id,
          image: `images/${slide.image}`,
          audio: `audios/${slide.audio}`,
          audioDuration: Math.round(audioDuration * 100) / 100, // Làm tròn 2 chữ số thập phân
          subtitleContent,
          subtitleTimeline,
          srtFile: `srt/${slide.id}.srt`,
          vttFile: `vtt/${slide.id}.vtt`
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
  splitByPunctuation,
  timelineToSubtitleNodes,
  generateSRTFile,
  generateVTTFile,
  estimateSyllables,
  calculateComplexityScore
};