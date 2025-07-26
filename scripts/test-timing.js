const fs = require('fs');
const path = require('path');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const { 
  calculateSubtitleTiming, 
  splitByPunctuation,
  estimateSyllables,
  calculateComplexityScore 
} = require('./generate-metadata');

// Script để test và so sánh timing algorithms
async function testTiming() {
  console.log('🧪 Testing Subtitle Timing Algorithm...\n');
  
  // Test với một file mẫu
  const testSlideId = 1;
  const subtitlePath = path.join(__dirname, '../public/subtitles', `${testSlideId}.txt`);
  const audioPath = path.join(__dirname, '../public/audios', `${testSlideId}.mp3`);
  
  if (!fs.existsSync(subtitlePath) || !fs.existsSync(audioPath)) {
    console.error('❌ Test files not found');
    return;
  }
  
  // Đọc dữ liệu
  const textContent = fs.readFileSync(subtitlePath, 'utf8').trim();
  const audioDuration = await getAudioDurationInSeconds(audioPath);
  
  console.log(`📄 Test Slide: ${testSlideId}`);
  console.log(`🎵 Audio Duration: ${audioDuration.toFixed(2)}s`);
  console.log(`📝 Text: "${textContent}"`);
  console.log(`📊 Text Length: ${textContent.length} chars\n`);
  
  // Phân tích text
  const segments = splitByPunctuation(textContent, ['.', ',', '!', '?', ';', ':']);
  console.log(`🔍 Text Analysis:`);
  console.log(`   Segments: ${segments.length}`);
  
  segments.forEach((segment, index) => {
    const words = segment.text.trim().split(/\s+/);
    const syllables = estimateSyllables(segment.text);
    const complexity = calculateComplexityScore(words);
    
    console.log(`   ${index + 1}. "${segment.text}"`);
    console.log(`      Words: ${words.length}, Syllables: ${syllables}, Complexity: ${(complexity * 100).toFixed(1)}%`);
  });
  
  // Tính toán timing
  console.log(`\n⏱️  Timing Calculation:`);
  const timeline = calculateSubtitleTiming(textContent, audioDuration);
  
  timeline.forEach((item, index) => {
    const duration = item.endTime - item.startTime;
    const wordsPerSecond = item.wordCount / duration;
    
    console.log(`   ${index + 1}. ${item.startTime.toFixed(2)}s - ${item.endTime.toFixed(2)}s (${duration.toFixed(2)}s)`);
    console.log(`      "${item.text}"`);
    console.log(`      Words: ${item.wordCount}, Speed: ${wordsPerSecond.toFixed(1)} words/s, Pause: ${item.pauseAfter.toFixed(2)}s`);
    console.log(`      Complexity: ${(item.complexityScore * 100).toFixed(1)}%\n`);
  });
  
  // Thống kê tổng quan
  const totalCalculatedTime = timeline.length > 0 ? 
    timeline[timeline.length - 1].endTime + timeline[timeline.length - 1].pauseAfter : 0;
  const averageWordsPerSecond = timeline.reduce((sum, item) => {
    const duration = item.endTime - item.startTime;
    return sum + (item.wordCount / duration);
  }, 0) / timeline.length;
  
  console.log(`📈 Statistics:`);
  console.log(`   Total Calculated Time: ${totalCalculatedTime.toFixed(2)}s`);
  console.log(`   Audio Duration: ${audioDuration.toFixed(2)}s`);
  console.log(`   Time Difference: ${(totalCalculatedTime - audioDuration).toFixed(2)}s`);
  console.log(`   Accuracy: ${(100 - Math.abs(totalCalculatedTime - audioDuration) / audioDuration * 100).toFixed(1)}%`);
  console.log(`   Average Speed: ${averageWordsPerSecond.toFixed(1)} words/second`);
  console.log(`   Average Complexity: ${(timeline.reduce((sum, item) => sum + item.complexityScore, 0) / timeline.length * 100).toFixed(1)}%`);
  
  // Kiểm tra gaps và overlaps
  console.log(`\n🔍 Timeline Validation:`);
  let hasIssues = false;
  
  for (let i = 1; i < timeline.length; i++) {
    const prevItem = timeline[i - 1];
    const currentItem = timeline[i];
    const gap = currentItem.startTime - (prevItem.endTime + prevItem.pauseAfter);
    
    if (Math.abs(gap) > 0.01) { // Tolerance of 10ms
      console.log(`   ⚠️  Gap/Overlap between segment ${i} and ${i + 1}: ${gap.toFixed(3)}s`);
      hasIssues = true;
    }
  }
  
  if (!hasIssues) {
    console.log(`   ✅ No timing issues detected`);
  }
  
  // Đề xuất cải tiến
  console.log(`\n💡 Recommendations:`);
  
  const fastSegments = timeline.filter(item => {
    const duration = item.endTime - item.startTime;
    const wordsPerSecond = item.wordCount / duration;
    return wordsPerSecond > 3; // Quá nhanh
  });
  
  const slowSegments = timeline.filter(item => {
    const duration = item.endTime - item.startTime;
    const wordsPerSecond = item.wordCount / duration;
    return wordsPerSecond < 1.5; // Quá chậm
  });
  
  if (fastSegments.length > 0) {
    console.log(`   ⚡ ${fastSegments.length} segments might be too fast (>3 words/s)`);
  }
  
  if (slowSegments.length > 0) {
    console.log(`   🐌 ${slowSegments.length} segments might be too slow (<1.5 words/s)`);
  }
  
  if (Math.abs(totalCalculatedTime - audioDuration) / audioDuration > 0.1) {
    console.log(`   🎯 Consider adjusting timing algorithm (>10% difference)`);
  }
  
  console.log(`\n✅ Timing test completed!`);
}

// Chạy test
if (require.main === module) {
  testTiming().catch(console.error);
}

module.exports = { testTiming };