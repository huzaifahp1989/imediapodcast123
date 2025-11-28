import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Music, Video, Play, Trash2, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', 'user', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  // Fetch actual content for more details
  const { data: audioContent = [] } = useQuery({
    queryKey: ['audioContent'],
    queryFn: () => base44.entities.AudioContent.filter({ status: 'approved' }),
  });

  const { data: videoContent = [] } = useQuery({
    queryKey: ['videoContent'],
    queryFn: () => base44.entities.VideoPodcast.filter({ status: 'approved' }),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success("Removed from favorites");
    },
  });

  const audioFavorites = favorites.filter(f => f.content_type === 'audio');
  const videoFavorites = favorites.filter(f => f.content_type === 'video');

  const filteredFavorites = activeTab === 'all' 
    ? favorites 
    : activeTab === 'audio' 
      ? audioFavorites 
      : videoFavorites;

  // Get full content details
  const getContentDetails = (favorite) => {
    if (favorite.content_type === 'audio') {
      return audioContent.find(a => a.id === favorite.content_id);
    } else {
      return videoContent.find(v => v.id === favorite.content_id);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Favorites</h1>
          <p className="text-gray-600">Favorites are currently unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-gray-700 text-lg">Your saved audio and video content</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{audioFavorites.length}</p>
              <p className="text-sm text-gray-600">Audio</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{videoFavorites.length}</p>
              <p className="text-sm text-gray-600">Video</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md mx-auto bg-gray-100">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              All ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-white">
              <Music className="w-4 h-4 mr-2" />
              Audio ({audioFavorites.length})
            </TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-white">
              <Video className="w-4 h-4 mr-2" />
              Video ({videoFavorites.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-700 mt-4">Loading favorites...</p>
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFavorites.map((favorite) => {
              const details = getContentDetails(favorite);
              const isAudio = favorite.content_type === 'audio';
              const linkUrl = isAudio 
                ? createPageUrl("Audio") + `?play=${favorite.content_id}`
                : createPageUrl("VideoPodcast") + `?play=${favorite.content_id}`;

              return (
                <Card 
                  key={favorite.id} 
                  className="bg-white border-gray-200 hover:border-red-300 hover:shadow-lg transition-all group overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <Link to={linkUrl} className="block relative">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {favorite.content_thumbnail || details?.cover_image_url || details?.thumbnail_url ? (
                          <img 
                            src={favorite.content_thumbnail || details?.cover_image_url || details?.thumbnail_url} 
                            alt={favorite.content_title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isAudio ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                          }`}>
                            {isAudio ? (
                              <Music className="w-12 h-12 text-white/50" />
                            ) : (
                              <Video className="w-12 h-12 text-white/50" />
                            )}
                          </div>
                        )}
                        
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-6 h-6 text-gray-900 ml-1" />
                          </div>
                        </div>

                        {/* Type badge */}
                        <Badge className={`absolute top-2 left-2 ${
                          isAudio ? 'bg-emerald-500' : 'bg-blue-500'
                        } text-white`}>
                          {isAudio ? <Music className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />}
                          {isAudio ? 'Audio' : 'Video'}
                        </Badge>

                        {/* Duration */}
                        {details?.duration && (
                          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(details.duration)}
                          </Badge>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Link to={linkUrl}>
                            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-red-600 transition-colors">
                              {favorite.content_title || details?.title || 'Untitled'}
                            </h3>
                          </Link>
                          
                          {favorite.content_category && (
                            <Badge variant="outline" className="mt-2 text-xs border-gray-300">
                              {favorite.content_category}
                            </Badge>
                          )}

                          {details?.speaker && (
                            <p className="text-sm text-gray-600 mt-1">{details.speaker}</p>
                          )}

                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Saved {format(new Date(favorite.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFavoriteMutation.mutate(favorite.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'all' 
                  ? "Start exploring and save your favorite content!" 
                  : `No ${activeTab} favorites yet`}
              </p>
              <div className="flex gap-3 justify-center">
                <Link to={createPageUrl("Audio")}>
                  <Button variant="outline" className="border-emerald-500 text-emerald-700">
                    <Music className="w-4 h-4 mr-2" />
                    Browse Audio
                  </Button>
                </Link>
                <Link to={createPageUrl("VideoPodcast")}>
                  <Button variant="outline" className="border-blue-500 text-blue-700">
                    <Video className="w-4 h-4 mr-2" />
                    Browse Videos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
