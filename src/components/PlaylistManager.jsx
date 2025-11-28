import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  X,
  Save,
  Loader2,
  Play,
  Music,
  Video,
  ListMusic,
  MoreVertical,
  Clock,
  Globe,
  Lock,
  Share2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function PlaylistManager({ 
  type = "audio", // "audio" or "video"
  userEmail,
  playlists = [],
  allContent = [],
  onPlaylistClick,
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistForm, setPlaylistForm] = useState({ name: "", description: "", is_public: false });
  
  const queryClient = useQueryClient();
  
  const entityName = type === "video" ? "VideoPlaylist" : "Playlist";
  const contentIdField = type === "video" ? "video_ids" : "audio_ids";
  const countField = type === "video" ? "video_count" : "track_count";
  const ContentIcon = type === "video" ? Video : Music;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const playlistData = {
        ...data,
        user_email: userEmail,
        user_name: userEmail.split('@')[0],
        [contentIdField]: [],
        [countField]: 0,
        total_duration: 0,
        like_count: 0,
        share_count: 0,
      };
      return await base44.entities[entityName].create(playlistData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`user-${type === 'video' ? 'video-playlists' : 'playlists'}`] });
      queryClient.invalidateQueries({ queryKey: ['publicPlaylists'] });
      toast.success("✅ Playlist created!");
      setShowCreateDialog(false);
      setPlaylistForm({ name: "", description: "", is_public: false });
    },
    onError: (error) => toast.error("Failed to create playlist: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities[entityName].update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`user-${type === 'video' ? 'video-playlists' : 'playlists'}`] });
      toast.success("✅ Playlist updated!");
      setShowEditDialog(false);
      setShowManageDialog(false);
      setSelectedPlaylist(null);
    },
    onError: (error) => toast.error("Failed to update playlist: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities[entityName].delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`user-${type === 'video' ? 'video-playlists' : 'playlists'}`] });
      toast.success("Playlist deleted!");
      setShowManageDialog(false);
      setSelectedPlaylist(null);
    },
    onError: (error) => toast.error("Failed to delete playlist: " + error.message),
  });

  const handleEdit = (playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistForm({ 
      name: playlist.name, 
      description: playlist.description || "",
      is_public: playlist.is_public || false
    });
    setShowEditDialog(true);
  };

  const handleShare = async (playlist) => {
    const url = `${window.location.origin}/Community?playlist=${playlist.id}&type=${type}`;
    
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
    await base44.entities[entityName].update(playlist.id, {
      share_count: (playlist.share_count || 0) + 1
    });
  };

  const handleManage = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowManageDialog(true);
  };

  const handleSaveEdit = () => {
    if (!playlistForm.name) {
      toast.error("Playlist name is required");
      return;
    }
    updateMutation.mutate({
      id: selectedPlaylist.id,
      data: { 
        name: playlistForm.name, 
        description: playlistForm.description,
        is_public: playlistForm.is_public
      },
    });
  };

  const handleDelete = (playlist) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      deleteMutation.mutate(playlist.id);
    }
  };

  const handleRemoveItem = (contentId) => {
    if (!selectedPlaylist) return;
    
    const currentIds = selectedPlaylist[contentIdField] || [];
    const newIds = currentIds.filter(id => id !== contentId);
    const content = allContent.find(c => c.id === contentId);
    const newDuration = (selectedPlaylist.total_duration || 0) - (content?.duration || 0);
    
    updateMutation.mutate({
      id: selectedPlaylist.id,
      data: {
        [contentIdField]: newIds,
        [countField]: newIds.length,
        total_duration: Math.max(0, newDuration),
      },
    });
    
    // Update local state
    setSelectedPlaylist(prev => ({
      ...prev,
      [contentIdField]: newIds,
      [countField]: newIds.length,
      total_duration: Math.max(0, newDuration),
    }));
  };

  const handleReorder = (result) => {
    if (!result.destination || !selectedPlaylist) return;
    
    const currentIds = [...(selectedPlaylist[contentIdField] || [])];
    const [removed] = currentIds.splice(result.source.index, 1);
    currentIds.splice(result.destination.index, 0, removed);
    
    updateMutation.mutate({
      id: selectedPlaylist.id,
      data: { [contentIdField]: currentIds },
    });
    
    // Update local state
    setSelectedPlaylist(prev => ({
      ...prev,
      [contentIdField]: currentIds,
    }));
  };

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

  const getPlaylistItems = (playlist) => {
    const ids = playlist[contentIdField] || [];
    return ids.map(id => allContent.find(c => c.id === id)).filter(Boolean);
  };

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New {type === "video" ? "Video" : "Audio"} Playlist
        </Button>
      </div>

      {/* Playlists Grid */}
      {playlists.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(playlist => (
            <Card key={playlist.id} className="bg-white border-gray-300 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${type === 'video' ? 'from-red-500 to-pink-500' : 'from-purple-500 to-pink-500'} flex items-center justify-center flex-shrink-0`}>
                    <ListMusic className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-semibold line-clamp-1">{playlist.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-1">{playlist.description || "No description"}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-gray-300">
                      <DropdownMenuItem onClick={() => handleManage(playlist)} className="cursor-pointer">
                        <ListMusic className="w-4 h-4 mr-2" />
                        Manage Items
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(playlist)} className="cursor-pointer">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(playlist)} className="cursor-pointer text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
                  <Badge variant="outline" className="border-gray-400 text-gray-700">
                    {playlist[countField] || 0} {type === "video" ? "videos" : "tracks"}
                  </Badge>
                  <Badge variant="outline" className="border-gray-400 text-gray-700">
                    {formatDuration(playlist.total_duration || 0)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={playlist.is_public ? "border-green-400 text-green-700" : "border-gray-400 text-gray-500"}
                  >
                    {playlist.is_public ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                    {playlist.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onPlaylistClick?.(playlist)}
                    disabled={!playlist[contentIdField] || playlist[contentIdField].length === 0}
                    className={`flex-1 ${type === 'video' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(playlist)}
                    className="border-gray-300"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white border-gray-300">
          <CardContent className="p-12 text-center">
            <ListMusic className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Playlists</h3>
            <p className="text-gray-700 mb-4">Create your first {type} playlist!</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white border-gray-300 text-gray-900">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription className="text-gray-700">
              Give your playlist a name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-800">Playlist Name *</Label>
              <Input
                value={playlistForm.name}
                onChange={(e) => setPlaylistForm({...playlistForm, name: e.target.value})}
                placeholder="My Favorites"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div>
              <Label className="text-gray-800">Description</Label>
              <Textarea
                value={playlistForm.description}
                onChange={(e) => setPlaylistForm({...playlistForm, description: e.target.value})}
                placeholder="A collection of my favorite content..."
                className="bg-white border-gray-300 text-gray-900 h-24"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                {playlistForm.is_public ? (
                  <Globe className="w-4 h-4 text-green-600" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {playlistForm.is_public ? "Public Playlist" : "Private Playlist"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {playlistForm.is_public ? "Anyone can see and play this playlist" : "Only you can see this playlist"}
                  </p>
                </div>
              </div>
              <Switch
                checked={playlistForm.is_public}
                onCheckedChange={(checked) => setPlaylistForm({...playlistForm, is_public: checked})}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setPlaylistForm({ name: "", description: "" });
                }}
                className="flex-1 border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(playlistForm)}
                disabled={!playlistForm.name || createMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border-gray-300 text-gray-900">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription className="text-gray-700">
              Update your playlist details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-800">Playlist Name *</Label>
              <Input
                value={playlistForm.name}
                onChange={(e) => setPlaylistForm({...playlistForm, name: e.target.value})}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div>
              <Label className="text-gray-800">Description</Label>
              <Textarea
                value={playlistForm.description}
                onChange={(e) => setPlaylistForm({...playlistForm, description: e.target.value})}
                className="bg-white border-gray-300 text-gray-900 h-24"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                {playlistForm.is_public ? (
                  <Globe className="w-4 h-4 text-green-600" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {playlistForm.is_public ? "Public Playlist" : "Private Playlist"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {playlistForm.is_public ? "Anyone can see and play this playlist" : "Only you can see this playlist"}
                  </p>
                </div>
              </div>
              <Switch
                checked={playlistForm.is_public}
                onCheckedChange={(checked) => setPlaylistForm({...playlistForm, is_public: checked})}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1 border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!playlistForm.name || updateMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Items Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlaylist?.name}</DialogTitle>
            <DialogDescription className="text-gray-700">
              Drag to reorder items or remove them from the playlist
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlaylist && (
            <div className="py-4">
              {getPlaylistItems(selectedPlaylist).length > 0 ? (
                <DragDropContext onDragEnd={handleReorder}>
                  <Droppable droppableId="playlist-items">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {getPlaylistItems(selectedPlaylist).map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-300 ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>
                                
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${type === 'video' ? 'from-red-500 to-pink-500' : 'from-green-500 to-emerald-500'} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                                  {(type === 'video' ? item.thumbnail_url : item.cover_image_url) ? (
                                    <img 
                                      src={type === 'video' ? item.thumbnail_url : item.cover_image_url} 
                                      alt={item.title} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <ContentIcon className="w-6 h-6 text-white" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-gray-900 font-medium line-clamp-1">{item.title}</h4>
                                  <p className="text-gray-600 text-sm">{item.speaker || item.category}</p>
                                </div>
                                
                                <Badge variant="outline" className="text-xs border-gray-400 text-gray-700 flex-shrink-0">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDuration(item.duration)}
                                </Badge>
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="hover:bg-red-100 text-red-600 flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="text-center py-8">
                  <ContentIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                  <p className="text-gray-700">No items in this playlist</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Add items from the {type === 'video' ? 'Video Library' : 'Audio'} page
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}