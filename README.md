# Slideshow App với Audio và Subtitle

Ứng dụng React slideshow hiển thị ảnh full-screen với audio và subtitle đồng bộ, không cần backend server.

## Tính năng

- ✅ Hiển thị slideshow ảnh full-screen
- ✅ Phát audio đồng bộ với từng slide
- ✅ Subtitle tự động theo thời gian audio
- ✅ Keyboard shortcuts (Space, Arrow keys, Esc)
- ✅ Touch gestures cho mobile (swipe)
- ✅ Responsive design
- ✅ Caching với LocalStorage
- ✅ Auto-advance khi audio kết thúc
- ✅ Progress indicator và thumbnails

## Cấu trúc dự án

```
slideshow-app/
├── public/
│   ├── data/
│   │   └── metadata.json (generated)
│   ├── images/           # Ảnh slides (1.jpg, 2.jpg, ...)
│   ├── audios/           # File audio (1.mp3, 2.mp3, ...)
│   └── subtitles/        # File subtitle (1.txt, 2.txt, ...)
├── scripts/
│   └── generate-metadata.js
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── App.js
│   └── index.js
└── package.json
```

## Cài đặt

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Chuẩn bị files:**
   - Thêm ảnh vào `public/images/` (1.jpg, 2.jpg, ...)
   - Thêm audio vào `public/audios/` (1.mp3, 2.mp3, ...)
   - Thêm subtitle vào `public/subtitles/` (1.txt, 2.txt, ...)

3. **Generate metadata:**
```bash
npm run generate-metadata
```

4. **Chạy ứng dụng:**
```bash
npm start
```

## Keyboard Shortcuts

- **Space**: Play/Pause
- **Arrow Left**: Slide trước
- **Arrow Right**: Slide tiếp theo  
- **Escape**: Stop và reset

## Touch Gestures (Mobile)

- **Swipe Left**: Slide tiếp theo
- **Swipe Right**: Slide trước
- **Tap**: Play/Pause

## Logic Subtitle Timing

Ứng dụng tự động tính toán thời gian hiển thị subtitle dựa trên:

1. **Phân đoạn**: Tách text tại dấu câu (. , ! ? ; :)
2. **Thời gian**: Tính theo số ký tự và độ dài audio
3. **Nghỉ**: Dừng tại dấu câu (0.3-0.5 giây)

## Caching Strategy

- Metadata được cache trong LocalStorage
- Auto-check version mới khi load
- Fallback về cache khi có lỗi network

## Build Production

```bash
npm run build
```

Deploy thư mục `build/` lên static hosting (Netlify, Vercel, v.v.)

## Scripts có sẵn

- `npm start`: Chạy development server
- `npm run build`: Build production
- `npm run generate-metadata`: Tạo metadata.json
- `npm test`: Chạy tests

## Troubleshooting

**Lỗi "Không thể tải metadata":**
1. Kiểm tra file `public/data/metadata.json` có tồn tại
2. Chạy `npm run generate-metadata`
3. Đảm bảo có đủ files tương ứng (image + audio + subtitle)

**Audio không phát:**
1. Kiểm tra format audio (mp3, wav, ogg)
2. Đảm bảo files không bị corrupt
3. Kiểm tra browser có hỗ trợ audio format

## Công nghệ sử dụng

- **React.js** với hooks
- **HTML5 Audio API**
- **LocalStorage** cho caching
- **CSS3** cho animations
- **get-audio-duration** cho xử lý audio metadata