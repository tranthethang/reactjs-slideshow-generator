# Slideshow App with Audio and Subtitle

A React slideshow application that displays full-screen images with synchronized audio and subtitles, no backend server required.

## Features

- ✅ Full-screen image slideshow display
- ✅ Synchronized audio playback for each slide
- ✅ Automatic subtitles based on audio timing
- ✅ Keyboard shortcuts (Space, Arrow keys, Esc)
- ✅ Touch gestures for mobile (swipe)
- ✅ Responsive design
- ✅ LocalStorage caching
- ✅ Auto-advance when audio ends
- ✅ Progress indicator and thumbnails

## Project Structure

```
slideshow-app/
├── public/
│   ├── data/
│   │   └── metadata.json (generated)
│   ├── images/           # Slide images (1.jpg, 2.jpg, ...)
│   ├── audios/           # Audio files (1.mp3, 2.mp3, ...)
│   └── subtitles/        # Subtitle files (1.txt, 2.txt, ...)
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

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Prepare files:**
   - Add images to `public/images/` (1.jpg, 2.jpg, ...)
   - Add audio to `public/audios/` (1.mp3, 2.mp3, ...)
   - Add subtitles to `public/subtitles/` (1.txt, 2.txt, ...)

3. **Generate metadata:**
```bash
npm run generate-metadata
```

4. **Run the application:**
```bash
npm start
```

## Keyboard Shortcuts

- **Space**: Play/Pause
- **Arrow Left**: Previous slide
- **Arrow Right**: Next slide  
- **Escape**: Stop and reset

## Touch Gestures (Mobile)

- **Swipe Left**: Next slide
- **Swipe Right**: Previous slide
- **Tap**: Play/Pause

## Subtitle Timing Logic

The application automatically calculates subtitle display timing based on:

1. **Segmentation**: Split text at punctuation marks (. , ! ? ; :)
2. **Timing**: Calculate based on character count and audio duration
3. **Pauses**: Pause at punctuation marks (0.3-0.5 seconds)

## Caching Strategy

- Metadata is cached in LocalStorage
- Auto-check for new version on load
- Fallback to cache when network error occurs

## Build Production

```bash
npm run build
```

Deploy the `build/` folder to static hosting (Netlify, Vercel, etc.)

## Available Scripts

- `npm start`: Run development server
- `npm run build`: Build for production
- `npm run generate-metadata`: Generate metadata.json
- `npm test`: Run tests

## Troubleshooting

**Error "Cannot load metadata":**
1. Check if `public/data/metadata.json` file exists
2. Run `npm run generate-metadata`
3. Ensure all corresponding files exist (image + audio + subtitle)

**Audio not playing:**
1. Check audio format (mp3, wav, ogg)
2. Ensure files are not corrupted
3. Check if browser supports the audio format

## Technologies Used

- **React.js** with hooks
- **HTML5 Audio API**
- **LocalStorage** for caching
- **CSS3** for animations
- **get-audio-duration** for audio metadata processing