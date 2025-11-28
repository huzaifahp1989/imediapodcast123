import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Star, 
  MessageSquare, 
  ListMusic, 
  Video, 
  Music,
  Clock,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function ActivityFeed({ userEmail }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Get users this person is following
  const { data: following = [] } = useQuery({
    queryKey: ['following', userEmail || user?.email],
    queryFn: () => base44.entities.UserFollow.filter({ 
      follower_email: userEmail || user?.email 
    }),
    enabled: !!(userEmail || user?.email),
  });

  const followingEmails = following.map(f => f.following_email);

  // Fetch recent favorites from followed users
  const { data: recentFavorites = [] } = useQuery({
    queryKey: ['followingFavorites', followingEmails],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allFavorites = [];
      for (const email of followingEmails.slice(0, 10)) {
        const favs = await base44.entities.Favorite.filter({ user_email: email }, '-created_date', 5);
        allFavorites.push(...favs.map(f => ({ ...f, activity_type: 'favorite' })));
      }
      return allFavorites.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ).slice(0, 20);
    },
    enabled: followingEmails.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch recent ratings from followed users
  const { data: recentRatings = [] } = useQuery({
    queryKey: ['followingRatings', followingEmails],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allRatings = [];
      for (const email of followingEmails.slice(0, 10)) {
        const ratings = await base44.entities.Rating.filter({ user_email: email }, '-created_date', 5);
        allRatings.push(...ratings.map(r => ({ ...r, activity_type: 'rating' })));
      }
      return allRatings.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ).slice(0, 20);
    },
    enabled: followingEmails.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Combine and sort activities
  const activities = [...recentFavorites, ...recentRatings]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 15);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return format(date, "MMM d");
  };

  if (followingEmails.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="py-12 text-center">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Follow users to see their activity</h3>
          <p className="text-gray-600 text-sm">When you follow people, their favorites and ratings will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600" />
          Activity from People You Follow
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={`${activity.activity_type}-${activity.id}-${idx}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.activity_type === 'favorite' 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {activity.activity_type === 'favorite' ? (
                    <Heart className="w-5 h-5" />
                  ) : (
                    <Star className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <Link 
                      to={createPageUrl("UserProfile") + `?email=${encodeURIComponent(activity.user_email)}`}
                      className="font-semibold hover:text-emerald-600"
                    >
                      {activity.user_email.split('@')[0]}
                    </Link>
                    {activity.activity_type === 'favorite' ? ' favorited ' : ` rated ${activity.rating}★ `}
                    <span className="font-medium text-gray-700">
                      {activity.content_title || 'content'}
                    </span>
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.content_type === 'video' ? (
                        <><Video className="w-3 h-3 mr-1" /> Video</>
                      ) : (
                        <><Music className="w-3 h-3 mr-1" /> Audio</>
                      )}
                    </Badge>
                    <span className="text-xs text-gray-500">{formatTimeAgo(activity.created_date)}</span>
                  </div>
                </div>

                {activity.content_thumbnail && (
                  <img 
                    src={activity.content_thumbnail} 
                    alt=""
                    className="w-16 h-10 rounded object-cover flex-shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">No recent activity from people you follow</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}