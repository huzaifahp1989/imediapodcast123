import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Settings, Download, Wifi, WifiOff, Check, Loader2, Gauge, PictureInPicture2, Clock, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

const QUALITY_OPTIONS = [
  { label: "Auto", value: "auto", description: "Adjusts based on connection" },
  { label: "1080p", value: "1080", description: "Full HD" },
  { label: "720p", value: "720", description: "HD" },
  { label: "480p", value: "480", description: "Standard" },
  { label: "360p", value: "360", description: "Low" },
  { label: "240p", value: "240", description: "Very Low" },
];

const PLAYBACK_SPEEDS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "1.75x", value: 1.75 },
  { label: "2x", value: 2 },
];

export default function VideoPlayer({ video, autoPlay = false }) {
  const videoRef = useRef(null);
  const [quality, setQuality] = useState("auto");
  const [connectionSpeed, setConnectionSpeed] = useState("good");
  const [isDownloading, setIsDownloading] = useState(false);
  const [effectiveQuality, setEffectiveQuality] = useState("720");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();
  const isYouTube = video?.video_url?.includes('youtube.com/embed');

  // Load user
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Check PiP support
  useEffect(() => {
    setIsPiPSupported(
      document.pictureInPictureEnabled && 
      !isYouTube && 
      videoRef.current?.requestPictureInPicture
    );
  }, [isYouTube, video]);

  // Fetch watch later list
  const { data: watchLaterList = [] } = useQuery({
    queryKey: ['watchLater', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ 
      user_email: user.email, 
      content_type: 'watch_later' 
    }) : [],
    enabled: !!user,
  });

  const isInWatchLater = watchLaterList.some(item => item.content_id === video?.id);

  // Add to watch later mutation
  const addToWatchLaterMutation = useMutation({
    mutationFn: () => base44.entities.Favorite.create({
      user_email: user.email,
      content_id: video.id,
      content_type: 'watch_later',
      content_title: video.title,
      content_thumbnail: video.thumbnail_url,
      content_category: video.category,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchLater'] });
      toast.success("Added to Watch Later");
    },
    onError: () => toast.error("Failed to add to Watch Later"),
  });

  // Remove from watch later mutation
  const removeFromWatchLaterMutation = useMutation({
    mutationFn: async () => {
      const item = watchLaterList.find(i => i.content_id === video.id);
      if (item) await base44.entities.Favorite.delete(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchLater'] });
      toast.success("Removed from Watch Later");
    },
    onError: () => toast.error("Failed to remove from Watch Later"),
  });

  const toggleWatchLater = () => {
    if (!user) {
      toast.error("Watch Later is unavailable.");
      return;
    }
    if (isInWatchLater) {
      removeFromWatchLaterMutation.mutate();
    } else {
      addToWatchLaterMutation.mutate();
    }
  };

  // Monitor network conditions for adaptive bitrate
  useEffect(() => {
    const updateConnectionSpeed = () => {
      if (navigator.connection) {
        const { effectiveType, downlink } = navigator.connection;
        
        if (effectiveType === '4g' && downlink > 5) {
          setConnectionSpeed("excellent");
          if (quality === "auto") setEffectiveQuality("1080");
        } else if (effectiveType === '4g' || downlink > 2) {
          setConnectionSpeed("good");
          if (quality === "auto") setEffectiveQuality("720");
        } else if (effectiveType === '3g' || downlink > 0.5) {
          setConnectionSpeed("fair");
          if (quality === "auto") setEffectiveQuality("480");
        } else {
          setConnectionSpeed("poor");
          if (quality === "auto") setEffectiveQuality("360");
        }
      }
    };

    updateConnectionSpeed();

    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateConnectionSpeed);
      return () => navigator.connection.removeEventListener('change', updateConnectionSpeed);
    }
  }, [quality]);

  // Update effective quality when manual quality is selected
  useEffect(() => {
    if (quality !== "auto") {
      setEffectiveQuality(quality);
    }
  }, [quality]);

  // Apply playback speed to video element
  useEffect(() => {
    if (videoRef.current && !isYouTube) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, isYouTube]);

  // Handle PiP events
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handlePiPEnter = () => setIsPiPActive(true);
    const handlePiPLeave = () => setIsPiPActive(false);

    videoEl.addEventListener('enterpictureinpicture', handlePiPEnter);
    videoEl.addEventListener('leavepictureinpicture', handlePiPLeave);

    return () => {
      videoEl.removeEventListener('enterpictureinpicture', handlePiPEnter);
      videoEl.removeEventListener('leavepictureinpicture', handlePiPLeave);
    };
  }, [video]);

  const getYouTubeEmbedUrl = () => {
    if (!video?.video_url) return "";
    
    let url = video.video_url;
    const separator = url.includes('?') ? '&' : '?';
    
    // Add quality parameter for YouTube
    const qualityMap = {
      "1080": "hd1080",
      "720": "hd720",
      "480": "large",
      "360": "medium",
      "240": "small",
    };
    
    const vq = qualityMap[effectiveQuality] || "hd720";
    
    return `${url}${separator}autoplay=${autoPlay ? 1 : 0}&vq=${vq}&rel=0&modestbranding=1`;
  };

  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current && !isYouTube) {
      videoRef.current.playbackRate = speed;
    }
    toast.success(`Playback speed: ${speed}x`);
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current || isYouTube) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        toast.info("Exited Picture-in-Picture");
      } else {
        await videoRef.current.requestPictureInPicture();
        toast.success("Entered Picture-in-Picture mode");
      }
    } catch (error) {
      console.error("PiP error:", error);
      toast.error("Picture-in-Picture not available");
    }
  };

  const handleDownload = async () => {
    if (isYouTube) {
      toast.info(
        "YouTube videos cannot be downloaded directly due to copyright restrictions.",
        { duration: 5000 }
      );
      return;
    }

    if (!video?.video_url) {
      toast.error("No video URL available");
      return;
    }

    setIsDownloading(true);
    toast.info("Starting download...");

    try {
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${video.title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download video. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionSpeed) {
      case "excellent":
      case "good":
        return <Wifi className="w-4 h-4 text-green-500" />;
      case "fair":
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case "poor":
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!video) return null;

  return (
    <div className="relative w-full h-full group">
      {/* Video Player */}
      {isYouTube ? (
        <iframe
          key={effectiveQuality}
          src={getYouTubeEmbedUrl()}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={video.title}
        />
      ) : (
        <video
          ref={videoRef}
          src={video.video_url}
          controls
          autoPlay={autoPlay}
          className="w-full h-full"
        />
      )}

      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Connection Status */}
        <div className="bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1.5">
          {getConnectionIcon()}
          <span className="text-white text-xs">
            {quality === "auto" ? `Auto (${effectiveQuality}p)` : `${effectiveQuality}p`}
          </span>
        </div>

        {/* Playback Speed Indicator (non-YouTube) */}
        {!isYouTube && playbackSpeed !== 1 && (
          <div className="bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span className="text-white text-xs">{playbackSpeed}x</span>
          </div>
        )}

        {/* Watch Later Button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleWatchLater}
          disabled={addToWatchLaterMutation.isPending || removeFromWatchLaterMutation.isPending}
          className={`bg-black/60 hover:bg-black/80 h-8 w-8 ${
            isInWatchLater ? 'text-yellow-400' : 'text-white'
          }`}
          title={isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
        >
          {isInWatchLater ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
        </Button>

        {/* PiP Button (non-YouTube only) */}
        {isPiPSupported && (
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePictureInPicture}
            className={`bg-black/60 hover:bg-black/80 h-8 w-8 ${
              isPiPActive ? 'text-blue-400' : 'text-white'
            }`}
            title="Picture-in-Picture"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </Button>
        )}

        {/* Settings Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/60 hover:bg-black/80 text-white h-8 w-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 text-white min-w-[200px]">
            {/* Playback Speed (non-YouTube) */}
            {!isYouTube && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="hover:bg-gray-800 cursor-pointer">
                    <Gauge className="w-4 h-4 mr-2" />
                    <span>Playback Speed</span>
                    <span className="ml-auto text-gray-400 text-xs">{playbackSpeed}x</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-gray-900 border-gray-700 text-white">
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <DropdownMenuItem
                        key={speed.value}
                        onClick={() => handlePlaybackSpeedChange(speed.value)}
                        className="hover:bg-gray-800 cursor-pointer flex items-center justify-between"
                      >
                        <span>{speed.label}</span>
                        {playbackSpeed === speed.value && <Check className="w-4 h-4 text-green-500" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator className="bg-gray-700" />
              </>
            )}

            {/* Quality Settings */}
            <DropdownMenuLabel className="text-gray-400 text-xs">Video Quality</DropdownMenuLabel>
            {QUALITY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setQuality(option.value)}
                className="hover:bg-gray-800 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-white">{option.label}</span>
                  <span className="text-gray-500 text-xs ml-2">{option.description}</span>
                </div>
                {quality === option.value && <Check className="w-4 h-4 text-green-500" />}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator className="bg-gray-700" />

            {/* Watch Later */}
            <DropdownMenuItem
              onClick={toggleWatchLater}
              disabled={addToWatchLaterMutation.isPending || removeFromWatchLaterMutation.isPending}
              className="hover:bg-gray-800 cursor-pointer"
            >
              {isInWatchLater ? (
                <>
                  <BookmarkCheck className="w-4 h-4 mr-2 text-yellow-400" />
                  Remove from Watch Later
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Add to Watch Later
                </>
              )}
            </DropdownMenuItem>

            {/* PiP (non-YouTube) */}
            {isPiPSupported && (
              <DropdownMenuItem
                onClick={togglePictureInPicture}
                className="hover:bg-gray-800 cursor-pointer"
              >
                <PictureInPicture2 className="w-4 h-4 mr-2" />
                {isPiPActive ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-gray-700" />
            
            {/* Download */}
            <DropdownMenuItem
              onClick={handleDownload}
              disabled={isDownloading}
              className="hover:bg-gray-800 cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isDownloading ? "Downloading..." : "Download for Offline"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
