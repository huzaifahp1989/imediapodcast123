import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Video, Music, Heart } from "lucide-react";
import FollowButton from "./FollowButton";

export default function UserCard({ 
  userEmail, 
  userName, 
  uploadCount = 0, 
  favoriteCount = 0,
  followerCount = 0,
  showFollow = true 
}) {
  const initials = (userName || userEmail || "U").slice(0, 2).toUpperCase();

  return (
    <Card className="bg-white border-gray-200 hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("UserProfile") + `?email=${encodeURIComponent(userEmail)}`}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
              {initials}
            </div>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link 
              to={createPageUrl("UserProfile") + `?email=${encodeURIComponent(userEmail)}`}
              className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-1"
            >
              {userName || userEmail}
            </Link>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              {uploadCount > 0 && (
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  {uploadCount}
                </span>
              )}
              {favoriteCount > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {favoriteCount}
                </span>
              )}
              {followerCount > 0 && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {followerCount} followers
                </span>
              )}
            </div>
          </div>

          {showFollow && (
            <FollowButton 
              targetEmail={userEmail} 
              targetName={userName} 
              size="sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}