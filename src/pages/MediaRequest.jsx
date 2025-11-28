import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  Star,
  Music,
  Video,
  BookOpen,
  Mic2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
  Crown,
  Eye,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MediaRequest() {
  const [user, setUser] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState("top-rated");
  
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    category: "Talks",
    speaker_artist: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null));
  }, []);

  const { data: mediaRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['mediaRequests'],
    queryFn: () => base44.entities.MediaRequest.list('-vote_count'),
    initialData: [],
  });

  const { data: audioContent } = useQuery({
    queryKey: ['audio-with-ratings'],
    queryFn: () => base44.entities.AudioContent.filter({ status: 'approved' }),
    initialData: [],
  });

  const { data: videoContent } = useQuery({
    queryKey: ['video-with-ratings'],
    queryFn: () => base44.entities.VideoPodcast.filter({ status: 'approved' }),
    initialData: [],
  });

  const { data: allRatings } = useQuery({
    queryKey: ['all-ratings'],
    queryFn: () => base44.entities.Rating.list(),
    initialData: [],
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.MediaRequest.create({
        ...data,
        requester_email: user.email,
        requester_name: user.full_name || user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaRequests'] });
      toast.success("✅ Request submitted successfully!");
      setShowRequestForm(false);
      setRequestForm({
        title: "",
        description: "",
        category: "Talks",
        speaker_artist: "",
      });
    },
  });

  const upvoteRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      const request = mediaRequests.find(r => r.id === requestId);
      await base44.entities.MediaRequest.update(requestId, {
        vote_count: (request.vote_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaRequests'] });
      toast.success("👍 Upvoted!");
    },
  });

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Requests are unavailable.");
      return;
    }
    createRequestMutation.mutate(requestForm);
  };

  // Calculate average ratings
  const getAverageRating = (contentId, contentType) => {
    const contentRatings = allRatings.filter(
      r => r.content_id === contentId && r.content_type === contentType
    );
    if (contentRatings.length === 0) return 0;
    const sum = contentRatings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / contentRatings.length).toFixed(1);
  };

  const getRatingCount = (contentId, contentType) => {
    return allRatings.filter(
      r => r.content_id === contentId && r.content_type === contentType
    ).length;
  };

  // Get top rated content
  const audioWithRatings = audioContent.map(audio => ({
    ...audio,
    avgRating: parseFloat(getAverageRating(audio.id, 'audio')),
    ratingCount: getRatingCount(audio.id, 'audio'),
  })).filter(a => a.ratingCount > 0);

  const videoWithRatings = videoContent.map(video => ({
    ...video,
    avgRating: parseFloat(getAverageRating(video.id, 'video')),
    ratingCount: getRatingCount(video.id, 'video'),
  })).filter(v => v.ratingCount > 0);

  const topRatedAudio = [...audioWithRatings]
    .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount)
    .slice(0, 12);

  const topRatedVideos = [...videoWithRatings]
    .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount)
    .slice(0, 12);

  const pendingRequests = mediaRequests.filter(r => r.status === 'pending');
  const fulfilledRequests = mediaRequests.filter(r => r.status === 'fulfilled');

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Quran': return BookOpen;
      case 'Nasheeds': return Music;
      case 'Talks': return Mic2;
      case 'Lectures': return Mic2;
      default: return MessageSquare;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Media Requests & Top Rated</h1>
          <p className="text-gray-700 text-lg">Request Islamic content & discover community favorites</p>
        </div>

        {/* Request Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowRequestForm(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            disabled={!user}
          >
            <Plus className="w-5 h-5 mr-2" />
            Submit Request
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-3 bg-white border border-gray-300">
            <TabsTrigger value="top-rated" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Crown className="w-4 h-4 mr-2" />
              Top Rated
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="fulfilled" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Fulfilled
            </TabsTrigger>
          </TabsList>

          {/* Top Rated Content */}
          <TabsContent value="top-rated" className="space-y-8 mt-6">
            {/* Top Rated Audio */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Top Rated Audio</h2>
              </div>
              {topRatedAudio.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topRatedAudio.map((audio, index) => (
                    <Card key={audio.id} className="bg-white border-gray-300 hover:border-green-400 hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {index < 3 && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">#{index + 1}</span>
                            </div>
                          )}
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                            {audio.cover_image_url ? (
                              <img src={audio.cover_image_url} alt={audio.title} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Music className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-semibold line-clamp-1">{audio.title}</h3>
                            {audio.speaker && (
                              <p className="text-gray-600 text-sm">{audio.speaker}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-bold text-sm">{audio.avgRating}</span>
                              </div>
                              <span className="text-gray-500 text-xs">({audio.ratingCount} ratings)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <Badge variant="outline" className="border-green-400 text-green-700">
                            {audio.category}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            {audio.play_count || 0} plays
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-gray-300">
                  <CardContent className="p-12 text-center">
                    <Star className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <p className="text-gray-700">No rated audio yet. Be the first to rate!</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Top Rated Videos */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Top Rated Videos</h2>
              </div>
              {topRatedVideos.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topRatedVideos.map((video, index) => (
                    <Card key={video.id} className="bg-white border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {index < 3 && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">#{index + 1}</span>
                            </div>
                          )}
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                            {video.thumbnail_url ? (
                              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Video className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-semibold line-clamp-1">{video.title}</h3>
                            {video.speaker && (
                              <p className="text-gray-600 text-sm">{video.speaker}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-bold text-sm">{video.avgRating}</span>
                              </div>
                              <span className="text-gray-500 text-xs">({video.ratingCount} ratings)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <Badge variant="outline" className="border-blue-400 text-blue-700">
                            {video.category}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {video.view_count || 0} views
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-gray-300">
                  <CardContent className="p-12 text-center">
                    <Star className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <p className="text-gray-700">No rated videos yet. Be the first to rate!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="requests" className="space-y-4 mt-6">
            {isLoadingRequests ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {pendingRequests.map(request => {
                  const CategoryIcon = getCategoryIcon(request.category);
                  return (
                    <Card key={request.id} className="bg-white border-gray-300 hover:border-orange-400 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                              <CategoryIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-gray-900 font-semibold line-clamp-2">{request.title}</h3>
                              {request.speaker_artist && (
                                <p className="text-gray-600 text-sm">by {request.speaker_artist}</p>
                              )}
                              {request.description && (
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{request.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => upvoteRequestMutation.mutate(request.id)}
                            disabled={upvoteRequestMutation.isPending}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50 flex-shrink-0"
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {request.vote_count || 0}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <Badge variant="outline" className="border-orange-400 text-orange-700">
                            {request.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(request.created_date), "MMM d, yyyy")}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Requested by {request.requester_name}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-white border-gray-300">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
                  <p className="text-gray-700">Be the first to request Islamic content!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Fulfilled Requests */}
          <TabsContent value="fulfilled" className="space-y-4 mt-6">
            {fulfilledRequests.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {fulfilledRequests.map(request => {
                  const CategoryIcon = getCategoryIcon(request.category);
                  return (
                    <Card key={request.id} className="bg-white border-green-300 hover:border-green-400 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-semibold line-clamp-2">{request.title}</h3>
                            {request.speaker_artist && (
                              <p className="text-gray-600 text-sm">by {request.speaker_artist}</p>
                            )}
                            <Badge className="mt-2 bg-green-500 text-white">
                              Fulfilled ✓
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <Badge variant="outline" className="border-green-400 text-green-700">
                            {request.category}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {request.vote_count || 0} votes
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-white border-gray-300">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Fulfilled Requests Yet</h3>
                  <p className="text-gray-700">Check back soon!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Request Form Dialog */}
        <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
          <DialogContent className="bg-white border-gray-300 text-gray-900">
            <DialogHeader>
              <DialogTitle>Submit Media Request</DialogTitle>
              <DialogDescription className="text-gray-700">
                Request Islamic content you'd like to see uploaded
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitRequest} className="space-y-4 py-4">
              <div>
                <Label className="text-gray-800">Title *</Label>
                <Input
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                  placeholder="e.g., Surah Al-Baqarah by Sheikh Sudais"
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-800">Category *</Label>
                <Select
                  value={requestForm.category}
                  onValueChange={(value) => setRequestForm({...requestForm, category: value})}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quran">Quran</SelectItem>
                    <SelectItem value="Nasheeds">Nasheeds</SelectItem>
                    <SelectItem value="Talks">Talks</SelectItem>
                    <SelectItem value="Lectures">Lectures</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-800">Speaker/Artist</Label>
                <Input
                  value={requestForm.speaker_artist}
                  onChange={(e) => setRequestForm({...requestForm, speaker_artist: e.target.value})}
                  placeholder="e.g., Sheikh Sudais"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label className="text-gray-800">Description</Label>
                <Textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                  placeholder="Additional details about your request..."
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRequestMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  {createRequestMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
