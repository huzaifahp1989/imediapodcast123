import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Download, 
  Calendar, 
  Clock, 
  User,
  Edit,
  Save,
  X,
  Share2,
  Headphones,
  ChevronLeft,
  Mic
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const islamicCategories = [
  "General",
  "Quran",
  "Hadith",
  "Fiqh",
  "Aqeedah",
  "History",
  "Spirituality",
];

export default function Episode() {
  const urlParams = new URLSearchParams(window.location.search);
  const episodeId = urlParams.get('id');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const queryClient = useQueryClient();

  const { data: episode, isLoading } = useQuery({
    queryKey: ['podcast', episodeId],
    queryFn: async () => {
      const podcasts = await base44.entities.Podcast.list();
      return podcasts.find(p => p.id === episodeId);
    },
    enabled: !!episodeId,
  });

  const { data: relatedEpisodes } = useQuery({
    queryKey: ['relatedPodcasts', episode?.category],
    queryFn: async () => {
      if (!episode?.category) return [];
      const podcasts = await base44.entities.Podcast.filter({ 
        category: episode.category,
        status: 'published'
      }, '-published_date');
      return podcasts.filter(p => p.id !== episodeId).slice(0, 3);
    },
    enabled: !!episode?.category,
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Podcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setIsEditing(false);
      toast.success("Episode updated!");
    },
  });

  const playCountMutation = useMutation({
    mutationFn: ({ id, play_count }) => 
      base44.entities.Podcast.update(id, { play_count: play_count + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
    },
  });

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEdit = () => {
    setEditForm({
      title: episode.title,
      description: episode.description || "",
      category: episode.category || "General",
      guest_names: episode.guest_names ? episode.guest_names.join(', ') : "",
      tags: episode.tags ? episode.tags.join(', ') : "",
      series: episode.series || "",
      season: episode.season || "",
      episode_number: episode.episode_number || "",
      status: episode.status,
      pinned_to_front: episode.pinned_to_front,
      show_notes: episode.show_notes || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const updateData = {
      ...editForm,
      guest_names: editForm.guest_names ? editForm.guest_names.split(',').map(n => n.trim()) : [],
      tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
      season: editForm.season ? parseInt(editForm.season) : null,
      episode_number: editForm.episode_number ? parseInt(editForm.episode_number) : null,
    };
    
    updateMutation.mutate({ id: episodeId, data: updateData });
  };

  const handlePlay = () => {
    playCountMutation.mutate({ 
      id: episode.id, 
      play_count: episode.play_count || 0 
    });
  };

  const handleDownload = async () => {
    try {
      toast.info("Downloading...");
      const response = await fetch(episode.audio_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${episode.slug || episode.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: episode.title,
        text: episode.description,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-white border-gray-300 max-w-md">
          <CardContent className="p-12 text-center">
            <Headphones className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Episode not found</h3>
            <Link to={createPageUrl("Library")}>
              <Button className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Back to Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link to={createPageUrl("Library")}>
          <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </Link>

        <Card className="bg-white border-gray-300 shadow-xl">
          <CardContent className="p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                {episode.status === 'draft' && (
                  <Badge className="bg-yellow-500 text-white">Draft</Badge>
                )}
                {episode.pinned_to_front && (
                  <Badge className="bg-pink-500 text-white">Featured</Badge>
                )}
                {episode.category && (
                  <Badge variant="outline" className="border-blue-400 text-blue-700">
                    {episode.category}
                  </Badge>
                )}
                {episode.series && (
                  <Badge variant="outline" className="border-gray-400 text-gray-700">
                    {episode.series}
                  </Badge>
                )}
                {episode.episode_number && (
                  <Badge variant="outline" className="border-gray-400 text-gray-700">
                    Episode {episode.episode_number}
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={isEditing ? () => setIsEditing(false) : handleEdit}
                className="text-gray-600 hover:text-gray-900"
              >
                {isEditing ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
              </Button>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-800">Title</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-800">Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 h-24"
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Islamic Topic</Label>
                  <Select 
                    value={editForm.category} 
                    onValueChange={(value) => setEditForm({...editForm, category: value})}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {islamicCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-800">Guests</Label>
                    <Input
                      value={editForm.guest_names}
                      onChange={(e) => setEditForm({...editForm, guest_names: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-800">Tags</Label>
                    <Input
                      value={editForm.tags}
                      onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editForm.status === 'published'}
                      onCheckedChange={(checked) => setEditForm({
                        ...editForm, 
                        status: checked ? 'published' : 'draft'
                      })}
                    />
                    <Label className="text-gray-800">Published</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editForm.pinned_to_front}
                      onCheckedChange={(checked) => setEditForm({
                        ...editForm, 
                        pinned_to_front: checked
                      })}
                    />
                    <Label className="text-gray-800">Pin to Front</Label>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSave}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <>
                {/* Modern Simple Player Design */}
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 mb-6 md:mb-8">
                  {/* Simple Icon - No Featured Image */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    {/* Title */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
                      {episode.title}
                    </h1>
                    
                    {/* Speaker Name */}
                    <div className="flex items-center gap-2 text-lg text-gray-700 mb-2">
                      <User className="w-5 h-5" />
                      <span className="font-medium">{episode.host_name || "Unknown Host"}</span>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {episode.published_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(episode.published_date), "MMMM d, yyyy")}
                        </div>
                      )}
                      {episode.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(episode.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {episode.guest_names && episode.guest_names.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      with {episode.guest_names.join(', ')}
                    </span>
                  </div>
                )}
                
                {episode.description && (
                  <div 
                    className="text-gray-700 mb-6 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: episode.description }}
                  />
                )}
                
                {episode.tags && episode.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {episode.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="border-gray-400 text-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {episode.audio_url && (
                  <div className="space-y-3">
                    <audio 
                      controls 
                      className="w-full"
                      src={episode.audio_url}
                      onPlay={handlePlay}
                      style={{ height: '54px' }}
                    />
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleDownload}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        onClick={handleShare}
                        variant="outline"
                        className="border-gray-400 text-gray-700 hover:bg-gray-100"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Show Notes */}
        {episode.show_notes && !isEditing && (
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Show Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray max-w-none text-gray-700">
                <ReactMarkdown>{episode.show_notes}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Episodes */}
        {relatedEpisodes.length > 0 && (
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">More from {episode.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatedEpisodes.map((related) => (
                  <Link 
                    key={related.id} 
                    to={createPageUrl("Episode") + `?id=${related.id}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-all border border-gray-200 hover:border-blue-400">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-gray-900 font-semibold line-clamp-1 group-hover:text-blue-700">
                          {related.title}
                        </h4>
                        <p className="text-sm text-gray-600">{related.host_name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(related.duration)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}