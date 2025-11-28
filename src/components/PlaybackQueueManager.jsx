import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  ListMusic,
  Video,
  Music,
  Clock,
  GripVertical,
  Trash2,
  Plus,
  Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function PlaybackQueueManager({ 
  isOpen, 
  onOpenChange,
  currentItem,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onItemClick,
}) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: queue, isLoading } = useQuery({
    queryKey: ['playback-queue', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const queues = await base44.entities.PlaybackQueue.filter({
        user_email: user.email,
        is_active: true,
      });
      return queues[0] || null;
    },
    enabled: !!user,
  });

  const updateQueueMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlaybackQueue.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playback-queue'] });
    },
  });

  const createQueueMutation = useMutation({
    mutationFn: (data) => base44.entities.PlaybackQueue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playback-queue'] });
    },
  });

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!queue?.items) return 0;
    return queue.items.reduce((acc, item) => acc + (item.content_duration || 0), 0);
  };

  const handleReorder = (result) => {
    if (!result.destination || !queue) return;

    const items = Array.from(queue.items);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);

    updateQueueMutation.mutate({
      id: queue.id,
      data: { items },
    });
  };

  const handleRemoveItem = (index) => {
    if (!queue) return;

    const items = queue.items.filter((_, i) => i !== index);
    let newIndex = queue.current_index;
    
    if (index < queue.current_index) {
      newIndex = Math.max(0, newIndex - 1);
    } else if (index === queue.current_index && index >= items.length) {
      newIndex = Math.max(0, items.length - 1);
    }

    updateQueueMutation.mutate({
      id: queue.id,
      data: { items, current_index: newIndex },
    });
    toast.success("Removed from queue");
  };

  const handleClearQueue = () => {
    if (!queue) return;

    updateQueueMutation.mutate({
      id: queue.id,
      data: { items: [], current_index: 0 },
    });
    toast.success("Queue cleared");
  };

  const handleShuffle = () => {
    if (!queue?.items || queue.items.length < 2) return;

    const items = [...queue.items];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    updateQueueMutation.mutate({
      id: queue.id,
      data: { items, current_index: 0 },
    });
    toast.success("Queue shuffled");
  };

  const handlePlayItem = (index) => {
    if (!queue) return;

    updateQueueMutation.mutate({
      id: queue.id,
      data: { current_index: index },
    });

    const item = queue.items[index];
    if (onItemClick) {
      onItemClick({
        id: item.content_id,
        title: item.content_title,
        thumbnail_url: item.content_thumbnail,
        duration: item.content_duration,
        type: item.content_type,
      });
    }
  };

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ListMusic className="w-4 h-4" />
          Queue
          {queue?.items?.length > 0 && (
            <Badge className="ml-1 bg-blue-600 text-white text-xs px-1.5">
              {queue.items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ListMusic className="w-5 h-5" />
              Playback Queue
            </span>
            {queue?.items?.length > 0 && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleShuffle} title="Shuffle">
                  <Shuffle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleClearQueue} title="Clear">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Now Playing */}
        {currentItem && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-2">NOW PLAYING</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                {currentItem.thumbnail_url ? (
                  <img src={currentItem.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
                    {currentItem.type === "video" ? (
                      <Video className="w-5 h-5 text-white" />
                    ) : (
                      <Music className="w-5 h-5 text-white" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                  {currentItem.title}
                </h4>
                <p className="text-xs text-gray-500">
                  {formatDuration(currentItem.duration)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onPrevious} className="h-8 w-8">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  onClick={isPlaying ? onPause : onPlay}
                  className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8">
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Queue Stats */}
        {queue?.items?.length > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span>{queue.items.length} items</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(getTotalDuration())} total
            </span>
          </div>
        )}

        {/* Queue Items */}
        <div className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading queue...</div>
          ) : queue?.items?.length > 0 ? (
            <DragDropContext onDragEnd={handleReorder}>
              <Droppable droppableId="queue">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {queue.items.map((item, index) => (
                      <Draggable key={`${item.content_id}-${index}`} draggableId={`${item.content_id}-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                              index === queue.current_index
                                ? "bg-blue-50 border-blue-300"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                          >
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>

                            <span className="text-xs text-gray-400 w-5">{index + 1}</span>

                            <div 
                              className="w-10 h-10 rounded overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer"
                              onClick={() => handlePlayItem(index)}
                            >
                              {item.content_thumbnail ? (
                                <img src={item.content_thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center ${
                                  item.content_type === "video"
                                    ? "bg-gradient-to-br from-red-500 to-pink-500"
                                    : "bg-gradient-to-br from-green-500 to-emerald-500"
                                }`}>
                                  {item.content_type === "video" ? (
                                    <Video className="w-4 h-4 text-white" />
                                  ) : (
                                    <Music className="w-4 h-4 text-white" />
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePlayItem(index)}>
                              <h4 className="text-xs font-medium text-gray-900 line-clamp-1">
                                {item.content_title}
                              </h4>
                              <p className="text-[10px] text-gray-500">
                                {formatDuration(item.content_duration)}
                              </p>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="h-7 w-7 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
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
            <div className="text-center py-12">
              <ListMusic className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 text-sm">Your queue is empty</p>
              <p className="text-gray-500 text-xs mt-1">Add items to play them in sequence</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Hook to manage queue operations
export function usePlaybackQueue() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const addToQueue = async (content, contentType) => {
    if (!user) {
      toast.error("Queue is unavailable.");
      return;
    }

    try {
      // Get or create queue
      let queues = await base44.entities.PlaybackQueue.filter({
        user_email: user.email,
        is_active: true,
      });

      let queue = queues[0];

      const newItem = {
        content_id: content.id,
        content_type: contentType,
        content_title: content.title,
        content_thumbnail: content.thumbnail_url || content.cover_image_url,
        content_duration: content.duration || 0,
        added_at: new Date().toISOString(),
      };

      if (queue) {
        // Check if already in queue
        if (queue.items?.some(i => i.content_id === content.id)) {
          toast.info("Already in queue");
          return;
        }

        await base44.entities.PlaybackQueue.update(queue.id, {
          items: [...(queue.items || []), newItem],
        });
      } else {
        await base44.entities.PlaybackQueue.create({
          user_email: user.email,
          name: "My Queue",
          items: [newItem],
          current_index: 0,
          is_active: true,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['playback-queue'] });
      toast.success("Added to queue");
    } catch (error) {
      console.error("Failed to add to queue:", error);
      toast.error("Failed to add to queue");
    }
  };

  const playNext = async (content, contentType) => {
    if (!user) {
      toast.error("Queue is unavailable.");
      return;
    }

    try {
      let queues = await base44.entities.PlaybackQueue.filter({
        user_email: user.email,
        is_active: true,
      });

      let queue = queues[0];

      const newItem = {
        content_id: content.id,
        content_type: contentType,
        content_title: content.title,
        content_thumbnail: content.thumbnail_url || content.cover_image_url,
        content_duration: content.duration || 0,
        added_at: new Date().toISOString(),
      };

      if (queue) {
        const items = [...(queue.items || [])];
        // Insert after current index
        items.splice(queue.current_index + 1, 0, newItem);
        
        await base44.entities.PlaybackQueue.update(queue.id, { items });
      } else {
        await base44.entities.PlaybackQueue.create({
          user_email: user.email,
          name: "My Queue",
          items: [newItem],
          current_index: 0,
          is_active: true,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['playback-queue'] });
      toast.success("Will play next");
    } catch (error) {
      console.error("Failed to add to queue:", error);
      toast.error("Failed to add to queue");
    }
  };

  return { addToQueue, playNext };
}
