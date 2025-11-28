import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search as SearchIcon,
  Video,
  Music,
  Play,
  Eye,
  Clock,
  Filter,
  X,
  Sparkles,
  TrendingUp,
  Calendar,
  User,
  Tag,
  SortAsc,
  Loader2,
  Heart,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORIES = [
  "All",
  "Quran",
  "Hadith",
  "Salah",
  "Fiqh",
  "Aqeedah",
  "Nasheeds",
  "Lectures",
  "Tafsir",
  "Seerah",
  "Ramadan",
  "Hajj",
  "Zakat",
  "Islamic History",
  "Spirituality",
  "General",
];

const DURATION_OPTIONS = [
  { label: "Any duration", value: "any" },
  { label: "Under 5 min", value: "0-5" },
  { label: "5-15 min", value: "5-15" },
  { label: "15-30 min", value: "15-30" },
  { label: "30-60 min", value: "30-60" },
  { label: "Over 60 min", value: "60+" },
];

const DATE_OPTIONS = [
  { label: "Any time", value: "any" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "This year", value: "year" },
];

const SORT_OPTIONS = [
  { label: "Most Relevant", value: "relevance" },
  { label: "Most Recent", value: "-published_date" },
  { label: "Oldest First", value: "published_date" },
  { label: "Most Viewed", value: "-views" },
  { label: "Title A-Z", value: "title" },
  { label: "Duration (Short)", value: "duration" },
  { label: "Duration (Long)", value: "-duration" },
];

