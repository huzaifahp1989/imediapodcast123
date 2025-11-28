import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, Share2, Music, Video, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PublicPlaylistCard({ playlist, type = "audio", onPlay }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: isLiked } = useQuery({
    queryKey: ['playlistLike', playlist.id, user?.email],
    queryFn: async () => {
      if (!user) return false;
      const likes = await base44.entities.PlaylistLike.filter({
        playlist_id: playlist.id,
        user_email: user.email
      });
      return likes.length > 0 ? likes[0] : null;
    },
    enabled: !!user && !!playlist.id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await base44.entities.PlaylistLike.delete(isLiked.id);
        if (type === "audio") {
          await base44.entities.Playlist.update(playlist.id, {
            like_count: Math.max(0, (playlist.like_count || 0) - 1)
          });
        } else {
          await base44.entities.VideoPlaylist.update(playlist.id, {
            like_count: Math.max(0, (playlist.like_count || 0) - 1)
          });
        }
      } else {
        await base44.entities.PlaylistLike.create({
          user_email: user.email,
          playlist_id: playlist.id,
          playlist_type: type
        });
        if (type === "audio") {
          await base44.entities.Playlist.update(playlist.id, {
            like_count: (playlist.like_count || 0) + 1
          });
        } else {
          await base44.entities.VideoPlaylist.update(playlist.id, {
            like_count: (playlist.like_count || 0) + 1
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlistLike'] });
      queryClient.invalidateQueries({ queryKey: ['publicPlaylists'] });
      toast.success(isLiked ? "Removed from liked playlists" : "Added to liked playlists");
    },
  });

  const handleShare = async () => {
    const url = `${window.location.origin}${createPageUrl("Community")}?playlist=${playlist.id}&type=${type}`;
    
    if (navigator.share) {
      await navigator.share({
        title: playlist.name,
        text: `Check out this playlist: ${playlist.name}`,
        url
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }

    // Update share count
    if (type === "audio") {
      await base44.entities.Playlist.update(playlist.id, {
        share_count: (playlist.share_count || 0) + 1
      });
    } else {
      await base44.entities.VideoPlaylist.update(playlist.id, {
        share_count: (playlist.share_count || 0) + 1
      });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  const trackCount = type === "audio" ? playlist.track_count : playlist.video_count;
  const Icon = type === "audio" ? Music : Video;

  return (
    <Card className="bg-white border-gray-200 hover:shadow-lg transition-all group overflow-hidden">
      <CardContent className="p-0">
        {/* Cover */}
        <div className="relative aspect-video bg-gradient-to-br from-emerald-500 to-teal-600">
          {playlist.cover_image_url ? (
            <img 
              src={playlist.cover_image_url} 
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="w-16 h-16 text-white/30" />
            </div>
          )}
          
          {/* Play overlay */}
          <div 
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={() => onPlay?.(playlist)}
          >
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-emerald-600 ml-1" />
            </div>
          </div>

          {/* Track count badge */}
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
            {trackCount || 0} {type === "audio" ? "tracks" : "videos"}
          </Badge>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{playlist.name}</h3>
          
          <Link 
            to={createPageUrl("UserProfile") + `?email=${encodeURIComponent(playlist.user_email)}`}
            className="text-sm text-gray-600 hover:text-emerald-600 flex items-center gap-1 mt-1"
          >
            <User className="w-3 h-3" />
            {playlist.user_name || playlist.user_email}
          </Link>

          {playlist.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{playlist.description}</p>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(playlist.total_duration)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {playlist.like_count || 0}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => likeMutation.mutate()}
              disabled={!user || likeMutation.isPending}
              className={isLiked ? "text-red-500" : "text-gray-500"}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleShare}
              className="text-gray-500"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => onPlay?.(playlist)}
              className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="w-4 h-4 mr-1" />
              Play
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}