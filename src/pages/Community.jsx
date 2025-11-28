import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  ListMusic,
  Video,
  Music,
  Search,
  TrendingUp,
  Clock,
  Heart,
  Sparkles,
  User,
  Loader2
} from "lucide-react";
import UserCard from "@/components/community/UserCard";
import PublicPlaylistCard from "@/components/community/PublicPlaylistCard";
import ActivityFeed from "@/components/community/ActivityFeed";

export default function Community() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("discover");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch public audio playlists
  const { data: audioPlaylists = [], isLoading: loadingAudio } = useQuery({
    queryKey: ['publicAudioPlaylists'],
    queryFn: () => base44.entities.Playlist.filter({ is_public: true }, '-like_count'),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch public video playlists
  const { data: videoPlaylists = [], isLoading: loadingVideo } = useQuery({
    queryKey: ['publicVideoPlaylists'],
    queryFn: () => base44.entities.VideoPlaylist.filter({ is_public: true }, '-like_count'),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch users with most uploads (active contributors)
  const { data: videos = [] } = useQuery({
    queryKey: ['allVideosForUsers'],
    queryFn: () => base44.entities.VideoPodcast.filter({ status: 'approved' }),
    staleTime: 1000 * 60 * 10,
  });

  const { data: audios = [] } = useQuery({
    queryKey: ['allAudiosForUsers'],
    queryFn: () => base44.entities.AudioContent.filter({ status: 'approved' }),
    staleTime: 1000 * 60 * 10,
  });

  // Fetch favorites to find active users
  const { data: allFavorites = [] } = useQuery({
    queryKey: ['allFavoritesForUsers'],
    queryFn: () => base44.entities.Favorite.list('-created_date', 100),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch follower counts
  const { data: allFollows = [] } = useQuery({
    queryKey: ['allFollows'],
    queryFn: () => base44.entities.UserFollow.list(),
    staleTime: 1000 * 60 * 5,
  });

  // Get users this person is following
  const { data: following = [] } = useQuery({
    queryKey: ['myFollowing', user?.email],
    queryFn: () => user ? base44.entities.UserFollow.filter({ follower_email: user.email }) : [],
    enabled: !!user,
  });

  // Calculate user stats
  const userStats = React.useMemo(() => {
    const stats = {};
    
    // Count uploads
    [...videos, ...audios].forEach(content => {
      const email = content.created_by;
      if (!email) return;
      if (!stats[email]) stats[email] = { email, uploads: 0, favorites: 0, followers: 0 };
      stats[email].uploads++;
    });

    // Count favorites
    allFavorites.forEach(fav => {
      const email = fav.user_email;
      if (!email) return;
      if (!stats[email]) stats[email] = { email, uploads: 0, favorites: 0, followers: 0 };
      stats[email].favorites++;
    });

    // Count followers
    allFollows.forEach(follow => {
      const email = follow.following_email;
      if (!email) return;
      if (!stats[email]) stats[email] = { email, uploads: 0, favorites: 0, followers: 0 };
      stats[email].followers++;
    });

    return Object.values(stats)
      .filter(s => s.uploads > 0 || s.favorites > 2)
      .sort((a, b) => (b.uploads + b.followers) - (a.uploads + a.followers));
  }, [videos, audios, allFavorites, allFollows]);

  // Filter playlists
  const filteredAudioPlaylists = audioPlaylists.filter(p => 
    !searchTerm || 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVideoPlaylists = videoPlaylists.filter(p => 
    !searchTerm || 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter users
  const filteredUsers = userStats.filter(u =>
    !searchTerm || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayAudioPlaylist = (playlist) => {
    if (playlist.audio_ids?.length > 0) {
      window.location.href = `/Audio?playlist=${playlist.id}`;
    }
  };

  const handlePlayVideoPlaylist = (playlist) => {
    if (playlist.video_ids?.length > 0) {
      window.location.href = `/VideoPodcast?playlist=${playlist.id}`;
    }
  };

  const isLoading = loadingAudio || loadingVideo;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-600">Discover playlists, follow users, and see what others are enjoying</p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search playlists or users..."
            className="pl-12 h-12 rounded-full bg-white border-gray-200"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 bg-white border border-gray-200 max-w-2xl mx-auto">
            <TabsTrigger value="discover" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4 mr-1 hidden sm:inline" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <ListMusic className="w-4 h-4 mr-1 hidden sm:inline" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-1 hidden sm:inline" />
              Users
            </TabsTrigger>
            <TabsTrigger value="feed" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Heart className="w-4 h-4 mr-1 hidden sm:inline" />
              Feed
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-8 mt-6">
            {/* Trending Playlists */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">Trending Playlists</h2>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...filteredAudioPlaylists, ...filteredVideoPlaylists]
                    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
                    .slice(0, 8)
                    .map(playlist => (
                      <PublicPlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        type={playlist.audio_ids ? "audio" : "video"}
                        onPlay={playlist.audio_ids ? handlePlayAudioPlaylist : handlePlayVideoPlaylist}
                      />
                    ))}
                </div>
              )}
            </section>

            {/* Active Users */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-gray-900">Active Contributors</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.slice(0, 6).map(userStat => (
                  <UserCard
                    key={userStat.email}
                    userEmail={userStat.email}
                    userName={userStat.email.split('@')[0]}
                    uploadCount={userStat.uploads}
                    favoriteCount={userStat.favorites}
                    followerCount={userStat.followers}
                  />
                ))}
              </div>
            </section>

            {/* New Playlists */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Recently Created</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...filteredAudioPlaylists, ...filteredVideoPlaylists]
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .slice(0, 4)
                  .map(playlist => (
                    <PublicPlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      type={playlist.audio_ids ? "audio" : "video"}
                      onPlay={playlist.audio_ids ? handlePlayAudioPlaylist : handlePlayVideoPlaylist}
                    />
                  ))}
              </div>
            </section>
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="space-y-8 mt-6">
            {/* Audio Playlists */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-900">Audio Playlists</h2>
                <Badge variant="outline">{filteredAudioPlaylists.length}</Badge>
              </div>
              {filteredAudioPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAudioPlaylists.map(playlist => (
                    <PublicPlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      type="audio"
                      onPlay={handlePlayAudioPlaylist}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-gray-200">
                  <CardContent className="py-8 text-center">
                    <Music className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-600">No public audio playlists yet</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Video Playlists */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Video Playlists</h2>
                <Badge variant="outline">{filteredVideoPlaylists.length}</Badge>
              </div>
              {filteredVideoPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVideoPlaylists.map(playlist => (
                    <PublicPlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      type="video"
                      onPlay={handlePlayVideoPlaylist}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-gray-200">
                  <CardContent className="py-8 text-center">
                    <Video className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-600">No public video playlists yet</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(userStat => (
                  <UserCard
                    key={userStat.email}
                    userEmail={userStat.email}
                    userName={userStat.email.split('@')[0]}
                    uploadCount={userStat.uploads}
                    favoriteCount={userStat.favorites}
                    followerCount={userStat.followers}
                  />
                ))
              ) : (
                <Card className="bg-white border-gray-200 col-span-full">
                  <CardContent className="py-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-600">No users found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="feed" className="mt-6">
            {user ? (
              <ActivityFeed />
            ) : (
              <Card className="bg-white border-gray-200">
                <CardContent className="py-12 text-center">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized feed is unavailable</h3>
                  <p className="text-gray-600">Follow features are limited without user accounts.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
