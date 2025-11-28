import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Headphones, Search, BookOpen, Mic2, Users, Heart, Globe, Sparkles, MessageSquare, Music } from "lucide-react";
import PodcastCard from "../components/podcast/PodcastCard";
import AudioPlayer from "../components/radio/AudioPlayer";

const categoryConfig = {
  "Quran": { icon: BookOpen, color: "from-green-500 to-emerald-500" },
  "Hadith": { icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
  "Fiqh": { icon: Users, color: "from-amber-500 to-orange-500" },
  "Aqeedah": { icon: Heart, color: "from-red-500 to-rose-500" },
  "History": { icon: Globe, color: "from-indigo-500 to-purple-500" },
  "Spirituality": { icon: Sparkles, color: "from-teal-500 to-cyan-500" },
  "General": { icon: Mic2, color: "from-purple-500 to-pink-500" },
  "Nasheeds": { icon: Music, color: "from-pink-500 to-rose-500" },
};

export default function Podcasts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPodcast, setCurrentPodcast] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedReciter, setSelectedReciter] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");

  const queryClient = useQueryClient();

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.list('-published_date'),
    initialData: [],
  });

  const updatePlayCountMutation = useMutation({
    mutationFn: ({ id, play_count }) => 
      base44.entities.Podcast.update(id, { play_count: play_count + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
    },
  });

  const handlePlay = (podcast) => {
    if (!podcast?.audio_url) return;
    setCurrentPodcast(podcast);
    updatePlayCountMutation.mutate({ 
      id: podcast.id, 
      play_count: podcast.play_count || 0 
    });
  };

  // Get unique categories and speakers by type
  const categories = ["All", ...new Set(podcasts.map(p => p.category).filter(Boolean))];
  
  const quranPodcasts = podcasts.filter(p => p.category === "Quran");
  const reciters = [...new Set(quranPodcasts.map(p => p.host_name).filter(Boolean))];
  
  const nasheedPodcasts = podcasts.filter(p => p.category === "Nasheeds");
  const artists = [...new Set(nasheedPodcasts.map(p => p.host_name).filter(Boolean))];
  
  const otherPodcasts = podcasts.filter(p => p.category !== "Quran" && p.category !== "Nasheeds");
  const speakers = [...new Set(otherPodcasts.map(p => p.host_name).filter(Boolean))];

  const filteredPodcasts = podcasts.filter(podcast => {
    if (!podcast) return false;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (podcast.title || "").toLowerCase().includes(searchLower) ||
      (podcast.host_name || "").toLowerCase().includes(searchLower) ||
      (podcast.description || "").toLowerCase().includes(searchLower) ||
      (podcast.category || "").toLowerCase().includes(searchLower)
    );
    const matchesCategory = selectedCategory === "All" || podcast.category === selectedCategory;
    
    // Check speaker filters
    const activeSpeakerFilter = selectedReciter || selectedArtist || selectedSpeaker;
    const matchesSpeakerFilter = !activeSpeakerFilter || podcast.host_name === activeSpeakerFilter;
    
    return matchesSearch && matchesCategory && matchesSpeakerFilter;
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Headphones className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white glow-text">Podcast Library</h1>
          <p className="text-purple-300 text-sm md:text-lg">Listen to recorded shows on demand</p>
        </div>

        {/* Current Playing */}
        {currentPodcast && currentPodcast.audio_url && (
          <AudioPlayer
            streamUrl={currentPodcast.audio_url}
            title={currentPodcast.title}
            subtitle={`By ${currentPodcast.host_name || "Unknown Host"}`}
            thumbnail={currentPodcast.thumbnail_url}
            isLive={false}
          />
        )}

        {/* Search */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search podcasts, hosts, topics..."
            className="pl-12 bg-slate-800/50 border-purple-500/30 text-white placeholder:text-purple-300/50 h-12 rounded-2xl"
          />
        </div>

        {/* Category Filter */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-purple-300 text-center">Browse by Topic</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => {
              const config = categoryConfig[cat] || { icon: Mic2, color: "from-gray-500 to-slate-500" };
              const Icon = cat === "All" ? Headphones : config.icon;
              const isActive = selectedCategory === cat;
              const count = cat === "All" ? podcasts.length : podcasts.filter(p => p.category === cat).length;
              
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? `bg-gradient-to-r ${cat === "All" ? "from-purple-500 to-pink-500" : config.color} text-white shadow-lg` 
                      : "bg-slate-800/50 text-purple-300 hover:bg-slate-700/50 border border-purple-500/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat}</span>
                  <Badge className={`text-xs ${isActive ? "bg-white/20 text-white" : "bg-purple-500/20 text-purple-300"}`}>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Speaker Dropdowns */}
        <div className="flex flex-wrap justify-center gap-3">
          {/* Quran Reciters Dropdown */}
          {reciters.length > 0 && (
            <Select
              value={selectedReciter}
              onValueChange={(val) => {
                setSelectedReciter(val === "all" ? "" : val);
                setSelectedArtist("");
                setSelectedSpeaker("");
              }}
            >
              <SelectTrigger className="w-48 bg-slate-800/50 border-green-500/30 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-400" />
                  <SelectValue placeholder="Quran Reciters" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-green-500/30">
                <SelectItem value="all" className="text-white">All Reciters</SelectItem>
                {reciters.map(reciter => (
                  <SelectItem key={reciter} value={reciter} className="text-white">{reciter}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Nasheeds Artists Dropdown */}
          {artists.length > 0 && (
            <Select
              value={selectedArtist}
              onValueChange={(val) => {
                setSelectedArtist(val === "all" ? "" : val);
                setSelectedReciter("");
                setSelectedSpeaker("");
              }}
            >
              <SelectTrigger className="w-48 bg-slate-800/50 border-pink-500/30 text-white">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-pink-400" />
                  <SelectValue placeholder="Nasheed Artists" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-pink-500/30">
                <SelectItem value="all" className="text-white">All Artists</SelectItem>
                {artists.map(artist => (
                  <SelectItem key={artist} value={artist} className="text-white">{artist}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* General Speakers Dropdown */}
          {speakers.length > 0 && (
            <Select
              value={selectedSpeaker}
              onValueChange={(val) => {
                setSelectedSpeaker(val === "all" ? "" : val);
                setSelectedReciter("");
                setSelectedArtist("");
              }}
            >
              <SelectTrigger className="w-48 bg-slate-800/50 border-indigo-500/30 text-white">
                <div className="flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-indigo-400" />
                  <SelectValue placeholder="Speakers" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-indigo-500/30">
                <SelectItem value="all" className="text-white">All Speakers</SelectItem>
                {speakers.map(speaker => (
                  <SelectItem key={speaker} value={speaker} className="text-white">{speaker}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Active Filters */}
        {(selectedCategory !== "All" || selectedReciter || selectedArtist || selectedSpeaker) && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm text-purple-300">Active filters:</span>
            {selectedCategory !== "All" && (
              <Badge 
                className="bg-purple-500/20 text-purple-300 cursor-pointer hover:bg-purple-500/30"
                onClick={() => setSelectedCategory("All")}
              >
                {selectedCategory} ×
              </Badge>
            )}
            {selectedReciter && (
              <Badge 
                className="bg-green-500/20 text-green-300 cursor-pointer hover:bg-green-500/30"
                onClick={() => setSelectedReciter("")}
              >
                {selectedReciter} ×
              </Badge>
            )}
            {selectedArtist && (
              <Badge 
                className="bg-pink-500/20 text-pink-300 cursor-pointer hover:bg-pink-500/30"
                onClick={() => setSelectedArtist("")}
              >
                {selectedArtist} ×
              </Badge>
            )}
            {selectedSpeaker && (
              <Badge 
                className="bg-indigo-500/20 text-indigo-300 cursor-pointer hover:bg-indigo-500/30"
                onClick={() => setSelectedSpeaker("")}
              >
                {selectedSpeaker} ×
              </Badge>
            )}
          </div>
        )}

        {/* Podcasts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-purple-300 mt-4">Loading podcasts...</p>
          </div>
        ) : filteredPodcasts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredPodcasts.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                podcast={podcast}
                onPlay={handlePlay}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Headphones className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? "No podcasts found" : "No podcasts available"}
            </h3>
            <p className="text-purple-300">
              {searchTerm ? "Try a different search term" : "Podcasts will appear here after shows are recorded"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}