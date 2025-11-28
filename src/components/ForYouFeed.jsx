import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Play,
  Music,
  Video,
  Heart,
  Eye,
  Loader2,
  RefreshCw,
  Filter,
  Brain,
  Target,
  Zap,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";

const categories = [
  "All",
  "Quran",
  "Hadith",
  "Lectures",
  "Nasheeds",
  "Tafsir",
  "Seerah",
  "Fiqh",
  "Spirituality",
];

export default function ForYouFeed({ onVideoClick, onAudioClick }) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("foryou");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [contentType, setContentType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch watch history for deeper analysis
  const { data: watchHistory = [] } = useQuery({
    queryKey: ['watchProgress-feed', user?.email],
    queryFn: () => user ? base44.entities.WatchProgress.filter({ user_email: user.email }, '-last_watched') : [],
    enabled: !!user,
  });

  // Fetch stored user preferences
  const { data: storedPreferences } = useQuery({
    queryKey: ['userPreferences-feed', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const prefs = await base44.entities.UserPreference.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  // Fetch user's favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['user-favorites', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  // Fetch user's ratings
  const { data: ratings = [] } = useQuery({
    queryKey: ['user-ratings', user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  // Fetch all approved videos
  const { data: videos = [], refetch: refetchVideos } = useQuery({
    queryKey: ['all-videos-feed'],
    queryFn: () => base44.entities.VideoPodcast.filter({ status: 'approved' }, '-published_date'),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch all approved audio
  const { data: audios = [], refetch: refetchAudios } = useQuery({
    queryKey: ['all-audio-feed'],
    queryFn: () => base44.entities.AudioContent.filter({ status: 'approved' }, '-published_date'),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch user's playlists for activity analysis
  const { data: playlists = [] } = useQuery({
    queryKey: ['user-playlists-feed', user?.email],
    queryFn: () => user ? base44.entities.Playlist.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: videoPlaylists = [] } = useQuery({
    queryKey: ['user-video-playlists-feed', user?.email],
    queryFn: () => user ? base44.entities.VideoPlaylist.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  // Advanced preference learning with multiple signals
  const getUserPreferences = useCallback(() => {
    const categoryScores = {};
    const speakerScores = {};
    const tagScores = {};
    const recentInterests = [];
    const contentTypePrefs = { video: 0, audio: 0 };

    const now = Date.now();

    // Analyze watch history with time decay and completion rate
    watchHistory.forEach(item => {
      const daysSinceWatch = item.last_watched 
        ? (now - new Date(item.last_watched).getTime()) / (1000 * 60 * 60 * 24)
        : 30;
      const timeDecay = Math.max(0.2, 1 - (daysSinceWatch / 45));
      const completionBonus = item.completed ? 2 : (item.progress_percentage > 70 ? 1.5 : item.progress_percentage > 30 ? 1.2 : 0.8);
      const weight = timeDecay * completionBonus;

      if (item.content_category) {
        categoryScores[item.content_category] = (categoryScores[item.content_category] || 0) + weight * 3;
        if (daysSinceWatch < 5) recentInterests.push(item.content_category);
      }
      if (item.content_speaker) {
        speakerScores[item.content_speaker] = (speakerScores[item.content_speaker] || 0) + weight * 4;
      }
      contentTypePrefs[item.content_type] = (contentTypePrefs[item.content_type] || 0) + weight;
    });

    // Analyze favorites (explicit positive signal)
    favorites.forEach(fav => {
      if (fav.content_category) {
        categoryScores[fav.content_category] = (categoryScores[fav.content_category] || 0) + 5;
      }
      contentTypePrefs[fav.content_type] = (contentTypePrefs[fav.content_type] || 0) + 2;
    });

    // Analyze ratings with sentiment
    ratings.forEach(r => {
      const content = [...videos, ...audios].find(c => c.id === r.content_id);
      const sentiment = r.rating >= 4 ? 2 : r.rating <= 2 ? -1 : 0.5;
      
      if (content?.category) {
        categoryScores[content.category] = (categoryScores[content.category] || 0) + sentiment * 3;
      }
      if (content?.speaker) {
        speakerScores[content.speaker] = (speakerScores[content.speaker] || 0) + sentiment * 4;
      }
      if (content?.tags) {
        content.tags.forEach(tag => {
          tagScores[tag.toLowerCase()] = (tagScores[tag.toLowerCase()] || 0) + sentiment * 2;
        });
      }
    });

    // Analyze playlist content
    const playlistVideoIds = videoPlaylists.flatMap(p => p.video_ids || []);
    const playlistAudioIds = playlists.flatMap(p => p.audio_ids || []);

    videos.filter(v => playlistVideoIds.includes(v.id)).forEach(v => {
      if (v.category) categoryScores[v.category] = (categoryScores[v.category] || 0) + 2;
      if (v.speaker) speakerScores[v.speaker] = (speakerScores[v.speaker] || 0) + 2;
    });

    audios.filter(a => playlistAudioIds.includes(a.id)).forEach(a => {
      if (a.category) categoryScores[a.category] = (categoryScores[a.category] || 0) + 2;
      if (a.speaker) speakerScores[a.speaker] = (speakerScores[a.speaker] || 0) + 2;
    });

    // Search history keywords
    if (storedPreferences?.search_history) {
      storedPreferences.search_history.slice(0, 15).forEach((search, idx) => {
        const weight = Math.max(0.3, 1 - (idx * 0.06));
        const terms = search.term.toLowerCase().split(/\s+/);
        terms.forEach(term => {
          if (term.length > 2) {
            tagScores[term] = (tagScores[term] || 0) + weight * 2;
          }
        });
      });
    }

    return { categoryScores, speakerScores, tagScores, recentInterests, contentTypePrefs };
  }, [watchHistory, favorites, ratings, videos, audios, playlists, videoPlaylists, storedPreferences]);

  // Advanced content scoring with ML-inspired features
  const scoreContent = useCallback((content, preferences) => {
    let score = 0;
    let matchReasons = [];
    const { categoryScores, speakerScores, tagScores, recentInterests, contentTypePrefs } = preferences;

    // Category match (primary signal)
    if (content.category && categoryScores[content.category]) {
      const catScore = categoryScores[content.category] * 12;
      score += catScore;
      if (catScore > 15) matchReasons.push('category');
    }

    // Recent interest boost
    if (recentInterests.includes(content.category)) {
      score += 10;
      matchReasons.push('recent');
    }

    // Speaker match (strong signal for loyalty)
    if (content.speaker && speakerScores[content.speaker]) {
      const speakerScore = speakerScores[content.speaker] * 15;
      score += speakerScore;
      if (speakerScore > 12) matchReasons.push('speaker');
    }

    // Tag/keyword matching
    if (content.tags && content.tags.length > 0) {
      let tagScore = 0;
      content.tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tagScores[tagLower]) {
          tagScore += tagScores[tagLower] * 3;
        }
      });
      if (tagScore > 0) {
        score += tagScore;
        matchReasons.push('interests');
      }
    }

    // Title keyword matching with search terms
    const titleLower = (content.title || '').toLowerCase();
    Object.keys(tagScores).forEach(term => {
      if (titleLower.includes(term)) {
        score += tagScores[term] * 2;
      }
    });

    // Content type preference
    if (contentTypePrefs[content.type] > 0) {
      score += contentTypePrefs[content.type] * 5;
    }

    // Popularity with log scale
    const views = content.view_count || content.play_count || 0;
    score += Math.log10(views + 1) * 3;

    // Recency with gradual decay
    if (content.published_date) {
      const daysSincePublish = (Date.now() - new Date(content.published_date)) / (1000 * 60 * 60 * 24);
      if (daysSincePublish < 2) score += 8;
      else if (daysSincePublish < 7) score += 6;
      else if (daysSincePublish < 14) score += 4;
      else if (daysSincePublish < 30) score += 2;
    }

    // Featured boost
    if (content.featured) score += 5;

    // Diversity (random for discovery)
    score += Math.random() * 4;

    return { score, matchReasons, isAIPick: matchReasons.length >= 2 || score > 35 };
  }, []);

  // Get recommended content with memoization
  const getRecommendedContent = useMemo(() => {
    const preferences = getUserPreferences();
    
    let allContent = [];
    
    if (contentType === "all" || contentType === "video") {
      allContent = [...allContent, ...videos.map(v => ({ ...v, type: "video" }))];
    }
    if (contentType === "all" || contentType === "audio") {
      allContent = [...allContent, ...audios.map(a => ({ ...a, type: "audio" }))];
    }

    // Filter by category
    if (selectedCategory !== "All") {
      allContent = allContent.filter(c => c.category === selectedCategory);
    }

    // Exclude already watched content (optional - can show with "continue" badge)
    const watchedIds = new Set(watchHistory.map(w => w.content_id));

    // Score and sort based on tab
    if (activeTab === "foryou") {
      if (user) {
        // AI recommendations for logged-in users
        allContent = allContent
          .map(c => {
            const { score, matchReasons, isAIPick } = scoreContent(c, preferences);
            return { 
              ...c, 
              score, 
              matchReasons, 
              isAIPick,
              isWatched: watchedIds.has(c.id)
            };
          })
          .sort((a, b) => {
            // Prioritize unwatched content but don't exclude watched
            if (a.isWatched !== b.isWatched) return a.isWatched ? 1 : -1;
            return b.score - a.score;
          });
      } else {
        // For non-logged-in users, show popular + recent content
        allContent = allContent.sort((a, b) => {
          const aViews = a.view_count || a.play_count || 0;
          const bViews = b.view_count || b.play_count || 0;
          const aDate = new Date(a.published_date || a.created_date || 0).getTime();
          const bDate = new Date(b.published_date || b.created_date || 0).getTime();
          return (bViews + bDate / 1000000000) - (aViews + aDate / 1000000000);
        });
      }
    } else if (activeTab === "trending") {
      // Trending with recency factor
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      allContent = allContent.map(c => {
        const views = c.view_count || c.play_count || 0;
        const publishDate = new Date(c.published_date || c.created_date).getTime();
        const recencyBoost = publishDate > oneWeekAgo ? 1.5 : 1;
        return { ...c, trendScore: views * recencyBoost };
      }).sort((a, b) => b.trendScore - a.trendScore);
    } else if (activeTab === "new") {
      // Sort by date
      allContent = allContent.sort((a, b) => {
        return new Date(b.published_date || b.created_date) - new Date(a.published_date || a.created_date);
      });
    }

    return allContent.slice(0, 20);
  }, [videos, audios, contentType, selectedCategory, activeTab, user, getUserPreferences, scoreContent, watchHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchVideos(), refetchAudios()]);
    setIsRefreshing(false);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return `${count}`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const recommendedContent = getRecommendedContent;
  
  // Calculate personalization strength
  const personalizationStrength = useMemo(() => {
    const signals = (watchHistory.length > 0 ? 1 : 0) + 
                   (favorites.length > 0 ? 1 : 0) + 
                   (ratings.length > 0 ? 1 : 0) +
                   (storedPreferences?.search_history?.length > 0 ? 1 : 0);
    return signals;
  }, [watchHistory.length, favorites.length, ratings.length, storedPreferences]);

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader className="pb-2 md:pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="hidden sm:inline">Discover For You</span>
              <span className="sm:hidden">For You</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-600"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Personalization indicator */}
          {user && activeTab === "foryou" && (
            <div className="flex items-center gap-2 text-xs">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-gray-600">
                Personalization: 
                <span className={`ml-1 font-medium ${
                  personalizationStrength >= 3 ? 'text-green-600' : 
                  personalizationStrength >= 2 ? 'text-yellow-600' : 'text-gray-400'
                }`}>
                  {personalizationStrength >= 3 ? 'Strong' : personalizationStrength >= 2 ? 'Good' : personalizationStrength >= 1 ? 'Basic' : 'None'}
                </span>
              </span>
              {personalizationStrength < 3 && (
                <span className="text-gray-400">
                  • {4 - personalizationStrength} more signals needed
                </span>
              )}
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 bg-gray-100 h-9">
              <TabsTrigger value="foryou" className="text-xs md:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <Brain className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">For You</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="text-xs md:text-sm data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="new" className="text-xs md:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                New
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-[100px] md:w-[120px] h-8 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[100px] md:w-[130px] h-8 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {recommendedContent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {recommendedContent.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (item.type === "video" && onVideoClick) {
                    onVideoClick(item);
                  } else if (item.type === "audio" && onAudioClick) {
                    onAudioClick(item);
                  }
                }}
                className="group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-2">
                  {(item.thumbnail_url || item.cover_image_url) ? (
                    <img
                      src={item.thumbnail_url || item.cover_image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      item.type === "video" 
                        ? "bg-gradient-to-br from-red-500 to-pink-500" 
                        : "bg-gradient-to-br from-green-500 to-emerald-500"
                    }`}>
                      {item.type === "video" ? (
                        <Video className="w-8 h-8 text-white/50" />
                      ) : (
                        <Music className="w-8 h-8 text-white/50" />
                      )}
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className={`w-10 h-10 md:w-12 md:h-12 ${
                      item.type === "video" ? "bg-red-600" : "bg-green-600"
                    } rounded-full flex items-center justify-center`}>
                      <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Duration */}
                  {item.duration > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] md:text-xs px-1 py-0.5 rounded">
                      {formatDuration(item.duration)}
                    </span>
                  )}

                  {/* Type badge */}
                  <Badge className={`absolute top-1 left-1 text-[10px] ${
                    item.type === "video" ? "bg-red-600" : "bg-green-600"
                  } text-white`}>
                    {item.type === "video" ? <Video className="w-2.5 h-2.5 mr-0.5" /> : <Music className="w-2.5 h-2.5 mr-0.5" />}
                    {item.type}
                  </Badge>

                  {/* AI recommended badge for foryou tab */}
                  {activeTab === "foryou" && item.isAIPick && (
                    <Badge className="absolute top-1 right-1 bg-purple-600 text-white text-[10px]">
                      <Target className="w-2.5 h-2.5 mr-0.5" />
                      For You
                    </Badge>
                  )}
                  
                  {/* Match reason badge */}
                  {activeTab === "foryou" && item.matchReasons?.length > 0 && (
                    <Badge className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px]">
                      {item.matchReasons[0] === 'speaker' && '👤 Speaker match'}
                      {item.matchReasons[0] === 'category' && '📂 Category match'}
                      {item.matchReasons[0] === 'recent' && '🔥 Recent interest'}
                      {item.matchReasons[0] === 'interests' && '✨ Your interests'}
                    </Badge>
                  )}
                </div>

                {/* Info */}
                <div className="flex gap-2">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    item.type === "video" 
                      ? "bg-gradient-to-br from-red-500 to-pink-500" 
                      : "bg-gradient-to-br from-green-500 to-emerald-500"
                  }`}>
                    {item.type === "video" ? (
                      <Video className="w-4 h-4 text-white" />
                    ) : (
                      <Music className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] md:text-xs text-gray-600 truncate">
                      {item.speaker || item.category}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span>{formatViewCount(item.view_count || item.play_count)}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(item.published_date)}</span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                    <FavoriteButton
                      contentId={item.id}
                      contentType={item.type}
                      contentTitle={item.title}
                      contentThumbnail={item.thumbnail_url || item.cover_image_url}
                      contentCategory={item.category}
                      size="icon"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 && audios.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto mb-3 text-purple-400 animate-spin" />
            <p className="text-gray-600 text-sm">Loading content...</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 text-sm">No content found</p>
            <p className="text-gray-500 text-xs mt-1">Try changing filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}