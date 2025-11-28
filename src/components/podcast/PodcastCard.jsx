import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, User, Calendar, Download, BookOpen, Mic2, Users, Heart, Globe, Sparkles, MessageSquare, Music, Headphones } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const categoryConfig = {
  "Quran": { icon: BookOpen, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  "Hadith": { icon: MessageSquare, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "Fiqh": { icon: Users, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "Aqeedah": { icon: Heart, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  "History": { icon: Globe, color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  "Spirituality": { icon: Sparkles, color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  "General": { icon: Mic2, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "Nasheeds": { icon: Music, color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
};

export default function PodcastCard({ podcast, onPlay }) {
  const formatDuration = (seconds) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const downloadPodcast = async (e) => {
    e.stopPropagation();
    
    if (!podcast?.audio_url) {
      toast.error("No audio file available");
      return;
    }
    
    try {
      toast.info("Downloading podcast...");
      const response = await fetch(podcast.audio_url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${(podcast.title || "podcast").replace(/[^a-z0-9]/gi, '_')}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to download podcast");
      console.error("Download error:", error);
    }
  };

  if (!podcast) return null;

  const catConfig = categoryConfig[podcast.category] || { icon: Headphones, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
  const CategoryIcon = catConfig.icon;

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 backdrop-blur-sm group">
      <CardHeader className="pb-3">
        <div className="flex gap-4">
          {podcast.thumbnail_url ? (
            <img 
              src={podcast.thumbnail_url} 
              alt={podcast.title || "Podcast"}
              className="w-20 h-20 rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Headphones className="w-8 h-8 text-white" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {/* Category Badge - Prominent */}
            {podcast.category && (
              <Badge className={`mb-2 text-xs font-medium ${catConfig.color} border`}>
                <CategoryIcon className="w-3 h-3 mr-1" />
                {podcast.category}
              </Badge>
            )}
            
            <h3 className="text-base font-bold text-white mb-1 line-clamp-2">{podcast.title || "Untitled Podcast"}</h3>
            
            {/* Speaker Name - Prominent */}
            {podcast.host_name && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-purple-200 font-medium truncate">{podcast.host_name}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              onClick={() => onPlay(podcast)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg h-10 w-10"
            >
              <Play className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={downloadPodcast}
              className="border-purple-500/50 hover:bg-purple-500/20 rounded-full h-8 w-8"
            >
              <Download className="w-4 h-4 text-purple-300" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {podcast.description && (
          <p className="text-gray-300 text-sm line-clamp-2">{podcast.description}</p>
        )}
        
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          {podcast.duration && (
            <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(podcast.duration)}</span>
            </div>
          )}
          {podcast.published_date && (
            <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded-full">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(podcast.published_date), "MMM d, yyyy")}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-full text-purple-300">
            <Headphones className="w-3 h-3" />
            <span>{podcast.play_count || 0} plays</span>
          </div>
        </div>

        {podcast.tags && podcast.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {podcast.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-purple-400/50 text-purple-300">
                #{tag}
              </Badge>
            ))}
            {podcast.tags.length > 3 && (
              <Badge variant="outline" className="text-xs border-purple-400/50 text-purple-300">
                +{podcast.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}