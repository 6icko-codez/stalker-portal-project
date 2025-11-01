'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { useIPTVStore } from '@/lib/stores/useIPTVStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  SkipBack,
  SkipForward,
  PictureInPicture,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  streamUrl?: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ streamUrl, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<{
    title: string;
    message: string;
    type: 'error' | 'warning' | 'cors';
    details?: string;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { playerState, updatePlayerState, currentChannel, currentMovie, currentSeries } = useIPTVStore();

  // Determine current content and stream URL
  const currentContent = currentChannel || currentMovie || currentSeries;
  const effectiveStreamUrl = streamUrl || currentContent?.streamUrl;

  // Cleanup function to properly destroy HLS and reset video
  const cleanupPlayer = useCallback(() => {
    const video = videoRef.current;
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.currentTime = 0;
    }
    
    setIsBuffering(false);
  }, []);

  // Load stream with error handling
  const loadStream = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) return;

    console.log('[VideoPlayer] Loading stream:', {
      url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
      isM3U8: url.includes('.m3u8'),
    });

    setIsBuffering(true);
    setError(null);

    const handleNativeVideoError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      console.error('[VideoPlayer] Native video error:', target.error);
      
      // Detect CORS error
      if (target.error?.message.includes('CORS') || target.error?.message.includes('cross-origin')) {
        setError({
          title: 'Playback Blocked (CORS Error)',
          message: 'The video source is blocking playback from this browser. This is a common issue with IPTV portals.',
          type: 'cors',
          details: url,
        });
      } else {
        setError({
          title: 'Playback Error',
          message: 'Could not load the stream. The channel may be unavailable or the format is unsupported.',
          type: 'error',
        });
      }
      setIsBuffering(false);
    };

    // Check if HLS is supported
    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
        });

        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('[VideoPlayer] Manifest parsed successfully');
          setIsBuffering(false);
          setRetryCount(0);
          
          if (playerState.isPlaying) {
            video.play().catch(err => {
              console.error('[VideoPlayer] Play error:', err);
              setError({
                title: 'Playback Error',
                message: 'Could not start playback. Click to retry.',
                type: 'warning',
              });
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('[VideoPlayer] HLS Error:', data);
          if (data.fatal) {
            setError({
              title: 'Stream Error',
              message: `A fatal error occurred (${data.type}). The stream may be down.`,
              type: 'error',
            });
            setIsBuffering(false);
            cleanupPlayer();
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        console.log('[VideoPlayer] Using native HLS support');
        video.src = url;
        video.addEventListener('error', handleNativeVideoError, { once: true });
      } else {
        setError({
          title: 'Not Supported',
          message: 'Your browser does not support HLS streaming. Please try a different browser like Chrome or Firefox.',
          type: 'error',
        });
        setIsBuffering(false);
      }
    } else {
      // Direct stream (MP4, etc.)
      console.log('[VideoPlayer] Using direct stream');
      video.src = url;
      video.addEventListener('error', handleNativeVideoError, { once: true });
    }
  }, [cleanupPlayer, playerState.isPlaying]);

  // Main effect to load stream when URL changes
  useEffect(() => {
    if (!videoRef.current || !effectiveStreamUrl) {
      cleanupPlayer();
      setError(null);
      return;
    }

    cleanupPlayer();
    loadStream(effectiveStreamUrl);

    return () => {
      cleanupPlayer();
    };
  }, [effectiveStreamUrl, cleanupPlayer, loadStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      updatePlayerState({
        currentTime: video.currentTime,
        duration: video.duration,
      });
    };

    const handlePlay = () => {
      updatePlayerState({ isPlaying: true });
      setIsBuffering(false);
    };

    const handlePause = () => {
      updatePlayerState({ isPlaying: false });
    };

    const handleVolumeChange = () => {
      updatePlayerState({
        volume: video.volume,
        isMuted: video.muted,
      });
    };

    const handleWaiting = () => {
      console.log('[VideoPlayer] Buffering...');
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      console.log('[VideoPlayer] Can play');
      setIsBuffering(false);
    };

    const handleLoadStart = () => {
      console.log('[VideoPlayer] Load start');
      setIsBuffering(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [updatePlayerState]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value[0];
    if (video.muted && value[0] > 0) {
      video.muted = false;
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime += seconds;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      updatePlayerState({ isFullscreen: true });
    } else {
      document.exitFullscreen();
      updatePlayerState({ isFullscreen: false });
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        updatePlayerState({ isPiP: false });
      } else {
        await video.requestPictureInPicture();
        updatePlayerState({ isPiP: true });
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const changeQuality = (quality: typeof playerState.quality) => {
    updatePlayerState({ quality });
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (playerState.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full bg-black rounded-xl overflow-hidden group',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playerState.isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        onClick={togglePlay}
      />

      {/* Content Info Overlay */}
      {currentContent && (
        <div
          className={cn(
            'absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-start gap-4">
            {(currentContent.logo || (currentMovie || currentSeries)?.poster) && (
              <img
                src={currentContent.logo || (currentMovie || currentSeries)?.poster || ''}
                alt={currentContent.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {currentContent.name}
              </h2>
              {currentChannel?.number && (
                <p className="text-white/70">Channel {currentChannel.number}</p>
              )}
              {(currentMovie || currentSeries) && (
                <div className="flex items-center gap-2 mt-1">
                  {(currentMovie?.year || currentSeries?.year) && (
                    <span className="text-white/70">{currentMovie?.year || currentSeries?.year}</span>
                  )}
                  {(currentMovie?.ratingImdb || currentSeries?.ratingImdb) && (
                    <span className="text-white/70">⭐ {currentMovie?.ratingImdb || currentSeries?.ratingImdb}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[playerState.currentTime]}
            max={playerState.duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{formatTime(playerState.currentTime)}</span>
            <span>{formatTime(playerState.duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {playerState.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <Slider
                value={[playerState.volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeQuality('auto')}>
                  Auto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeQuality('1080p')}>
                  1080p
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeQuality('720p')}>
                  720p
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeQuality('480p')}>
                  480p
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeQuality('360p')}>
                  360p
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Subtitles className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={togglePiP}
              className="text-white hover:bg-white/20"
            >
              <PictureInPicture className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {playerState.isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
          <ErrorMessage
            title={error.title}
            message={error.message}
            type={error.type}
            details={error.details}
            onDismiss={() => setError(null)}
            className="max-w-md"
          />
        </div>
      )}

      {/* Loading/Buffering Indicator */}
      {!error && isBuffering && effectiveStreamUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Spinner size="xl" label="Loading stream..." />
        </div>
      )}

      {/* No Stream Selected */}
      {!error && !effectiveStreamUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-lg">Select a channel to start watching</p>
          </div>
        </div>
      )}
    </div>
  );
}
