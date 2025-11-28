import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FollowButton({ targetEmail, targetName, size = "default" }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', user?.email, targetEmail],
    queryFn: async () => {
      if (!user || user.email === targetEmail) return null;
      const follows = await base44.entities.UserFollow.filter({
        follower_email: user.email,
        following_email: targetEmail
      });
      return follows[0] || null;
    },
    enabled: !!user && !!targetEmail && user.email !== targetEmail,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.UserFollow.create({
        follower_email: user.email,
        following_email: targetEmail,
        following_name: targetName || targetEmail
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast.success(`Following ${targetName || targetEmail}`);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (followStatus) {
        await base44.entities.UserFollow.delete(followStatus.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast.success(`Unfollowed ${targetName || targetEmail}`);
    },
  });

  if (!user || user.email === targetEmail) return null;

  const isFollowing = !!followStatus;
  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Button
      size={size}
      variant={isFollowing ? "outline" : "default"}
      onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
      disabled={isLoading}
      className={isFollowing 
        ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50" 
        : "bg-emerald-600 hover:bg-emerald-700 text-white"
      }
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-1" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}