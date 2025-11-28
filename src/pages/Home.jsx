import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, Clock, Video, Upload, Download, ListPlus, ListVideo, Search, Music, X } from "lucide-react";
import { Input } from "@/components/ui/input";
 
import FavoriteButton from "@/components/FavoriteButton";
import VideoPlayer from "@/components/video/VideoPlayer";
import CommentsWidget from "@/components/CommentsWidget";
import RatingWidget from "@/components/RatingWidget";
import YouTubeLatestVideos from "@/components/YouTubeLatestVideos";
import ForYouFeed from "@/components/ForYouFeed";
import RecommendationEngine from "@/components/RecommendationEngine";
import ContinueWatching, { useSaveWatchProgress } from "@/components/ContinueWatching";
import AdvancedFilters, { applyFilters } from "@/components/AdvancedFilters";
import PlaybackQueueManager, { usePlaybackQueue } from "@/components/PlaybackQueueManager";

export default function Home() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [user, setUser] = useState(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [filters, setFilters] = useState({
    contentType: "all",
    category: "All",
    speaker: "all",
    duration: "any",
    dateRange: "any",
    language: "All Languages",
    sortBy: "-published_date",
    searchTerm: "",
  });
  const videoRef = useRef(null);
  const { saveProgress } = useSaveWatchProgress();
  const { addToQueue, playNext } = usePlaybackQueue();
  const queryClient = useQueryClient();

  // Fetch stored user preferences for search history
  const { data: storedPreferences } = useQuery({
    queryKey: ['userPreferences', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const prefs = await base44.entities.UserPreference.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  // Save search history mutation
  const saveSearchMutation = useMutation({
    mutationFn: async (searchTerm) => {
      if (!user || !searchTerm.trim()) return;
      
      const newSearch = { term: searchTerm.trim(), timestamp: new Date().toISOString() };
      const existingHistory = storedPreferences?.search_history || [];
      const updatedHistory = [newSearch, ...existingHistory.filter(s => s.term !== searchTerm.trim())].slice(0, 50);
      
      if (storedPreferences) {
        await base44.entities.UserPreference.update(storedPreferences.id, {
          search_history: updatedHistory,
          last_updated: new Date().toISOString()
        });
      } else {
        await base44.entities.UserPreference.create({
          user_email: user.email,
          search_history: updatedHistory,
          category_scores: {},
          speaker_scores: {},
          tag_scores: {},
          content_type_preference: { video: 0, audio: 0 },
          last_updated: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    }
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const [homeSearchTerm, setHomeSearchTerm] = useState("");

  const { data: videos = [], isLoading, isError } = useQuery({
    queryKey: ['videoPodcasts'],
    queryFn: async () => {
      const res = await base44.entities.VideoPodcast.filter({ status: 'approved' }, '-published_date');
      return res;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - don't refetch if data is fresh
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    initialData: (() => { try { const c = localStorage.getItem('cache_videoPodcasts'); return c ? JSON.parse(c) : undefined; } catch { return undefined; } })(),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    onSuccess: (res) => {
      try {
        const prevStr = localStorage.getItem('cache_videoPodcasts');
        const prev = prevStr ? JSON.parse(prevStr) : [];
        const prevIds = Array.isArray(prev) ? prev.map(v => v.id).join('|') : '';
        const nextIds = Array.isArray(res) ? res.map(v => v.id).join('|') : '';
        if (prevIds !== nextIds) {
          localStorage.setItem('cache_videoPodcasts', JSON.stringify(res));
        }
      } catch {}
    }
  });

  const { data: audioContent = [] } = useQuery({
    queryKey: ['audioContent'],
    queryFn: async () => {
      const res = await base44.entities.AudioContent.filter({ status: 'approved' }, '-published_date');
      try { localStorage.setItem('cache_audioContent', JSON.stringify(res)); } catch {}
      return res;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    initialData: (() => { try { const c = localStorage.getItem('cache_audioContent'); return c ? JSON.parse(c) : undefined; } catch { return undefined; } })()
  });

  const [loadingTimeoutReached, setLoadingTimeoutReached] = useState(false);
  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => setLoadingTimeoutReached(true), 5000);
    } else {
      setLoadingTimeoutReached(false);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isLoading]);

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
    if (count < 1000) return `${count} views`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K views`;
    return `${(count / 1000000).toFixed(1)}M views`;
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

  const featuredVideo = videos.length > 0 ? videos[0] : null;
  const recentVideos = videos.slice(1);

  // Get unique speakers and categories for filters
  const uniqueSpeakers = [...new Set(videos.map(v => v.speaker).filter(Boolean))];
  const uniqueCategories = [...new Set(videos.map(v => v.category).filter(Boolean))];

  // Apply filters to videos
  const filteredVideos = applyFilters(
    videos.map(v => ({ ...v, type: "video" })),
    filters
  );

  // Search results for home page search
  const searchResults = homeSearchTerm.trim() ? (() => {
    const term = homeSearchTerm.toLowerCase();
    const matchingVideos = videos.filter(v => 
      (v.title || "").toLowerCase().includes(term) ||
      (v.speaker || "").toLowerCase().includes(term) ||
      (v.category || "").toLowerCase().includes(term) ||
      (v.description || "").toLowerCase().includes(term)
    ).map(v => ({ ...v, type: "video" }));
    
    const matchingAudio = audioContent.filter(a => 
      (a.title || "").toLowerCase().includes(term) ||
      (a.speaker || "").toLowerCase().includes(term) ||
      (a.category || "").toLowerCase().includes(term) ||
      (a.description || "").toLowerCase().includes(term)
    ).map(a => ({ ...a, type: "audio" }));
    
    return [...matchingVideos, ...matchingAudio];
  })() : [];

  // Handle video progress saving
  const handleTimeUpdate = (video, currentTime, duration) => {
    if (user && video && duration > 0) {
      saveProgress(user, video, currentTime, duration, "video");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Continue Watching Section */}
              <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                <ContinueWatching
                  onVideoClick={(video) => {
                    setSelectedVideo(video);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onAudioClick={(audio) => {
                    window.location.href = `/Audio?play=${audio.id}`;
                  }}
                />
              </div>

              {/* Search Bar */}
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={homeSearchTerm}
                    onChange={(e) => {
                      setHomeSearchTerm(e.target.value);
                      // Debounced save to search history
                      if (e.target.value.trim().length >= 3) {
                        clearTimeout(window.searchSaveTimeout);
                        window.searchSaveTimeout = setTimeout(() => {
                          saveSearchMutation.mutate(e.target.value);
                        }, 2000);
                      }
                    }}
                    placeholder="Search videos and audio..."
                    className="pl-12 pr-10 h-12 rounded-full bg-white border-gray-200 shadow-sm text-gray-900 placeholder:text-gray-400"
                  />
                  {homeSearchTerm && (
                    <button
                      onClick={() => setHomeSearchTerm("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Category Tabs */}
                <div className="flex justify-center gap-3 mt-4 flex-wrap">
                  {["Quran", "Nasheeds", "Talks", "Kids Nasheeds", "Kids Stories"].map((cat) => (
                    <Button
                      key={cat}
                      variant={homeSearchTerm === cat ? "default" : "outline"}
                      onClick={() => setHomeSearchTerm(homeSearchTerm === cat ? "" : cat)}
                      className={homeSearchTerm === cat 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                {/* Search Results */}
                {homeSearchTerm.trim() && (
                  <div className="mt-4 max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Search Results ({searchResults.length})
                    </h3>
                    {searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {searchResults.slice(0, 12).map((item) => (
                          <Card
                            key={`${item.type}-${item.id}`}
                            className="bg-white border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => {
                              if (item.type === "video") {
                                setSelectedVideo(item);
                                setHomeSearchTerm("");
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              } else {
                                window.location.href = createPageUrl("Audio") + `?play=${item.id}`;
                              }
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="flex gap-3">
                                <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                  {item.thumbnail_url || item.cover_image_url ? (
                                    <img
                                      src={item.thumbnail_url || item.cover_image_url}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${item.type === "video" ? "bg-gradient-to-br from-red-500 to-pink-500" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}>
                                      {item.type === "video" ? (
                                        <Video className="w-6 h-6 text-white/70" />
                                      ) : (
                                        <Music className="w-6 h-6 text-white/70" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{item.speaker || item.category}</p>
                                  <Badge variant="outline" className={`mt-1 text-[10px] ${item.type === "video" ? "border-red-300 text-red-600" : "border-purple-300 text-purple-600"}`}>
                                    {item.type === "video" ? "Video" : "Audio"}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No results found for "{homeSearchTerm}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* Featured Video Section */}
              {featuredVideo && (
                <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
                  <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
              {/* Main Video Player */}
              <div className="lg:col-span-3">
                <div className="aspect-video bg-black rounded-lg md:rounded-xl overflow-hidden shadow-2xl">
                  {(selectedVideo || featuredVideo) && (
                    <VideoPlayer 
                      video={selectedVideo || featuredVideo} 
                      autoPlay={false} 
                    />
                  )}
                </div>
                
                {/* Video Info */}
                <div className="mt-3 md:mt-4 px-1">
                  <h1 className="text-base sm:text-lg md:text-2xl font-bold line-clamp-2">
                    {(selectedVideo || featuredVideo)?.title}
                  </h1>
                  <div className="flex items-center gap-2 md:gap-4 mt-1 md:mt-2 text-gray-300 text-xs md:text-sm">
                    <span>{formatViewCount((selectedVideo || featuredVideo)?.view_count)}</span>
                    <span>•</span>
                    <span>{formatTimeAgo((selectedVideo || featuredVideo)?.published_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 flex-wrap">
                    <FavoriteButton
                      contentId={(selectedVideo || featuredVideo)?.id}
                      contentType="video"
                      contentTitle={(selectedVideo || featuredVideo)?.title}
                      contentThumbnail={(selectedVideo || featuredVideo)?.thumbnail_url}
                      contentCategory={(selectedVideo || featuredVideo)?.category}
                      showCount={true}
                    />
                    <RatingWidget
                      contentId={(selectedVideo || featuredVideo)?.id}
                      contentType="video"
                      contentTitle={(selectedVideo || featuredVideo)?.title}
                    />
                    {(selectedVideo || featuredVideo)?.category && (
                      <Badge className="bg-red-600 text-white">
                        {(selectedVideo || featuredVideo)?.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Up Next Sidebar */}
              <div className="lg:col-span-2">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-300">Up Next</h3>
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[500px] pb-2 lg:pb-0 lg:pr-2 scrollbar-hide">
                  {videos.slice(0, 8).map((video) => (
                    <div
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className={`flex flex-col lg:flex-row gap-2 lg:gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-white/10 flex-shrink-0 w-36 sm:w-44 lg:w-auto ${
                        (selectedVideo?.id || featuredVideo?.id) === video.id ? 'bg-white/10 lg:border-l-4 border-red-500' : ''
                      }`}
                    >
                      <div className="relative w-full lg:w-40 flex-shrink-0">
                        <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-500">
                              <Video className="w-6 h-6 text-white/50" />
                            </div>
                          )}
                        </div>
                        {video.duration > 0 && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs lg:text-sm font-medium line-clamp-2 text-white">
                          {video.title}
                        </h4>
                        <p className="text-[10px] lg:text-xs text-gray-400 mt-0.5 lg:mt-1 hidden lg:block">{video.speaker || video.category}</p>
                        <p className="text-[10px] lg:text-xs text-gray-500 mt-0.5 lg:mt-1">
                          {formatViewCount(video.view_count)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-4 md:mt-6 lg:col-span-5">
                <CommentsWidget
                  contentId={(selectedVideo || featuredVideo)?.id}
                  contentType="video"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <RecommendationEngine 
          onVideoClick={(video) => {
            setSelectedVideo(video);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAudioClick={(audio) => {
            window.location.href = `/Audio?play=${audio.id}`;
          }}
          maxItems={8}
          title="Recommended for You"
        />
      </div>

      {/* For You Feed */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <ForYouFeed 
          onVideoClick={(video) => {
            setSelectedVideo(video);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAudioClick={(audio) => {
            window.location.href = `/Audio?play=${audio.id}`;
          }}
        />
      </div>

      {/* YouTube Latest Videos Section */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <YouTubeLatestVideos 
          channelId="CHANNEL_ID_HERE" 
          maxResults={6}
          onVideoClick={(video) => {
            setSelectedVideo({
              ...video,
              title: video.title,
              video_url: video.video_url,
              thumbnail_url: video.thumbnail_url,
              view_count: parseInt(video.viewCount) || 0,
              published_date: video.publishedAt,
              category: "YouTube",
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* Videos Grid */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 md:py-8">
        <div className="flex flex-col gap-4 mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">All Videos</h2>
            <div className="flex items-center gap-2">
              <PlaybackQueueManager
                isOpen={isQueueOpen}
                onOpenChange={setIsQueueOpen}
                currentItem={selectedVideo}
                isPlaying={false}
                onItemClick={(item) => {
                  setSelectedVideo(item);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              <Link to={createPageUrl("VideoPodcast")}>
                <Button className="bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm px-2 md:px-4 h-8 md:h-10">
                  <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Upload</span> Video
                </Button>
              </Link>
            </div>
          </div>

          {/* Advanced Filters */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            speakers={uniqueSpeakers}
            categories={uniqueCategories}
            showContentType={false}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading videos...</p>
            {loadingTimeoutReached && (
              <p className="text-gray-500 mt-2">No content available right now</p>
            )}
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                className="bg-white border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer overflow-hidden"
                onClick={() => {
                  setSelectedVideo(video);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-200">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-500">
                        <Video className="w-8 h-8 md:w-12 md:h-12 text-white/50" />
                      </div>
                    )}
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-red-600 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 md:w-6 md:h-6 text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    {video.duration > 0 && (
                      <span className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-black/80 text-white text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded font-medium">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-2 md:p-3">
                    <div className="flex gap-2 md:gap-3">
                      {/* Channel Avatar - Hidden on mobile */}
                      <div className="hidden sm:flex w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-red-500 to-pink-500 items-center justify-center flex-shrink-0">
                        <Video className="w-3 h-3 md:w-4 md:h-4 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 line-clamp-2 text-xs md:text-sm leading-tight">
                          {video.title}
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-600 mt-0.5 md:mt-1 line-clamp-1">
                          {video.speaker || video.category}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500 mt-0.5">
                          <span>{formatViewCount(video.view_count)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{formatTimeAgo(video.published_date)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                          <div onClick={(e) => e.stopPropagation()} className="hidden sm:flex items-center gap-1">
                            <FavoriteButton
                              contentId={video.id}
                              contentType="video"
                              contentTitle={video.title}
                              contentThumbnail={video.thumbnail_url}
                              contentCategory={video.category}
                              size="icon"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToQueue(video, "video");
                              }}
                              className="h-8 w-8 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Add to Queue"
                            >
                              <ListPlus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      </CardContent>
                      </Card>
                      ))}
                      </div>
                      ) : (
                        <Card className="bg-white border-gray-200">
                          <CardContent className="p-6 md:p-12 text-center">
                            <Video className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-300" />
                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                              {videos.length > 0 ? "No videos match your filters" : "No videos found"}
                            </h3>
                            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                              {videos.length > 0 ? "Try adjusting your filter settings" : "No content available right now"}
                            </p>
                            {false && videos.length === 0 && (
                              <Link to={createPageUrl("VideoPodcast")}>
                                <Button className="bg-red-600 hover:bg-red-700 text-white text-sm md:text-base">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Video
                                </Button>
                              </Link>
                            )}
                          </CardContent>
                        </Card>
                      )}
      </div>
    </div>
  );
}
