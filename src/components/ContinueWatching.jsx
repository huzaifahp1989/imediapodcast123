import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Video,
  Music,
  Clock,
  X,
  History,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function ContinueWatching({ onVideoClick, onAudioClick }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: watchProgress = [], isLoading } = useQuery({
    queryKey: ['watch-progress', user?.email],
    queryFn: () => user ? base44.entities.WatchProgress.filter(
      { user_email: user.email, completed: false },
      '-last_watched'
    ) : [],
    enabled: !!user,
  });

  const removeProgressMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchProgress.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-progress'] });
      toast.success("Removed from history");
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const promises = watchProgress.map(p => base44.entities.WatchProgress.delete(p.id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-progress'] });
      toast.success("Cleared all history");
    },
  });

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const getRemainingTime = (item) => {
    const remaining = (item.content_duration || 0) - (item.progress_seconds || 0);
    return formatDuration(remaining);
  };

  const handleItemClick = (item) => {
    if (item.content_type === "video" && onVideoClick) {
      onVideoClick({
        id: item.content_id,
        title: item.content_title,
        thumbnail_url: item.content_thumbnail,
        category: item.content_category,
        speaker: item.content_speaker,
        duration: item.content_duration,
        startTime: item.progress_seconds,
      });
    } else if (item.content_type === "audio" && onAudioClick) {
      onAudioClick({
        id: item.content_id,
        title: item.content_title,
        cover_image_url: item.content_thumbnail,
        category: item.content_category,
        speaker: item.content_speaker,
        duration: item.content_duration,
        startTime: item.progress_seconds,
      });
    }
  };

  if (!user) return null;
  if (isLoading) return null;
  if (watchProgress.length === 0) return null;

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Continue Watching
          </CardTitle>
          {watchProgress.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
              className="text-gray-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {watchProgress.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-48 md:w-56 group cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              {/* Thumbnail with progress */}
              <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-2">
                {item.content_thumbnail ? (
                  <img
                    src={item.content_thumbnail}
                    alt={item.content_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    item.content_type === "video" 
                      ? "bg-gradient-to-br from-red-500 to-pink-500" 
                      : "bg-gradient-to-br from-green-500 to-emerald-500"
                  }`}>
                    {item.content_type === "video" ? (
                      <Video className="w-8 h-8 text-white/50" />
                    ) : (
                      <Music className="w-8 h-8 text-white/50" />
                    )}
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className={`w-10 h-10 ${
                    item.content_type === "video" ? "bg-red-600" : "bg-green-600"
                  } rounded-full flex items-center justify-center`}>
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProgressMutation.mutate(item.id);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3 text-white" />
                </button>

                {/* Time remaining */}
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {getRemainingTime(item)} left
                </div>

                {/* Type badge */}
                <Badge className={`absolute top-1 left-1 text-[10px] ${
                  item.content_type === "video" ? "bg-red-600" : "bg-green-600"
                } text-white`}>
                  {item.content_type === "video" ? <Video className="w-2.5 h-2.5" /> : <Music className="w-2.5 h-2.5" />}
                </Badge>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                  <div 
                    className={`h-full ${item.content_type === "video" ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${item.progress_percentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div>
                <h4 className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.content_title}
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {item.content_speaker || item.content_category} • {formatTimeAgo(item.last_watched)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper hook to save watch progress
export function useSaveWatchProgress() {
  const queryClient = useQueryClient();

  const saveProgress = async (user, content, currentTime, duration, contentType) => {
    if (!user || !content?.id || !duration) return;

    const percentage = Math.round((currentTime / duration) * 100);
    const completed = percentage >= 95;

    try {
      // Check if progress exists
      const existing = await base44.entities.WatchProgress.filter({
        user_email: user.email,
        content_id: content.id,
      });

      const progressData = {
        user_email: user.email,
        content_id: content.id,
        content_type: contentType,
        content_title: content.title,
        content_thumbnail: content.thumbnail_url || content.cover_image_url,
        content_category: content.category,
        content_speaker: content.speaker,
        content_duration: duration,
        progress_seconds: Math.floor(currentTime),
        progress_percentage: percentage,
        completed,
        last_watched: new Date().toISOString(),
      };

      if (existing.length > 0) {
        await base44.entities.WatchProgress.update(existing[0].id, progressData);
      } else {
        await base44.entities.WatchProgress.create(progressData);
      }

      queryClient.invalidateQueries({ queryKey: ['watch-progress'] });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  return { saveProgress };
}