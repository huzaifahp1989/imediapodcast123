import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Youtube, Clock, Eye, RefreshCw, Loader2, ExternalLink } from "lucide-react";

const CHANNEL_ID = "";

export default function YouTubeLatestVideos({ 
  channelId = CHANNEL_ID,
  maxResults = 6,
  onVideoClick 
}) {
  const [videos, setVideos] = useState([]);
  const [channelInfo, setChannelInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [timeoutHit, setTimeoutHit] = useState(false);
  const [usedLocalFallback, setUsedLocalFallback] = useState(false);

  const getApiKey = () => (import.meta.env.VITE_YOUTUBE_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem('youtube_api_key') : '') || "");

  const timeoutFetch = async (url, options = {}, timeoutMs = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(id);
    }
  };

  const loadLocalFallback = async () => {
    try {
      const localVideos = await base44.entities.VideoPodcast.list('-published_date');
      setUsedLocalFallback(true);
      if (!localVideos || localVideos.length === 0) {
        setVideos([]);
        setError('No videos found');
      } else {
        const formatted = localVideos.map(v => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail_url,
          publishedAt: v.published_date,
          duration: v.duration || 0,
          viewCount: v.view_count || 0,
          video_url: v.video_url,
          thumbnail_url: v.thumbnail_url,
          channelTitle: 'Local',
        }));
        setVideos(formatted);
      }
    } catch (e) {
      setVideos([]);
      setError('No content available right now');
    }
  };

  const fetchLatestVideos = async () => {
    setIsLoading(true);
    setError(null);
    setTimeoutHit(false);

    try {
      const apiKey = getApiKey();
      if (!channelId || !apiKey) {
        await loadLocalFallback();
        return;
      }

      const channelResponse = await timeoutFetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${apiKey}`,
        {},
        5000
      );

      if (!channelResponse.ok) {
        const status = channelResponse.status;
        if (status === 429) {
          await loadLocalFallback();
          setError('YouTube throttled');
          return;
        }
        throw new Error("Failed to fetch channel info");
      }

      const channelData = await channelResponse.json();

      if (!channelData.items || channelData.items.length === 0) {
        await loadLocalFallback();
        setError('No content available right now');
        return;
      }

      const channel = channelData.items[0];
      setChannelInfo({
        title: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails.default.url,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
      });

      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

      const videosResponse = await timeoutFetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`
      , {}, 5000);

      if (!videosResponse.ok) {
        if (videosResponse.status === 429) {
          await loadLocalFallback();
          setError('YouTube throttled');
          return;
        }
        throw new Error("Failed to fetch videos");
      }

      const videosData = await videosResponse.json();

      // Get video details (duration, view count)
      const videoIds = videosData.items.map(item => item.contentDetails.videoId).join(',');
      
      const detailsResponse = await timeoutFetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${apiKey}`
      , {}, 5000);

      const detailsData = await detailsResponse.json();
      const detailsMap = {};
      detailsData.items?.forEach(item => {
        detailsMap[item.id] = {
          duration: parseDuration(item.contentDetails.duration),
          viewCount: item.statistics.viewCount,
        };
      });

      const formattedVideos = videosData.items.map(item => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        duration: detailsMap[item.contentDetails.videoId]?.duration || 0,
        viewCount: detailsMap[item.contentDetails.videoId]?.viewCount || 0,
        video_url: `https://www.youtube.com/embed/${item.contentDetails.videoId}`,
        thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      }));

      setVideos(formattedVideos);
      try {
        localStorage.setItem('yt_latest_videos', JSON.stringify(formattedVideos));
        localStorage.setItem('yt_channel_info', JSON.stringify(channelInfo));
      } catch {}
      setLastFetched(new Date());
    } catch (err) {
      console.error("YouTube API error:", err);
      if (err.name === 'AbortError') {
        setTimeoutHit(true);
        await loadLocalFallback();
        setError('No content available right now');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Parse YouTube duration format (PT1H2M3S) to seconds
  const parseDuration = (duration) => {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count) => {
    if (!count || count === 0) return "0 views";
    const num = parseInt(count);
    if (num < 1000) return `${num} views`;
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K views`;
    return `${(num / 1000000).toFixed(1)}M views`;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem('yt_latest_videos');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVideos(parsed);
          setIsLoading(false);
        }
      }
    } catch {}
    fetchLatestVideos();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchLatestVideos, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [channelId, maxResults]);

  const handleVideoClick = (video) => {
    if (onVideoClick) {
      onVideoClick(video);
    } else {
      window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
    }
  };

  if (isLoading && videos.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading latest videos...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && videos.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center">
          {usedLocalFallback ? (
            <>
              <Youtube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">{error === 'No videos found' ? 'No videos found' : 'No content available right now'}</p>
            </>
          ) : (
            <>
              <Youtube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No content available right now</p>
              <Button onClick={fetchLatestVideos} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">
                {channelInfo?.title || "Latest from YouTube"}
              </CardTitle>
              <p className="text-xs text-gray-500">
                Auto-updates • Last updated {lastFetched ? formatTimeAgo(lastFetched.toISOString()) : ''}
              </p>
            </div>
          </div>
          <Button 
            onClick={fetchLatestVideos} 
            variant="ghost" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoClick(video)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-2">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>
                {video.duration > 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                    {formatDuration(video.duration)}
                  </span>
                )}
                <Badge className="absolute top-1 left-1 bg-red-600 text-white text-xs">
                  <Youtube className="w-3 h-3 mr-1" />
                  YouTube
                </Badge>
              </div>
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                {video.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>{formatViewCount(video.viewCount)}</span>
                <span>•</span>
                <span>{formatTimeAgo(video.publishedAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {channelInfo && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href={`https://www.youtube.com/channel/${channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              View Channel on YouTube
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
