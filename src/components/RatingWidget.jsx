import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RatingWidget({ contentId, contentType, contentTitle }) {
  const [user, setUser] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null));
  }, []);

  const { data: userRating } = useQuery({
    queryKey: ['userRating', contentId, user?.email],
    queryFn: async () => {
      if (!user) return null;
      const ratings = await base44.entities.Rating.filter({
        content_id: contentId,
        user_email: user.email
      });
      return ratings[0] || null;
    },
    enabled: !!user && !!contentId,
  });

  const { data: allRatings } = useQuery({
    queryKey: ['ratings', contentId],
    queryFn: () => base44.entities.Rating.filter({ content_id: contentId }),
    enabled: !!contentId,
    initialData: [],
  });

  const rateMutation = useMutation({
    mutationFn: async (data) => {
      if (userRating) {
        await base44.entities.Rating.update(userRating.id, data);
      } else {
        await base44.entities.Rating.create({
          ...data,
          content_id: contentId,
          content_type: contentType,
          user_email: user.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['userRating'] });
      queryClient.invalidateQueries({ queryKey: ['all-ratings'] });
      toast.success("✅ Rating submitted!");
      setShowRatingDialog(false);
      setReview("");
    },
  });

  const avgRating = allRatings.length > 0
    ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1)
    : 0;

  const handleSubmitRating = () => {
    if (selectedRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    rateMutation.mutate({
      rating: selectedRating,
      review: review.trim() || null,
    });
  };

  useEffect(() => {
    if (userRating) {
      setSelectedRating(userRating.rating);
      setReview(userRating.review || "");
    }
  }, [userRating]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= avgRating
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-700 font-medium">
        {avgRating} ({allRatings.length})
      </span>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (!user) {
            toast.error("Rating is unavailable.");
            return;
          }
          setShowRatingDialog(true);
        }}
        className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
      >
        {userRating ? "Update Rating" : "Rate"}
      </Button>

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="bg-white border-gray-300 text-gray-900">
          <DialogHeader>
            <DialogTitle>Rate {contentTitle}</DialogTitle>
            <DialogDescription className="text-gray-700">
              Share your rating and optional review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-800 mb-2 block">Your Rating *</Label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setSelectedRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || selectedRating)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                {selectedRating === 0 && "Click to rate"}
                {selectedRating === 1 && "Poor"}
                {selectedRating === 2 && "Fair"}
                {selectedRating === 3 && "Good"}
                {selectedRating === 4 && "Very Good"}
                {selectedRating === 5 && "Excellent"}
              </p>
            </div>

            <div>
              <Label className="text-gray-800">Review (Optional)</Label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts about this content..."
                className="bg-white border-gray-300 text-gray-900 h-24"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRatingDialog(false)}
                className="flex-1 border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={rateMutation.isPending}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {rateMutation.isPending ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
