import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Heart, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CommentsSection({ episodeId }) {
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => {
      setUser(user);
      setGuestName(user.full_name || "");
      setGuestEmail(user.email || "");
    }).catch(() => {});
  }, []);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', episodeId],
    queryFn: () => base44.entities.Comment.filter({ 
      podcast_id: episodeId,
      status: 'approved'
    }, '-created_date'),
    enabled: !!episodeId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data) => {
      const comment = await base44.entities.Comment.create(data);
      
      // Update comment count
      const podcasts = await base44.entities.Podcast.list();
      const podcast = podcasts.find(p => p.id === episodeId);
      if (podcast) {
        await base44.entities.Podcast.update(episodeId, {
          comment_count: (podcast.comment_count || 0) + 1
        });
      }
      
      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setCommentText("");
      toast.success("Comment posted!");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      toast.error("Please enter your name and email");
      return;
    }

    createCommentMutation.mutate({
      podcast_id: episodeId,
      user_name: user ? user.full_name : guestName,
      user_email: user ? user.email : guestEmail,
      content: commentText,
      is_host_reply: false,
      status: 'approved'
    });
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments & Q&A
          <Badge className="ml-auto">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
          <Label className="text-purple-300">Leave a comment or ask a question</Label>
          
          {!user && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-slate-900/50 border-purple-500/30 text-white"
                />
              </div>
              <div>
                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Your Email"
                  className="bg-slate-900/50 border-purple-500/30 text-white"
                />
              </div>
            </div>
          )}
          
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts, ask questions, or leave feedback..."
            className="bg-slate-900/50 border-purple-500/30 text-white h-24"
          />
          
          <Button
            type="submit"
            disabled={createCommentMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="w-4 h-4 mr-2" />
            {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </form>

        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-purple-300 mt-2 text-sm">Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div 
                key={comment.id}
                className="p-4 bg-slate-900/30 rounded-lg border border-purple-500/20"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">{comment.user_name}</span>
                      {comment.is_host_reply && (
                        <Badge className="bg-purple-500 text-white text-xs">Host</Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {format(new Date(comment.created_date), "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 mb-2">{comment.content}</p>
                    
                    {comment.voice_note_url && (
                      <audio controls className="w-full max-w-md mt-2" src={comment.voice_note_url} />
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-purple-400 transition-colors">
                        <Heart className="w-4 h-4" />
                        {comment.like_count || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
            <p className="text-purple-300">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}