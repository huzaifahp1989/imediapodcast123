import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function FavoriteButton({ 
  contentId, 
  contentType, // "audio" or "video"
  contentTitle,
  contentThumbnail,
  contentCategory,
  showCount = false,
  size = "default" // "default", "sm", "icon"
}) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch all favorites to check if this content is favorited and get count
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', contentId],
    queryFn: () => base44.entities.Favorite.filter({ content_id: contentId }),
    enabled: !!contentId,
  });

  const isFavorited = user && favorites.some(f => f.user_email === user.email);
  const favoriteCount = favorites.length;

  const addFavoriteMutation = useMutation({
    mutationFn: () => base44.entities.Favorite.create({
      user_email: user.email,
      content_id: contentId,
      content_type: contentType,
      content_title: contentTitle,
      content_thumbnail: contentThumbnail,
      content_category: contentCategory,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success("Added to favorites!");
    },
    onError: () => toast.error("Failed to add to favorites"),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const userFavorite = favorites.find(f => f.user_email === user.email);
      if (userFavorite) {
        await base44.entities.Favorite.delete(userFavorite.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success("Removed from favorites");
    },
    onError: () => toast.error("Failed to remove from favorites"),
  });

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Favorites are unavailable.");
      return;
    }

    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const isLoading = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  if (size === "icon") {
    return (
      <Button
        size="icon"
        variant="ghost"
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={cn(
          "rounded-full transition-all",
          isFavorited 
            ? "text-red-500 hover:text-red-600 hover:bg-red-50" 
            : "text-gray-400 hover:text-red-500 hover:bg-red-50"
        )}
      >
        <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant="ghost"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        "gap-2 transition-all",
        isFavorited 
          ? "text-red-500 hover:text-red-600 hover:bg-red-50" 
          : "text-gray-500 hover:text-red-500 hover:bg-red-50"
      )}
    >
      <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
      {showCount && favoriteCount > 0 && (
        <span className="text-sm">{favoriteCount}</span>
      )}
      {size !== "sm" && !showCount && (
        <span>{isFavorited ? "Favorited" : "Favorite"}</span>
      )}
    </Button>
  );
}
