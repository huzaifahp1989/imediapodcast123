import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Calendar,
  Sparkles,
  Video,
  Music,
  Upload,
  Settings,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AnalyticsDashboard from "@/components/studio/AnalyticsDashboard";
import ContentScheduler from "@/components/studio/ContentScheduler";
import AIContentAssistant from "@/components/studio/AIContentAssistant";

export default function CreatorStudio() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("analytics");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      toast.error("Creator Studio is unavailable.");
    });
  }, []);

  // Fetch user's content
  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['creator-videos', user?.email],
    queryFn: () => base44.entities.VideoPodcast.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: audios = [], isLoading: loadingAudios } = useQuery({
    queryKey: ['creator-audios', user?.email],
    queryFn: () => base44.entities.AudioContent.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  // Fetch engagement data
  const { data: favorites = [] } = useQuery({
    queryKey: ['creator-favorites', user?.email],
    queryFn: async () => {
      const videoIds = videos.map(v => v.id);
      const audioIds = audios.map(a => a.id);
      const allFavs = await base44.entities.Favorite.list();
      return allFavs.filter(f => 
        videoIds.includes(f.content_id) || audioIds.includes(f.content_id)
      );
    },
    enabled: !!user && (videos.length > 0 || audios.length > 0),
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['creator-ratings', user?.email],
    queryFn: async () => {
      const videoIds = videos.map(v => v.id);
      const audioIds = audios.map(a => a.id);
      const allRatings = await base44.entities.Rating.list();
      return allRatings.filter(r => 
        videoIds.includes(r.content_id) || audioIds.includes(r.content_id)
      );
    },
    enabled: !!user && (videos.length > 0 || audios.length > 0),
  });

  // Scheduled content (using Show entity for now)
  const { data: scheduledItems = [] } = useQuery({
    queryKey: ['scheduled-content', user?.email],
    queryFn: () => base44.entities.Show.filter({ 
      host_user_id: user?.id,
      status: 'scheduled'
    }),
    enabled: !!user,
  });

  // Schedule mutations
  const scheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.Show.create({
      ...data,
      host_user_id: user?.id,
      host_name: user?.full_name || user?.email,
      scheduled_start: data.scheduled_date,
      scheduled_end: new Date(new Date(data.scheduled_date).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries(['scheduled-content']),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => base44.entities.Show.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['scheduled-content']),
  });

  const editScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Show.update(id, {
      ...data,
      scheduled_start: data.scheduled_date,
      scheduled_end: new Date(new Date(data.scheduled_date).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries(['scheduled-content']),
  });

  const isLoading = loadingVideos || loadingAudios;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-purple-500/30 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-purple-300">Loading Creator Studio...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              Creator Studio
            </h1>
            <p className="text-purple-300 text-sm md:text-base mt-1">
              Manage your content, track performance, and grow your audience
            </p>
          </div>

          <div className="flex gap-2">
            <Link to={createPageUrl("VideoPodcast")}>
              <Button className="bg-red-600 hover:bg-red-700 text-sm">
                <Video className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </Link>
            <Link to={createPageUrl("Audio")}>
              <Button className="bg-green-600 hover:bg-green-700 text-sm">
                <Music className="w-4 h-4 mr-2" />
                Upload Audio
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-slate-900/50 border-blue-500/30">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{videos.length}</p>
                  <p className="text-xs text-blue-300">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-green-500/30">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <Music className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{audios.length}</p>
                  <p className="text-xs text-green-300">Audios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-pink-500/30">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-pink-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{favorites.length}</p>
                  <p className="text-xs text-pink-300">Likes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-yellow-500/30">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{scheduledItems.length}</p>
                  <p className="text-xs text-yellow-300">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 bg-slate-800 h-10 md:h-11">
            <TabsTrigger 
              value="analytics" 
              className="text-xs md:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="schedule" 
              className="text-xs md:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4 mr-1 md:mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              className="text-xs md:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Sparkles className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">AI Assistant</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-purple-300">Loading analytics...</p>
              </div>
            ) : (
              <AnalyticsDashboard 
                videos={videos} 
                audios={audios} 
                favorites={favorites}
                ratings={ratings}
              />
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <ContentScheduler
              scheduledItems={scheduledItems.map(item => ({
                ...item,
                scheduled_date: item.scheduled_start,
                type: item.type || 'live',
              }))}
              onSchedule={(data) => scheduleMutation.mutateAsync(data)}
              onDelete={(id) => deleteScheduleMutation.mutateAsync(id)}
              onEdit={(id, data) => editScheduleMutation.mutateAsync({ id, data })}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <AIContentAssistant />
              
              {/* Tips Card */}
              <Card className="bg-slate-900/50 border-purple-500/30">
                <CardHeader className="p-3 md:p-4 pb-2">
                  <CardTitle className="text-white text-sm md:text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    AI Tips for Better Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <ul className="space-y-2 text-xs md:text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300 text-[10px] mt-0.5">1</Badge>
                      <span>Be specific about your topic for better AI suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300 text-[10px] mt-0.5">2</Badge>
                      <span>Include key points you want to cover in your description</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300 text-[10px] mt-0.5">3</Badge>
                      <span>Use relevant tags to improve discoverability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300 text-[10px] mt-0.5">4</Badge>
                      <span>Regenerate multiple times to find the perfect title</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300 text-[10px] mt-0.5">5</Badge>
                      <span>Customize AI output to match your style</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
