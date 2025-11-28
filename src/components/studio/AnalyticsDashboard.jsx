import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Eye,
  Play,
  Heart,
  Share2,
  Download,
  TrendingUp,
  TrendingDown,
  Video,
  Music,
  Calendar,
} from "lucide-react";

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function AnalyticsDashboard({ videos = [], audios = [], favorites = [], ratings = [] }) {
  const [timeRange, setTimeRange] = useState("7d");

  // Calculate total stats
  const totalVideoViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0);
  const totalAudioPlays = audios.reduce((sum, a) => sum + (a.play_count || 0), 0);
  const totalLikes = favorites.length;
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 0;

  // Generate mock trend data (in real app, this would come from actual analytics)
  const generateTrendData = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: Math.floor(Math.random() * 100) + 20 + (i * 5),
        plays: Math.floor(Math.random() * 80) + 15 + (i * 3),
        likes: Math.floor(Math.random() * 20) + 5,
      };
    });
  };

  const trendData = generateTrendData();

  // Category distribution
  const getCategoryDistribution = () => {
    const categories = {};
    [...videos, ...audios].forEach(item => {
      const cat = item.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const categoryData = getCategoryDistribution();

  // Top performing content
  const topVideos = [...videos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
  const topAudios = [...audios].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 5);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList className="bg-slate-800 h-8">
            <TabsTrigger value="7d" className="text-xs data-[state=active]:bg-purple-600">7 Days</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs data-[state=active]:bg-purple-600">30 Days</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs data-[state=active]:bg-purple-600">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Eye className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                +12%
              </Badge>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white mt-2">{formatNumber(totalVideoViews)}</p>
            <p className="text-xs text-blue-300">Video Views</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Play className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
              <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                +8%
              </Badge>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white mt-2">{formatNumber(totalAudioPlays)}</p>
            <p className="text-xs text-green-300">Audio Plays</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 border-pink-500/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-pink-400" />
              <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                +15%
              </Badge>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white mt-2">{formatNumber(totalLikes)}</p>
            <p className="text-xs text-pink-300">Total Likes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-white mt-2">{avgRating}⭐</p>
            <p className="text-xs text-yellow-300">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Performance Over Time */}
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader className="p-3 md:p-4 pb-0">
            <CardTitle className="text-white text-sm md:text-base">Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="plays" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Views</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Plays</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-pink-500 rounded-full"></span> Likes</span>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader className="p-3 md:p-4 pb-0">
            <CardTitle className="text-white text-sm md:text-base">Content by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Videos */}
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader className="p-3 md:p-4 pb-2">
            <CardTitle className="text-white text-sm md:text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-red-400" />
              Top Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="space-y-2">
              {topVideos.length > 0 ? topVideos.map((video, idx) => (
                <div key={video.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                  <span className="text-purple-400 font-bold text-sm w-5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs md:text-sm truncate">{video.title}</p>
                    <p className="text-gray-400 text-[10px]">{video.category}</p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">
                    <Eye className="w-2.5 h-2.5 mr-0.5" />
                    {formatNumber(video.view_count || 0)}
                  </Badge>
                </div>
              )) : (
                <p className="text-gray-500 text-sm text-center py-4">No videos yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Audios */}
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader className="p-3 md:p-4 pb-2">
            <CardTitle className="text-white text-sm md:text-base flex items-center gap-2">
              <Music className="w-4 h-4 text-green-400" />
              Top Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="space-y-2">
              {topAudios.length > 0 ? topAudios.map((audio, idx) => (
                <div key={audio.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                  <span className="text-purple-400 font-bold text-sm w-5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs md:text-sm truncate">{audio.title}</p>
                    <p className="text-gray-400 text-[10px]">{audio.category}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 text-[10px]">
                    <Play className="w-2.5 h-2.5 mr-0.5" />
                    {formatNumber(audio.play_count || 0)}
                  </Badge>
                </div>
              )) : (
                <p className="text-gray-500 text-sm text-center py-4">No audio yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}