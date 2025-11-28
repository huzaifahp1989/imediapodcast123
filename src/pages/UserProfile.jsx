import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Music,
  Video,
  ListMusic,
  Shield,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Headphones,
  Eye,
  Clock,
  Edit,
  Loader2,
  Crown,
  Plus,
  Heart,
  MessageSquare,
  Camera,
  Upload,
  Play,
} from "lucide-react";
import PlaylistManager from "@/components/PlaylistManager";
import { toast } from "sonner";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", display_name: "" });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setViewingUser(u);
      setProfileForm({ 
        full_name: u.full_name || "", 
        display_name: u.display_name || "" 
      });
    }).catch(() => {});
  }, []);

  // Get URL parameter for viewing other users (admin only)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');
    
    if (userEmail && user?.role === 'admin') {
      base44.entities.User.filter({ email: userEmail })
        .then(users => {
          if (users.length > 0) {
            setViewingUser(users[0]);
          }
        });
    }
  }, [user]);

  const { data: audioContent } = useQuery({
    queryKey: ['user-audio', viewingUser?.email],
    queryFn: () => base44.entities.AudioContent.filter({ created_by: viewingUser?.email }),
    enabled: !!viewingUser,
    initialData: [],
  });

  const { data: videoContent } = useQuery({
    queryKey: ['user-videos', viewingUser?.email],
    queryFn: () => base44.entities.VideoPodcast.filter({ created_by: viewingUser?.email }),
    enabled: !!viewingUser,
    initialData: [],
  });

  const { data: playlists } = useQuery({
    queryKey: ['user-playlists', viewingUser?.email],
    queryFn: () => base44.entities.Playlist.filter({ user_email: viewingUser?.email }),
    enabled: !!viewingUser,
    initialData: [],
  });

  const { data: videoPlaylists } = useQuery({
    queryKey: ['user-video-playlists', viewingUser?.email],
    queryFn: () => base44.entities.VideoPlaylist.filter({ user_email: viewingUser?.email }),
    enabled: !!viewingUser,
    initialData: [],
  });

  // Fetch all approved audio and video content for playlist management
  const { data: allAudioContent } = useQuery({
    queryKey: ['all-audio-content'],
    queryFn: () => base44.entities.AudioContent.filter({ status: 'approved' }),
    enabled: !!viewingUser && isViewingSelf,
    initialData: [],
  });

  const { data: allVideoContent } = useQuery({
    queryKey: ['all-video-content'],
    queryFn: () => base44.entities.VideoPodcast.filter({ status: 'approved' }),
    enabled: !!viewingUser && isViewingSelf,
    initialData: [],
  });

  // Fetch user's favorites
  const { data: favorites } = useQuery({
    queryKey: ['user-favorites', viewingUser?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: viewingUser?.email }),
    enabled: !!viewingUser,
    initialData: [],
  });

  // Fetch user's comments
  const { data: comments } = useQuery({
    queryKey: ['user-comments', viewingUser?.email],
    queryFn: () => base44.entities.ContentComment.filter({ user_email: viewingUser?.email }, '-created_date'),
    enabled: !!viewingUser,
    initialData: [],
  });

  // Fetch all videos and audio for displaying favorites
  const { data: allVideos } = useQuery({
    queryKey: ['all-videos-for-favorites'],
    queryFn: () => base44.entities.VideoPodcast.list(),
    enabled: favorites.length > 0,
    initialData: [],
  });

  const { data: allAudio } = useQuery({
    queryKey: ['all-audio-for-favorites'],
    queryFn: () => base44.entities.AudioContent.list(),
    enabled: favorites.length > 0,
    initialData: [],
  });

  const isViewingSelf = user?.email === viewingUser?.email;

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      await base44.entities.User.update(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success("✅ User updated successfully!");
      setShowAdminDialog(false);
      
      // Refresh viewing user data
      if (viewingUser) {
        base44.entities.User.filter({ email: viewingUser.email })
          .then(users => {
            if (users.length > 0) {
              setViewingUser(users[0]);
            }
          });
      }
    },
    onError: (error) => {
      toast.error("Failed to update user: " + error.message);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      toast.success("✅ Profile updated!");
      setEditingProfile(false);
      base44.auth.me().then(u => {
        setUser(u);
        setViewingUser(u);
      });
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    }
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setViewingUser(updatedUser);
      toast.success("✅ Avatar updated!");
    } catch (error) {
      toast.error("Failed to upload avatar: " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleRole = () => {
    const newRole = viewingUser.role === 'admin' ? 'user' : 'admin';
    updateUserMutation.mutate({
      userId: viewingUser.id,
      data: { role: newRole }
    });
  };

  const toggleTrustedUploader = () => {
    updateUserMutation.mutate({
      userId: viewingUser.id,
      data: { trusted_uploader: !viewingUser.trusted_uploader }
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalAudioPlays = audioContent.reduce((sum, audio) => sum + (audio.play_count || 0), 0);
  const totalVideoViews = videoContent.reduce((sum, video) => sum + (video.view_count || 0), 0);
  const totalAudioDuration = audioContent.reduce((sum, audio) => sum + (audio.duration || 0), 0);
  const totalVideoDuration = videoContent.reduce((sum, video) => sum + (video.duration || 0), 0);

  const approvedAudio = audioContent.filter(a => a.status === 'approved').length;
  const pendingAudio = audioContent.filter(a => a.status === 'pending').length;
  const approvedVideos = videoContent.filter(v => v.status === 'approved').length;
  const pendingVideos = videoContent.filter(v => v.status === 'pending').length;

  // Get favorite content details
  const favoriteVideos = favorites.filter(f => f.content_type === 'video').map(f => {
    const video = allVideos.find(v => v.id === f.content_id);
    return video ? { ...video, favoriteId: f.id } : null;
  }).filter(Boolean);

  const favoriteAudio = favorites.filter(f => f.content_type === 'audio').map(f => {
    const audio = allAudio.find(a => a.id === f.content_id);
    return audio ? { ...audio, favoriteId: f.id } : null;
  }).filter(Boolean);

  if (!user || !viewingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-start gap-4 flex-1">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {viewingUser.avatar_url ? (
                      <img 
                        src={viewingUser.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  {isViewingSelf && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6 text-white" />
                        )}
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  {editingProfile && isViewingSelf ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-700 text-sm">Display Name</Label>
                        <Input
                          value={profileForm.display_name}
                          onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                          placeholder="Display Name (shown publicly)"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 text-sm">Full Name</Label>
                        <Input
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          placeholder="Your Full Name"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateProfileMutation.mutate(profileForm)}
                          disabled={updateProfileMutation.isPending}
                          className="bg-blue-600 text-white"
                        >
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProfile(false)}
                          className="border-gray-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {viewingUser.display_name || viewingUser.full_name || "User"}
                        </h1>
                        {viewingUser.role === 'admin' && (
                          <Badge className="bg-purple-500 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {viewingUser.trusted_uploader && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Trusted Uploader
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <Mail className="w-4 h-4" />
                        <span>{viewingUser.email}</span>
                      </div>
                      {viewingUser.created_date && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {format(new Date(viewingUser.created_date), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {isViewingSelf && !editingProfile && (
                  <Button
                    onClick={() => setEditingProfile(true)}
                    variant="outline"
                    className="border-blue-600 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
                
                {isAdmin && !isViewingSelf && (
                  <Button
                    onClick={() => setShowAdminDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Manage User
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-300">
            <CardContent className="p-6 text-center">
              <Music className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">{audioContent.length}</p>
              <p className="text-sm text-gray-600">Audio Uploads</p>
              {pendingAudio > 0 && (
                <Badge className="mt-2 bg-yellow-500 text-white text-xs">
                  {pendingAudio} Pending
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300">
            <CardContent className="p-6 text-center">
              <Video className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{videoContent.length}</p>
              <p className="text-sm text-gray-600">Video Uploads</p>
              {pendingVideos > 0 && (
                <Badge className="mt-2 bg-yellow-500 text-white text-xs">
                  {pendingVideos} Pending
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300">
            <CardContent className="p-6 text-center">
              <Headphones className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{totalAudioPlays}</p>
              <p className="text-sm text-gray-600">Audio Plays</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300">
            <CardContent className="p-6 text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-gray-900">{totalVideoViews}</p>
              <p className="text-sm text-gray-600">Video Views</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="flex flex-wrap bg-white border border-gray-300 h-auto p-1 gap-1">
            <TabsTrigger value="videos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex-1 min-w-[100px]">
              <Video className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Videos</span> ({videoContent.length})
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex-1 min-w-[100px]">
              <Music className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Audio</span> ({audioContent.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex-1 min-w-[100px]">
              <Heart className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Liked</span> ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex-1 min-w-[100px]">
              <MessageSquare className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Comments</span> ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex-1 min-w-[100px]">
              <ListMusic className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Playlists</span> ({playlists.length + videoPlaylists.length})
            </TabsTrigger>
          </TabsList>

          {/* Audio Content */}
          <TabsContent value="audio" className="space-y-4 mt-6">
            {audioContent.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {audioContent.map(audio => (
                  <Card key={audio.id} className="bg-white border-gray-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          {audio.cover_image_url ? (
                            <img src={audio.cover_image_url} alt={audio.title} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Music className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 font-semibold line-clamp-1">{audio.title}</h3>
                          <p className="text-gray-600 text-sm">{audio.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(audio.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Headphones className="w-3 h-3" />
                          {audio.play_count || 0}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Badge className={
                          audio.status === 'approved' ? 'bg-green-500 text-white' :
                          audio.status === 'pending' ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        }>
                          {audio.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-gray-300">
                <CardContent className="p-12 text-center">
                  <Music className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audio Content</h3>
                  <p className="text-gray-700">No audio files uploaded yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Video Content */}
          <TabsContent value="videos" className="space-y-4 mt-6">
            {videoContent.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoContent.map(video => (
                  <Card 
                    key={video.id} 
                    className="bg-white border-gray-300 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all group"
                    onClick={() => navigate(createPageUrl("VideoPodcast") + `?id=${video.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                          ) : (
                            <Video className="w-6 h-6 text-white" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors">{video.title}</h3>
                          <p className="text-gray-600 text-sm">{video.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(video.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.view_count || 0}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Badge className={
                          video.status === 'approved' ? 'bg-green-500 text-white' :
                          video.status === 'pending' ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        }>
                          {video.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-gray-300">
                <CardContent className="p-12 text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Video Content</h3>
                  <p className="text-gray-700">No videos uploaded yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6 mt-6">
            {/* Favorite Videos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-red-600" />
                Liked Videos ({favoriteVideos.length})
              </h3>
              {favoriteVideos.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteVideos.map(video => (
                    <Card 
                      key={video.id} 
                      className="bg-white border-gray-300 cursor-pointer hover:shadow-lg hover:border-red-400 transition-all group"
                      onClick={() => navigate(createPageUrl("VideoPodcast") + `?id=${video.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                            {video.thumbnail_url ? (
                              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                            ) : (
                              <Video className="w-6 h-6 text-white" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-semibold line-clamp-2 text-sm group-hover:text-red-600 transition-colors">{video.title}</h3>
                            <p className="text-gray-600 text-xs">{video.category}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-gray-300">
                  <CardContent className="p-8 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-gray-600">No liked videos yet</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Favorite Audio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-green-600" />
                Liked Audio ({favoriteAudio.length})
              </h3>
              {favoriteAudio.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteAudio.map(audio => (
                    <Card key={audio.id} className="bg-white border-gray-300">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {audio.cover_image_url ? (
                              <img src={audio.cover_image_url} alt={audio.title} className="w-full h-full object-cover" />
                            ) : (
                              <Music className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-semibold line-clamp-1 text-sm">{audio.title}</h3>
                            <p className="text-gray-600 text-xs">{audio.category}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-gray-300">
                  <CardContent className="p-8 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-gray-600">No liked audio yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4 mt-6">
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map(comment => (
                  <Card key={comment.id} className="bg-white border-gray-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="border-gray-400 text-gray-700 text-xs">
                              {comment.content_type === 'video' ? 'Video' : 'Audio'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(comment.created_date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className="text-gray-900">{comment.comment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-gray-300">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Comments</h3>
                  <p className="text-gray-700">No comments posted yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Playlists Tab (Combined) */}
          <TabsContent value="playlists" className="space-y-6 mt-6">
            {/* Audio Playlists */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-600" />
                Audio Playlists ({playlists.length})
              </h3>
              {isViewingSelf ? (
                <PlaylistManager
                  type="audio"
                  userEmail={viewingUser.email}
                  playlists={playlists}
                  allContent={allAudioContent}
                  onPlaylistClick={(playlist) => {
                    toast.info(`Playing playlist: ${playlist.name}`);
                  }}
                />
              ) : (
                playlists.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map(playlist => (
                      <Card key={playlist.id} className="bg-white border-gray-300">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <ListMusic className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-gray-900 font-semibold line-clamp-1">{playlist.name}</h3>
                              <p className="text-gray-600 text-sm line-clamp-1">{playlist.description || "No description"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="border-gray-400 text-gray-700">
                              {playlist.track_count || 0} tracks
                            </Badge>
                            <Badge variant="outline" className="border-gray-400 text-gray-700">
                              {formatDuration(playlist.total_duration || 0)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white border-gray-300">
                    <CardContent className="p-8 text-center">
                      <ListMusic className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                      <p className="text-gray-600">No audio playlists created yet</p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>

            {/* Video Playlists */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                Video Playlists ({videoPlaylists.length})
              </h3>
              {isViewingSelf ? (
                <PlaylistManager
                  type="video"
                  userEmail={viewingUser.email}
                  playlists={videoPlaylists}
                  allContent={allVideoContent}
                  onPlaylistClick={(playlist) => {
                    toast.info(`Playing playlist: ${playlist.name}`);
                  }}
                />
              ) : (
                videoPlaylists.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videoPlaylists.map(playlist => (
                      <Card key={playlist.id} className="bg-white border-gray-300">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                              <ListMusic className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-gray-900 font-semibold line-clamp-1">{playlist.name}</h3>
                              <p className="text-gray-600 text-sm line-clamp-1">{playlist.description || "No description"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="border-gray-400 text-gray-700">
                              {playlist.video_count || 0} videos
                            </Badge>
                            <Badge variant="outline" className="border-gray-400 text-gray-700">
                              {formatDuration(playlist.total_duration || 0)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white border-gray-300">
                    <CardContent className="p-8 text-center">
                      <ListMusic className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                      <p className="text-gray-600">No video playlists created yet</p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Admin Management Dialog */}
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogContent className="bg-white border-gray-300 text-gray-900">
            <DialogHeader>
              <DialogTitle>Manage User: {viewingUser.full_name || viewingUser.email}</DialogTitle>
              <DialogDescription className="text-gray-700">
                Update user permissions and status
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-gray-900 text-base font-semibold">User Role</Label>
                <Card className={`p-4 cursor-pointer transition-all ${
                  viewingUser.role === 'admin' 
                    ? 'bg-purple-50 border-purple-300' 
                    : 'bg-white border-gray-300 hover:border-purple-300'
                }`} onClick={toggleRole}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-900">Admin Role</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Full access to moderation, user management, and all content
                      </p>
                    </div>
                    {viewingUser.role === 'admin' ? (
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </Card>

                <Card className={`p-4 cursor-pointer transition-all ${
                  viewingUser.role === 'user' 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white border-gray-300 hover:border-blue-300'
                }`} onClick={toggleRole}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">Regular User</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Standard user with content upload capabilities
                      </p>
                    </div>
                    {viewingUser.role === 'user' ? (
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 text-base font-semibold">Content Moderation</Label>
                <Card className={`p-4 cursor-pointer transition-all ${
                  viewingUser.trusted_uploader 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-white border-gray-300 hover:border-green-300'
                }`} onClick={toggleTrustedUploader}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-gray-900">Trusted Uploader</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Content is auto-approved without moderation review
                      </p>
                    </div>
                    {viewingUser.trusted_uploader ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </Card>
              </div>

              {updateUserMutation.isPending && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}