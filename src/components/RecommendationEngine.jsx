import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Sparkles, 
  TrendingUp, 
  Play, 
  Music, 
  Video, 
  Clock, 
  Eye, 
  Headphones,
  ChevronRight,
  Loader2,
  RefreshCw,
  Brain,
  Target
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";

export default function RecommendationEngine({ 
  onVideoClick, 
  onAudioClick,
  showTabs = true,
  maxItems = 8,
  title = "Recommended for You"
}) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("recommended");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch stored user preferences
  const { data: storedPreferences } = useQuery({
    queryKey: ['userPreferences', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const prefs = await base44.entities.UserPreference.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  // Fetch user's watch history
  const { data: watchHistory = [] } = useQuery({
    queryKey: ['watchProgress', user?.email],
    queryFn: () => user ? base44.entities.WatchProgress.filter({ user_email: user.email }, '-last_watched') : [],
    enabled: !!user,
  });

  // Fetch user's favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  // Fetch user's ratings
  const { data: ratings = [] } = useQuery({
    queryKey: ['userRatings', user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  // Fetch all videos
  const { data: videos = [] } = useQuery({
    queryKey: ['allVideos'],
    queryFn: () => base44.entities.VideoPodcast.filter({ status: 'approved' }, '-published_date'),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch all audio
  const { data: audioContent = [] } = useQuery({
    queryKey: ['allAudio'],
    queryFn: () => base44.entities.AudioContent.filter({ status: 'approved' }, '-published_date'),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Update stored preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs) => {
      if (!user) return;
      if (storedPreferences) {
        await base44.entities.UserPreference.update(storedPreferences.id, {
          ...newPrefs,
          last_updated: new Date().toISOString()
        });
      } else {
        await base44.entities.UserPreference.create({
          user_email: user.email,
          ...newPrefs,
          last_updated: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    }
  });

  // Analyze user preferences with advanced scoring
  const analyzePreferences = useCallback(() => {
    const preferences = {
      categories: {},
      speakers: {},
      tags: {},
      contentTypes: { video: 0, audio: 0 },
      avgRating: 0,
      totalInteractions: 0,
      recentCategories: [],
      recentSpeakers: [],
      searchTerms: storedPreferences?.search_history || []
    };

    // Analyze watch history with time decay (recent watches weighted more)
    const now = Date.now();
    watchHistory.forEach(item => {
      const daysSinceWatch = item.last_watched 
        ? (now - new Date(item.last_watched).getTime()) / (1000 * 60 * 60 * 24)
        : 30;
      const timeDecay = Math.max(0.2, 1 - (daysSinceWatch / 60)); // Decay over 60 days
      const completionBonus = item.completed ? 1.5 : (item.progress_percentage > 50 ? 1.2 : 1);
      const weight = 2 * timeDecay * completionBonus;

      if (item.content_category) {
        preferences.categories[item.content_category] = (preferences.categories[item.content_category] || 0) + weight;
        if (daysSinceWatch < 7) preferences.recentCategories.push(item.content_category);
      }
      if (item.content_speaker) {
        preferences.speakers[item.content_speaker] = (preferences.speakers[item.content_speaker] || 0) + weight;
        if (daysSinceWatch < 7) preferences.recentSpeakers.push(item.content_speaker);
      }
      preferences.contentTypes[item.content_type] = (preferences.contentTypes[item.content_type] || 0) + weight;
      preferences.totalInteractions++;
    });

    // Analyze favorites (high weight - explicit preference signal)
    favorites.forEach(fav => {
      if (fav.content_category) {
        preferences.categories[fav.content_category] = (preferences.categories[fav.content_category] || 0) + 5;
      }
      preferences.contentTypes[fav.content_type] = (preferences.contentTypes[fav.content_type] || 0) + 3;
      preferences.totalInteractions++;
    });

    // Analyze ratings (highest weight for high ratings, negative for low)
    let totalRating = 0;
    ratings.forEach(rating => {
      const content = [...videos, ...audioContent].find(c => c.id === rating.content_id);
      const weight = rating.rating >= 4 ? (rating.rating - 2) : (rating.rating <= 2 ? -1 : 0);
      
      if (content?.category) {
        preferences.categories[content.category] = (preferences.categories[content.category] || 0) + weight * 3;
      }
      if (content?.speaker) {
        preferences.speakers[content.speaker] = (preferences.speakers[content.speaker] || 0) + weight * 4;
      }
      if (content?.tags) {
        content.tags.forEach(tag => {
          preferences.tags[tag] = (preferences.tags[tag] || 0) + weight * 2;
        });
      }
      totalRating += rating.rating;
      preferences.totalInteractions++;
    });

    preferences.avgRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    // Extract keywords from search history for tag matching
    if (storedPreferences?.search_history) {
      storedPreferences.search_history.slice(0, 20).forEach((search, idx) => {
        const weight = Math.max(0.5, 1 - (idx * 0.05)); // Recent searches weighted more
        const terms = search.term.toLowerCase().split(' ');
        terms.forEach(term => {
          if (term.length > 2) {
            preferences.tags[term] = (preferences.tags[term] || 0) + weight * 2;
          }
        });
      });
    }

    return preferences;
  }, [watchHistory, favorites, ratings, videos, audioContent, storedPreferences]);

  // Generate personalized recommendations with ML-like scoring
  const generateRecommendations = useMemo(() => {
    const preferences = analyzePreferences();
    const allContent = [
      ...videos.map(v => ({ ...v, type: 'video' })),
      ...audioContent.map(a => ({ ...a, type: 'audio' }))
    ];

    // Get IDs of content user has already interacted with
    const watchedIds = new Set(watchHistory.map(w => w.content_id));
    const favoritedIds = new Set(favorites.map(f => f.content_id));
    const ratedIds = new Set(ratings.map(r => r.content_id));
    const interactedIds = new Set([...watchedIds, ...favoritedIds, ...ratedIds]);

    // Score each content item with advanced algorithm
    const scoredContent = allContent
      .filter(item => !interactedIds.has(item.id))
      .map(item => {
        let score = 0;
        let matchReasons = [];

        // Category match (primary signal)
        const category = item.category;
        if (preferences.categories[category]) {
          const categoryScore = preferences.categories[category] * 12;
          score += categoryScore;
          if (categoryScore > 10) matchReasons.push('category');
        }

        // Recent category boost (what user watched this week)
        if (preferences.recentCategories.includes(category)) {
          score += 8;
          matchReasons.push('recent');
        }

        // Speaker match (strong signal)
        const speaker = item.speaker;
        if (speaker && preferences.speakers[speaker]) {
          const speakerScore = preferences.speakers[speaker] * 10;
          score += speakerScore;
          if (speakerScore > 8) matchReasons.push('speaker');
        }

        // Recent speaker boost
        if (speaker && preferences.recentSpeakers.includes(speaker)) {
          score += 10;
        }

        // Tag matching with search history
        if (item.tags && item.tags.length > 0) {
          let tagScore = 0;
          item.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            if (preferences.tags[tagLower]) {
              tagScore += preferences.tags[tagLower] * 3;
            }
          });
          if (tagScore > 0) {
            score += tagScore;
            matchReasons.push('interests');
          }
        }

        // Title/description keyword matching with search history
        const titleLower = (item.title || '').toLowerCase();
        const descLower = (item.description || '').toLowerCase();
        Object.keys(preferences.tags).forEach(term => {
          if (titleLower.includes(term) || descLower.includes(term)) {
            score += preferences.tags[term] * 2;
          }
        });

        // Content type preference
        if (preferences.contentTypes[item.type] > 0) {
          score += preferences.contentTypes[item.type] * 4;
        }

        // Popularity with diminishing returns
        const viewCount = item.view_count || item.play_count || 0;
        score += Math.log10(viewCount + 1) * 3;

        // Recency boost with gradual decay
        if (item.published_date) {
          const daysSincePublished = (Date.now() - new Date(item.published_date).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSincePublished < 3) score += 8;
          else if (daysSincePublished < 7) score += 6;
          else if (daysSincePublished < 14) score += 4;
          else if (daysSincePublished < 30) score += 2;
        }

        // Featured content boost
        if (item.featured) score += 5;

        // Diversity factor (slight randomness for discovery)
        score += Math.random() * 4;

        // Collaborative filtering simulation (similar users liked)
        // Content with high ratings gets boost
        const contentRatings = ratings.filter(r => r.content_id === item.id);
        if (contentRatings.length > 0) {
          const avgRating = contentRatings.reduce((sum, r) => sum + r.rating, 0) / contentRatings.length;
          if (avgRating >= 4) score += 5;
        }

        return { 
          ...item, 
          score, 
          matchReasons,
          isAIPick: matchReasons.length >= 2 || score > 30
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);

    return scoredContent;
  }, [videos, audioContent, watchHistory, favorites, ratings, analyzePreferences, maxItems]);

  // Generate trending content
  const generateTrending = () => {
    const allContent = [
      ...videos.map(v => ({ ...v, type: 'video' })),
      ...audioContent.map(a => ({ ...a, type: 'audio' }))
    ];

    // Calculate trending score based on recent activity
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return allContent
      .map(item => {
        let trendingScore = 0;

        // View/play count weight
        const viewCount = item.view_count || item.play_count || 0;
        trendingScore += viewCount * 2;

        // Recent content boost
        if (item.published_date) {
          const publishDate = new Date(item.published_date).getTime();
          if (publishDate > oneWeekAgo) {
            const recencyFactor = 1 - ((now - publishDate) / (7 * 24 * 60 * 60 * 1000));
            trendingScore *= (1 + recencyFactor);
          }
        }

        // Featured content boost
        if (item.featured) {
          trendingScore *= 1.5;
        }

        return { ...item, trendingScore };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, maxItems);
  };

  const recommendations = generateRecommendations;
  const trending = generateTrending();

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCount = (count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return `${count}`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const ContentCard = ({ item }) => {
    const isVideo = item.type === 'video';
    const viewCount = item.view_count || item.play_count || 0;
    const thumbnail = item.thumbnail_url || item.cover_image_url;

    return (
      <Card 
        className="bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
        onClick={() => isVideo ? onVideoClick?.(item) : onAudioClick?.(item)}
      >
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gray-100">
            {thumbnail ? (
              <img 
                src={thumbnail} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${
                isVideo 
                  ? 'bg-gradient-to-br from-red-500 to-pink-500' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {isVideo ? (
                  <Video className="w-10 h-10 text-white/50" />
                ) : (
                  <Music className="w-10 h-10 text-white/50" />
                )}
              </div>
            )}
            
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isVideo ? 'bg-red-600' : 'bg-purple-600'
              }`}>
                <Play className="w-5 h-5 text-white ml-0.5" />
              </div>
            </div>

            {/* Type badge */}
            <Badge className={`absolute top-2 left-2 ${
              isVideo ? 'bg-red-600' : 'bg-purple-600'
            } text-white text-xs`}>
              {isVideo ? <Video className="w-3 h-3 mr-1" /> : <Music className="w-3 h-3 mr-1" />}
              {isVideo ? 'Video' : 'Audio'}
            </Badge>

            {/* Duration */}
            {item.duration > 0 && (
              <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                {formatDuration(item.duration)}
              </Badge>
            )}
          </div>

          <div className="p-3">
            <h4 className="font-medium text-gray-900 line-clamp-2 text-sm group-hover:text-blue-700 transition-colors">
              {item.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
              {item.speaker || item.category}
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {isVideo ? (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatCount(viewCount)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Headphones className="w-3 h-3" />
                    {formatCount(viewCount)}
                  </span>
                )}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <FavoriteButton
                  contentId={item.id}
                  contentType={item.type}
                  contentTitle={item.title}
                  contentThumbnail={thumbnail}
                  contentCategory={item.category}
                  size="icon"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (videos.length === 0 && audioContent.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showTabs ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="recommended" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                For You
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommended">
              {user && recommendations.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span>Personalized based on your {watchHistory.length} watched, {favorites.length} favorites, and {ratings.length} ratings</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {recommendations.map((item) => (
                      <ContentCard key={`${item.type}-${item.id}`} item={item} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-600">
                    {user 
                      ? "Start watching and favoriting content to get personalized recommendations!"
                      : "Personalized recommendations are unavailable without user accounts."}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending">
              {trending.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {trending.map((item) => (
                    <ContentCard key={`${item.type}-${item.id}`} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-600">No trending content available yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(user && recommendations.length > 0 ? recommendations : trending).map((item) => (
              <ContentCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
