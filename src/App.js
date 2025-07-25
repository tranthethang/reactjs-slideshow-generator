import React from 'react';
import useMetadata from './hooks/useMetadata';
import SlideShow from './components/SlideShow';
import './App.css';

// Main App component
function App() {
  // Load metadata với caching logic
  const { metadata, loading, error, reloadMetadata } = useMetadata();

  // Loading state
  if (loading) {
    return (
      <div className="app-container loading">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <h2>Đang tải slideshow...</h2>
          <p>Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="app-container error">
        <div className="error-screen">
          <h2>Không thể tải slideshow</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              className="retry-button"
              onClick={reloadMetadata}
            >
              Thử lại
            </button>
            <button 
              className="refresh-button"
              onClick={() => window.location.reload()}
            >
              Refresh trang
            </button>
          </div>
          <div className="error-help">
            <h3>Gợi ý khắc phục:</h3>
            <ul>
              <li>Kiểm tra file metadata.json có tồn tại trong thư mục public/data/</li>
              <li>Chạy script: <code>npm run generate-metadata</code></li>
              <li>Đảm bảo có đủ files images/, audios/, subtitles/ tương ứng</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // No slides state
  if (!metadata || !metadata.slides || metadata.slides.length === 0) {
    return (
      <div className="app-container empty">
        <div className="empty-screen">
          <h2>Không có slides để hiển thị</h2>
          <p>Vui lòng thêm files và chạy generate-metadata script</p>
          <div className="empty-help">
            <h3>Cách thêm slides:</h3>
            <ol>
              <li>Thêm file ảnh vào thư mục <code>public/images/</code></li>
              <li>Thêm file audio tương ứng vào <code>public/audios/</code></li>
              <li>Thêm file subtitle tương ứng vào <code>public/subtitles/</code></li>
              <li>Chạy: <code>npm run generate-metadata</code></li>
              <li>Refresh trang</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Main slideshow
  return (
    <div className="app-container">
      <SlideShow metadata={metadata} />
      
      {/* Metadata Info (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <details>
            <summary>Debug Info</summary>
            <div className="debug-content">
              <p><strong>Version:</strong> {metadata.version}</p>
              <p><strong>Generated:</strong> {new Date(metadata.generatedAt).toLocaleString()}</p>
              <p><strong>Total Slides:</strong> {metadata.totalSlides}</p>
              <button onClick={reloadMetadata}>Reload Metadata</button>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default App;