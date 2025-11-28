import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Send, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CommentsWidget({ contentId, contentType }) {
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null));
  }, []);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', contentId],
    queryFn: () => base44.entities.ContentComment.filter({ 
      content_id: contentId
    }, '-created_date'),
    enabled: !!contentId,
    initialData: [],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ContentComment.create({
        ...data,
        content_id: contentId,
        content_type: contentType,
        user_email: user.email,
        user_name: user.full_name || user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success("💬 Comment posted!");
      setCommentText("");
      setReplyingTo(null);
    },
  });

  const handleSubmitComment = () => {
    if (!user) {
      toast.error("Commenting is unavailable.");
      return;
    }
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    addCommentMutation.mutate({
      comment: commentText.trim(),
      parent_comment_id: replyingTo?.id || null,
    });
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  return (
    <Card className="bg-white border-gray-300 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        {replyingTo && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-blue-900">
              Replying to <strong>{replyingTo.user_name}</strong>
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
              className="text-blue-700"
            >
              Cancel
            </Button>
          </div>
        )}
        
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? "Share your thoughts..." : "Commenting requires user access"}
              className="bg-white border-gray-300 text-gray-900 min-h-[80px]"
              disabled={!user}
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSubmitComment}
                disabled={!user || !commentText.trim() || addCommentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-600">Loading comments...</div>
        ) : topLevelComments.length > 0 ? (
          <div className="space-y-4">
            {topLevelComments.map((comment) => {
              const replies = getReplies(comment.id);
              return (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{comment.user_name}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.created_date), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-blue-700 h-7 px-2"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {comment.like_count || 0}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyingTo(comment)}
                            className="text-gray-600 hover:text-blue-700 h-7 px-2"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="ml-12 space-y-3">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-900 text-sm">{reply.user_name}</span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(reply.created_date), "MMM d 'at' h:mm a")}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">{reply.comment}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-600 hover:text-blue-700 h-6 px-2 text-xs"
                                >
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  {reply.like_count || 0}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <p className="text-gray-600">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
