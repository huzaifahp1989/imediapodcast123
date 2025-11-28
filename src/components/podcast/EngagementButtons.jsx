import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart, Bookmark, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function EngagementButtons({ episode, onCommentClick }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: engagement } = useQuery({
    queryKey: ['engagement', episode.id, user?.email],
    queryFn: async () => {
      if (!user) return null;
      const engagements = await base44.entities.UserEngagement.filter({
        user_email: user.email,
        podcast_id: episode.id
      });
      return engagements[0] || null;
    },
    enabled: !!user && !!episode.id,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Likes are unavailable.");
        return;
      }

      const newLikedState = !engagement?.liked;
      const newLikeCount = episode.like_count + (newLikedState ? 1 : -1);

      if (engagement) {
        await base44.entities.UserEngagement.update(engagement.id, {
          liked: newLikedState
        });
      } else {
        await base44.entities.UserEngagement.create({
          user_email: user.email,
          podcast_id: episode.id,
          liked: true
        });
      }

      await base44.entities.Podcast.update(episode.id, {
        like_count: newLikeCount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
    }
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Saves are unavailable.");
        return;
      }

      const newSavedState = !engagement?.saved;
      const newSaveCount = episode.save_count + (newSavedState ? 1 : -1);

      if (engagement) {
        await base44.entities.UserEngagement.update(engagement.id, {
          saved: newSavedState
        });
      } else {
        await base44.entities.UserEngagement.create({
          user_email: user.email,
          podcast_id: episode.id,
          saved: true
        });
      }

      await base44.entities.Podcast.update(episode.id, {
        save_count: newSaveCount
      });

      toast.success(newSavedState ? "Episode saved!" : "Episode unsaved");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
    }
  });

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleLikeMutation.mutate()}
        disabled={toggleLikeMutation.isPending}
        className={`${
          engagement?.liked
            ? 'bg-red-500/20 border-red-500 text-red-400'
            : 'border-purple-500/50 text-purple-300 hover:bg-purple-500/20'
        }`}
      >
        <Heart className={`w-4 h-4 mr-2 ${engagement?.liked ? 'fill-red-400' : ''}`} />
        {episode.like_count || 0}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleSaveMutation.mutate()}
        disabled={toggleSaveMutation.isPending}
        className={`${
          engagement?.saved
            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
            : 'border-purple-500/50 text-purple-300 hover:bg-purple-500/20'
        }`}
      >
        <Bookmark className={`w-4 h-4 mr-2 ${engagement?.saved ? 'fill-blue-400' : ''}`} />
        {episode.save_count || 0}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onCommentClick}
        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {episode.comment_count || 0}
      </Button>
    </div>
  );
}
