import React, { useRef, useEffect, useState } from 'react';
import { Subtitle } from '../types';
import config from '../../../shared-config.json';
import styles from './VideoPlayer.module.css';

const { subtitleStyles } = config;

interface VideoPlayerProps {
  videoUrl: string;
  subtitles: Subtitle[];
  fontSize?: number;
  textColor?: string;
  bottomPosition?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  subtitles, 
  fontSize = subtitleStyles.fontSize,
  textColor = subtitleStyles.color,
  bottomPosition = subtitleStyles.bottomMargin,
  onTimeUpdate 
}) => {
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
    <div className={styles.container}>
      <div className={styles.videoSection}>
        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className={styles.video}
          />
          
          {/* Subtitle overlay */}
          {currentSubtitle && (
            <div 
              className={styles.subtitleOverlay}
              style={{
                bottom: `${bottomPosition}px`,
                backgroundColor: subtitleStyles.backgroundColor,
                color: textColor,
                padding: subtitleStyles.padding,
                borderRadius: subtitleStyles.borderRadius,
                fontSize: `${fontSize}px`,
                fontWeight: subtitleStyles.fontWeight,
                fontFamily: subtitleStyles.fontFamily,
              }}
            >
              {currentSubtitle.text}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          <div className={styles.timeDisplay}>
            <span>⏱️ {formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className={styles.progressBar}
          />
        </div>
      </div>

      {/* Subtitle list */}
      <div className={styles.subtitlesSection}>
        <h3 className={styles.subtitlesTitle}>
          📋 Subtitles Timeline
        </h3>
        <div className={styles.subtitlesList}>
          {subtitles.map((subtitle) => (
            <div
              key={subtitle.id}
              className={`${styles.subtitleItem} ${
                currentSubtitle?.id === subtitle.id ? styles.subtitleItemActive : ''
              }`}
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  video.currentTime = subtitle.start;
                }
              }}
            >
              <div className={styles.subtitleTime}>
                ⏰ {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
              </div>
              <div className={styles.subtitleText}>
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
