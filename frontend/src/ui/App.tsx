import React, { useState } from 'react';
import { Subtitle } from '../types';
import VideoPlayer from './VideoPlayer';
import styles from './App.module.css';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoFilename, setVideoFilename] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Subtitle style controls
  const [subtitleFontSize, setSubtitleFontSize] = useState(18);
  const [subtitleColor, setSubtitleColor] = useState('#ffffff');
  const [subtitlePosition, setSubtitlePosition] = useState(60);

  const handleUpload = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
      
      const data = await res.json();
      console.log(data);
      
      if (data.subtitles) {
        setSubtitles(data.subtitles);
      }
      
      if (data.video_path) {
        setVideoUrl(`http://localhost:8000/uploads/${data.file}`);
        setVideoFilename(data.file);
        setShowVideoPlayer(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownloadSRT = () => {
    if (videoFilename) {
      const link = document.createElement('a');
      link.href = `http://localhost:8000/download/srt/${videoFilename}`;
      link.download = videoFilename.split('.')[0] + '.srt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadVideo = async () => {
    if (videoFilename) {
      setIsDownloading(true);
      try {
        const response = await fetch(`http://localhost:8000/download/video/${videoFilename}?fontSize=${subtitleFontSize}&color=${encodeURIComponent(subtitleColor)}&position=${subtitlePosition}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = videoFilename.split('.')[0] + '_with_subtitles.mp4';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          throw new Error('Failed to download video');
        }
      } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download video with subtitles');
      } finally {
        setIsDownloading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Farsi Video Transcriber</h1>
          <p className={styles.subtitle}>Extract and edit Farsi subtitles from your videos</p>
        </div>
        
        <div className={styles.content}>
          <div className={styles.uploadSection}>
            <div className={styles.fileInputWrapper}>
              <input 
                type="file" 
                accept="video/*" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className={styles.fileInput}
                id="video-upload"
              />
              <label htmlFor="video-upload" className={styles.fileInputLabel}>
                📁 {file ? file.name : 'Choose video file'}
              </label>
            </div>
            <button 
              onClick={handleUpload} 
              disabled={!file || isProcessing}
              className={styles.uploadButton}
            >
              {isProcessing ? '⏳ Processing...' : '🎯 استخراج گفتار (فارسی)'}
            </button>
          </div>

          {error && (
            <div className={styles.error}>
              ❌ Error: {error}
            </div>
          )}

          {showVideoPlayer && videoUrl && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>🎬 Video Player</h2>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={handleDownloadSRT}
                    className={`${styles.button} ${styles.buttonSuccess}`}
                  >
                    📄 Download SRT
                  </button>
                  <button
                    onClick={handleDownloadVideo}
                    disabled={isDownloading}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    {isDownloading ? '⏳ Processing...' : '🎥 Download Video'}
                  </button>
                  <button
                    onClick={() => setShowVideoPlayer(false)}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                  >
                    ✏️ Edit Subtitles
                  </button>
                </div>
              </div>
              
              {/* Subtitle Style Controls */}
              <div className={styles.styleControls}>
                <h3>🎨 Subtitle Style</h3>
                <div className={styles.controlGroup}>
                  <label>
                    Font Size: {subtitleFontSize}px
                    <input
                      type="range"
                      min="12"
                      max="32"
                      value={subtitleFontSize}
                      onChange={(e) => setSubtitleFontSize(Number(e.target.value))}
                      className={styles.slider}
                    />
                  </label>
                  <label>
                    Text Color:
                    <input
                      type="color"
                      value={subtitleColor}
                      onChange={(e) => setSubtitleColor(e.target.value)}
                      className={styles.colorPicker}
                    />
                  </label>
                  <label>
                    Position: {subtitlePosition}px from bottom
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={subtitlePosition}
                      onChange={(e) => setSubtitlePosition(Number(e.target.value))}
                      className={styles.slider}
                    />
                  </label>
                </div>
              </div>
              
              <VideoPlayer 
                videoUrl={videoUrl}
                subtitles={subtitles}
                fontSize={subtitleFontSize}
                textColor={subtitleColor}
                bottomPosition={subtitlePosition}
                onTimeUpdate={(time) => {
                  console.log('Current time:', time);
                }}
              />
            </div>
          )}

          {subtitles.length > 0 && !showVideoPlayer && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>📝 Subtitles ({subtitles.length})</h2>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={handleDownloadSRT}
                    className={`${styles.button} ${styles.buttonSuccess}`}
                  >
                    📄 Download SRT
                  </button>
                  <button
                    onClick={handleDownloadVideo}
                    disabled={isDownloading}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    {isDownloading ? '⏳ Processing...' : '🎥 Download Video'}
                  </button>
                  <button
                    onClick={() => setShowVideoPlayer(true)}
                    className={`${styles.button} ${styles.buttonInfo}`}
                  >
                    ▶️ View Player
                  </button>
                </div>
              </div>
              <div className={styles.subtitlesList}>
                {subtitles.map((s) => (
                  <div key={s.id} className={styles.subtitleItem}>
                    <div className={styles.subtitleTime}>
                      ⏱️ {formatTime(s.start)} - {formatTime(s.end)}
                    </div>
                    <input
                      type="text"
                      value={s.text}
                      onChange={(e) =>
                        setSubtitles((prev) =>
                          prev.map((sub) =>
                            sub.id === s.id ? { ...sub, text: e.target.value } : sub
                          )
                        )
                      }
                      className={styles.subtitleInput}
                      placeholder="Enter subtitle text..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
