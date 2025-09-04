import React, { useRef, useEffect, useState } from 'react';
import { Subtitle } from '../types';

interface VideoPlayerProps {
  videoUrl: string;
  subtitles: Subtitle[];
  onTimeUpdate?: (currentTime: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, subtitles, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // Find current subtitle
      const subtitle = subtitles.find(
        (sub) => time >= sub.start && time <= sub.end
      );
      setCurrentSubtitle(subtitle || null);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [subtitles, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      video.currentTime = newTime;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        
        {/* Subtitle overlay */}
        {currentSubtitle && (
          <div style={{
            position: 'absolute',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: '90%',
            zIndex: 10
          }}>
            {currentSubtitle.text}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {formatTime(duration)}
          </span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          style={{
            width: '100%',
            height: '6px',
            background: '#ddd',
            outline: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Subtitle list */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Subtitles Timeline</h3>
        <div style={{ 
          maxHeight: '200px', 
          overflowY: 'auto', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          padding: '10px'
        }}>
          {subtitles.map((subtitle) => (
            <div
              key={subtitle.id}
              style={{
                padding: '8px',
                margin: '4px 0',
                backgroundColor: currentSubtitle?.id === subtitle.id ? '#e3f2fd' : '#f5f5f5',
                borderRadius: '4px',
                cursor: 'pointer',
                border: currentSubtitle?.id === subtitle.id ? '2px solid #2196f3' : '2px solid transparent'
              }}
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  video.currentTime = subtitle.start;
                }
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '4px' 
              }}>
                {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
              </div>
              <div style={{ fontSize: '14px' }}>
                {subtitle.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
