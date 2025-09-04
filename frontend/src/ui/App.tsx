import React, { useState } from 'react';
import { Subtitle } from '../types';
import VideoPlayer from './VideoPlayer';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoFilename, setVideoFilename] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
        const response = await fetch(`http://localhost:8000/download/video/${videoFilename}`);
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
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Farsi Video Transcriber</h1>
      
      <div style={{ marginBottom: 20 }}>
        <input 
          type="file" 
          accept="video/*" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginRight: 10 }}
        />
        <button 
          onClick={handleUpload} 
          disabled={!file || isProcessing}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: isProcessing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? 'Processing...' : 'استخراج گفتار (فارسی)'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffe6e6', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      {showVideoPlayer && videoUrl && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Video Player with Subtitles</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownloadSRT}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Download SRT
              </button>
              <button
                onClick={handleDownloadVideo}
                disabled={isDownloading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isDownloading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isDownloading ? 'not-allowed' : 'pointer'
                }}
              >
                {isDownloading ? 'Processing...' : 'Download Video with Subtitles'}
              </button>
              <button
                onClick={() => setShowVideoPlayer(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Edit Subtitles
              </button>
            </div>
          </div>
          <VideoPlayer 
            videoUrl={videoUrl}
            subtitles={subtitles}
            onTimeUpdate={(time) => {
              // Optional: handle time updates
              console.log('Current time:', time);
            }}
          />
        </div>
      )}

      {subtitles.length > 0 && !showVideoPlayer && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Subtitles ({subtitles.length} segments)</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownloadSRT}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Download SRT
              </button>
              <button
                onClick={handleDownloadVideo}
                disabled={isDownloading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isDownloading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isDownloading ? 'not-allowed' : 'pointer'
                }}
              >
                {isDownloading ? 'Processing...' : 'Download Video with Subtitles'}
              </button>
              <button
                onClick={() => setShowVideoPlayer(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                View Video Player
              </button>
            </div>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
            {subtitles.map((s) => (
              <div key={s.id} style={{ 
                marginBottom: '10px', 
                padding: '10px', 
                border: '1px solid #eee',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginBottom: '5px' 
                }}>
                  {formatTime(s.start)} - {formatTime(s.end)}
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
                  style={{ 
                    width: '100%', 
                    padding: '5px', 
                    border: '1px solid #ccc',
                    borderRadius: '3px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