export default function SearchPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "All",
    duration: "any",
    dateRange: "any",
    speaker: "all",
    sortBy: "relevance",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    
    // Check URL params for search
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) setSearchTerm(q);
  }, []);

  // Fetch all content
  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['search-videos'],
    queryFn: () => base44.entities.VideoPodcast.filter({ status: 'approved' }),
  });

  const { data: audios = [], isLoading: loadingAudios } = useQuery({
    queryKey: ['search-audios'],
    queryFn: () => base44.entities.AudioContent.filter({ status: 'approved' }),
  });

  // Fetch user activity for personalization
  const { data: favorites = [] } = useQuery({
    queryKey: ['user-favorites-search', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['user-ratings-search', user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: watchHistory = [] } = useQuery({
    queryKey: ['watch-history-search', user?.email],
    queryFn: () => user ? base44.entities.WatchProgress.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  // Get unique speakers
  const allSpeakers = useMemo(() => {
    const speakers = new Set();
    videos.forEach(v => v.speaker && speakers.add(v.speaker));
    audios.forEach(a => a.speaker && speakers.add(a.speaker));
    return Array.from(speakers).sort();
  }, [videos, audios]);

  // Calculate user preferences for personalization
  const userPreferences = useMemo(() => {
    if (!user) return { categories: {}, speakers: {}, contentIds: new Set() };

    const categories = {};
    const speakers = {};
    const contentIds = new Set();

    // From favorites
    favorites.forEach(f => {
      if (f.content_category) categories[f.content_category] = (categories[f.content_category] || 0) + 5;
      contentIds.add(f.content_id);
    });

    // From high ratings
    ratings.filter(r => r.rating >= 4).forEach(r => {
      const content = [...videos, ...audios].find(c => c.id === r.content_id);
      if (content?.category) categories[content.category] = (categories[content.category] || 0) + 3;
      if (content?.speaker) speakers[content.speaker] = (speakers[content.speaker] || 0) + 3;
      contentIds.add(r.content_id);
    });

    // From watch history
    watchHistory.filter(w => w.progress_percentage > 50).forEach(w => {
      const content = [...videos, ...audios].find(c => c.id === w.content_id);
      if (content?.category) categories[content.category] = (categories[content.category] || 0) + 2;
      if (content?.speaker) speakers[content.speaker] = (speakers[content.speaker] || 0) + 2;
      contentIds.add(w.content_id);
    });

    return { categories, speakers, contentIds };
  }, [user, favorites, ratings, watchHistory, videos, audios]);

  // Calculate relevance score for search
  const calculateRelevance = (item, term) => {
    if (!term) return 0;
    const lowerTerm = term.toLowerCase();
    let score = 0;

    // Title match (highest priority)
    if (item.title?.toLowerCase().includes(lowerTerm)) {
      score += item.title.toLowerCase().startsWith(lowerTerm) ? 100 : 50;
    }

    // Description match
    if (item.description?.toLowerCase().includes(lowerTerm)) score += 20;

    // Speaker match
    if (item.speaker?.toLowerCase().includes(lowerTerm)) score += 30;

    // Category match
    if (item.category?.toLowerCase().includes(lowerTerm)) score += 25;

    // Tags match
    if (item.tags?.some(tag => tag.toLowerCase().includes(lowerTerm))) score += 15;

    // Personalization boost
    if (userPreferences.categories[item.category]) {
      score += userPreferences.categories[item.category];
    }
    if (userPreferences.speakers[item.speaker]) {
      score += userPreferences.speakers[item.speaker];
    }

    // Popularity boost
    const views = item.view_count || item.play_count || 0;
    score += Math.log10(views + 1) * 2;

    return score;
  };

  // Filter and search content
  const filteredContent = useMemo(() => {
    let allContent = [];

    // Combine content based on tab
    if (activeTab === "all" || activeTab === "videos") {
      allContent = [...allContent, ...videos.map(v => ({ ...v, type: "video" }))];
    }
    if (activeTab === "all" || activeTab === "audio") {
      allContent = [...allContent, ...audios.map(a => ({ ...a, type: "audio" }))];
    }

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      allContent = allContent.filter(item => 
        item.title?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.speaker?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply filters
    if (filters.category !== "All") {
      allContent = allContent.filter(c => c.category === filters.category);
    }

    if (filters.speaker !== "all") {
      allContent = allContent.filter(c => c.speaker === filters.speaker);
    }

    if (filters.duration !== "any") {
      allContent = allContent.filter(c => {
        const duration = (c.duration || 0) / 60;
        switch (filters.duration) {
          case "0-5": return duration < 5;
          case "5-15": return duration >= 5 && duration < 15;
          case "15-30": return duration >= 15 && duration < 30;
          case "30-60": return duration >= 30 && duration < 60;
          case "60+": return duration >= 60;
          default: return true;
        }
      });
    }

    if (filters.dateRange !== "any") {
      const now = new Date();
      allContent = allContent.filter(c => {
        const date = new Date(c.published_date || c.created_date);
        const diffDays = (now - date) / (1000 * 60 * 60 * 24);
        switch (filters.dateRange) {
          case "today": return diffDays < 1;
          case "week": return diffDays < 7;
          case "month": return diffDays < 30;
          case "year": return diffDays < 365;
          default: return true;
        }
      });
    }

    // Sort
    if (filters.sortBy === "relevance" && searchTerm.trim()) {
      allContent = allContent.map(c => ({ ...c, relevance: calculateRelevance(c, searchTerm) }))
        .sort((a, b) => b.relevance - a.relevance);
    } else {
      const desc = filters.sortBy.startsWith("-");
      const field = filters.sortBy.replace("-", "");
      
      allContent.sort((a, b) => {
        let aVal, bVal;
        
        if (field === "views") {
          aVal = a.view_count || a.play_count || 0;
          bVal = b.view_count || b.play_count || 0;
        } else if (field === "published_date") {
          aVal = new Date(a.published_date || a.created_date || 0).getTime();
          bVal = new Date(b.published_date || b.created_date || 0).getTime();
        } else {
          aVal = a[field] || 0;
          bVal = b[field] || 0;
        }

        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = (bVal || "").toLowerCase();
        }

        return desc ? bVal - aVal : aVal - bVal;
      });
    }

    return allContent;
  }, [videos, audios, activeTab, searchTerm, filters, userPreferences]);

  // "For You" personalized content
  const forYouContent = useMemo(() => {
    if (!user) return [];

    let allContent = [
      ...videos.map(v => ({ ...v, type: "video" })),
      ...audios.map(a => ({ ...a, type: "audio" }))
    ];

    // Exclude already watched/interacted content
    allContent = allContent.filter(c => !userPreferences.contentIds.has(c.id));

    // Score each item
    allContent = allContent.map(item => {
      let score = 0;

      // Category preference
      if (userPreferences.categories[item.category]) {
        score += userPreferences.categories[item.category] * 10;
      }

      // Speaker preference
      if (userPreferences.speakers[item.speaker]) {
        score += userPreferences.speakers[item.speaker] * 15;
      }

      // Popularity
      const views = item.view_count || item.play_count || 0;
      score += Math.log10(views + 1) * 3;

      // Recency
      if (item.published_date) {
        const daysSince = (Date.now() - new Date(item.published_date)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) score += 10;
        else if (daysSince < 30) score += 5;
      }

      // Featured content
      if (item.featured) score += 20;

      // Random variety
      score += Math.random() * 5;

      return { ...item, score };
    });

    return allContent.sort((a, b) => b.score - a.score).slice(0, 20);
  }, [user, videos, audios, userPreferences]);

  // Trending content
  const trendingContent = useMemo(() => {
    return [
      ...videos.map(v => ({ ...v, type: "video" })),
      ...audios.map(a => ({ ...a, type: "audio" }))
    ].sort((a, b) => {
      const aViews = a.view_count || a.play_count || 0;
      const bViews = b.view_count || b.play_count || 0;
      return bViews - aViews;
    }).slice(0, 20);
  }, [videos, audios]);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);

  const handleContentClick = (item) => {
    if (item.type === "video") {
      setSelectedVideo(item);
    } else {
      setSelectedAudio(item);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "category") return value !== "All";
    if (key === "duration") return value !== "any";
    if (key === "dateRange") return value !== "any";
    if (key === "speaker") return value !== "all";
    if (key === "sortBy") return value !== "relevance";
    return false;
  }).length;

  const isLoading = loadingVideos || loadingAudios;

  const ContentCard = ({ item }) => (
    <Card 
      className="bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
      onClick={() => handleContentClick(item)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-100">
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
                <Video className="w-12 h-12 text-white/50" />
              ) : (
                <Music className="w-12 h-12 text-white/50" />
              )}
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className={`w-14 h-14 ${item.type === "video" ? "bg-red-600" : "bg-green-600"} rounded-full flex items-center justify-center shadow-lg`}>
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          {item.duration > 0 && (
            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
              {formatDuration(item.duration)}
            </Badge>
          )}

          {/* Type badge */}
          <Badge className={`absolute top-2 left-2 ${item.type === "video" ? "bg-red-600" : "bg-green-600"} text-white text-xs`}>
            {item.type === "video" ? <Video className="w-3 h-3 mr-1" /> : <Music className="w-3 h-3 mr-1" />}
            {item.type}
          </Badge>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm">
            {item.title}
          </h3>
          
          <div className="flex items-center gap-2 mt-1">
            {item.speaker && (
              <span className="text-xs text-gray-600 truncate">{item.speaker}</span>
            )}
            {item.speaker && item.category && <span className="text-gray-400">•</span>}
            <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
              {item.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatViewCount(item.view_count || item.play_count)}
              </span>
              {item.duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(item.duration)}
                </span>
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
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
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <SearchIcon className="w-8 h-8 text-blue-600" />
            Search & Discover
          </h1>
          <p className="text-gray-600">Find Islamic content across videos and audio</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description, speaker, category, or tags..."
              className="pl-12 pr-12 h-14 text-lg rounded-2xl border-gray-300 focus:border-blue-500"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Video className="w-4 h-4 mr-1" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="audio" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <Music className="w-4 h-4 mr-1" />
                Audio
              </TabsTrigger>
              {user && (
                <TabsTrigger value="foryou" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <Sparkles className="w-4 h-4 mr-1" />
                  For You
                </TabsTrigger>
              )}
              <TabsTrigger value="trending" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-1" />
                Trending
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-1 bg-blue-600 text-white text-xs px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                  <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Speaker</label>
                  <Select value={filters.speaker} onValueChange={(v) => setFilters({...filters, speaker: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Speakers</SelectItem>
                      {allSpeakers.map(speaker => (
                        <SelectItem key={speaker} value={speaker}>{speaker}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Duration</label>
                  <Select value={filters.duration} onValueChange={(v) => setFilters({...filters, duration: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Upload Date</label>
                  <Select value={filters.dateRange} onValueChange={(v) => setFilters({...filters, dateRange: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(v) => setFilters({...filters, sortBy: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters badges */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                  {filters.category !== "All" && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.category}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({...filters, category: "All"})} />
                    </Badge>
                  )}
                  {filters.speaker !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.speaker}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({...filters, speaker: "all"})} />
                    </Badge>
                  )}
                  {filters.duration !== "any" && (
                    <Badge variant="secondary" className="gap-1">
                      {DURATION_OPTIONS.find(d => d.value === filters.duration)?.label}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({...filters, duration: "any"})} />
                    </Badge>
                  )}
                  {filters.dateRange !== "any" && (
                    <Badge variant="secondary" className="gap-1">
                      {DATE_OPTIONS.find(d => d.value === filters.dateRange)?.label}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({...filters, dateRange: "any"})} />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ category: "All", duration: "any", dateRange: "any", speaker: "all", sortBy: "relevance" })}
                    className="text-red-600 h-6"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : activeTab === "foryou" && user ? (
          <>
            <div className="flex items-center gap-2 text-gray-900">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Recommended For You</h2>
              <Badge className="bg-purple-100 text-purple-700">Based on your activity</Badge>
            </div>
            {forYouContent.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {forYouContent.map(item => (
                  <ContentCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <Card className="bg-white border-gray-200">
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Building Your Recommendations</h3>
                  <p className="text-gray-600">Like, rate, and watch content to get personalized recommendations</p>
                </CardContent>
              </Card>
            )}
          </>
        ) : activeTab === "trending" ? (
          <>
            <div className="flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold">Trending Now</h2>
              <Badge className="bg-orange-100 text-orange-700">Most popular</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trendingContent.map(item => (
                <ContentCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Search results summary */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {searchTerm ? (
                  <>Found <span className="font-semibold text-gray-900">{filteredContent.length}</span> results for "{searchTerm}"</>
                ) : (
                  <><span className="font-semibold text-gray-900">{filteredContent.length}</span> items</>
                )}
              </p>
            </div>

            {filteredContent.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredContent.map(item => (
                  <ContentCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <Card className="bg-white border-gray-200">
                <CardContent className="py-16 text-center">
                  <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                  <p className="text-gray-600">Try different keywords or adjust your filters</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Video Player Dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{selectedVideo?.title}</DialogTitle>
            </DialogHeader>
            {selectedVideo && (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {selectedVideo.video_url?.includes('youtube.com/embed') ? (
                    <iframe
                      src={selectedVideo.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selectedVideo.title}
                    />
                  ) : (
                    <video
                      src={selectedVideo.video_url}
                      controls
                      autoPlay
                      className="w-full h-full"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-red-400 text-red-700">
                    {selectedVideo.category}
                  </Badge>
                  {selectedVideo.speaker && (
                    <Badge variant="outline" className="border-gray-400 text-gray-700">
                      {selectedVideo.speaker}
                    </Badge>
                  )}
                </div>
                {selectedVideo.description && (
                  <p className="text-gray-700 text-sm">{selectedVideo.description}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Audio Player Dialog */}
        <Dialog open={!!selectedAudio} onOpenChange={() => setSelectedAudio(null)}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{selectedAudio?.title}</DialogTitle>
            </DialogHeader>
            {selectedAudio && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedAudio.cover_image_url ? (
                    <img src={selectedAudio.cover_image_url} alt={selectedAudio.title} className="w-24 h-24 rounded-lg object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Music className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div>
                    <Badge variant="outline" className="border-green-400 text-green-700 mb-2">
                      {selectedAudio.category}
                    </Badge>
                    {selectedAudio.speaker && (
                      <p className="text-gray-600">{selectedAudio.speaker}</p>
                    )}
                  </div>
                </div>
                <audio
                  src={selectedAudio.audio_url}
                  controls
                  autoPlay
                  className="w-full"
                />
                {selectedAudio.description && (
                  <p className="text-gray-700 text-sm">{selectedAudio.description}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}