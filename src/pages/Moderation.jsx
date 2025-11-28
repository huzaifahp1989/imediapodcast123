import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  Flag,
  User,
  FileText,
  Video as VideoIcon,
  Music,
  MessageSquare,
  Search,
  Filter,
  TrendingUp,
  Loader2,
  ExternalLink,
  Edit,
  Save
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

const flagReasons = [
  "Inappropriate Content",
  "Copyright Violation",
  "Spam or Misleading",
  "Hate Speech",
  "Violence or Graphic Content",
  "False Information",
  "Other"
];

export default function Moderation() {
  const [user, setUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedContentType, setSelectedContentType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showUserTrustDialog, setShowUserTrustDialog] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me()
      .then(currentUser => {
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          toast.error("Access denied. Admin privileges required.");
        }
      })
      .catch(() => {
        toast.error("Moderation is unavailable.");
      });
  }, []);

  const { data: moderationQueue, isLoading } = useQuery({
    queryKey: ['moderation', selectedStatus, selectedContentType],
    queryFn: async () => {
      let query = { status: selectedStatus };
      if (selectedContentType !== "all") {
        query.content_type = selectedContentType;
      }
      return await base44.entities.ContentModeration.filter(query, '-created_date');
    },
    enabled: !!user && user.role === 'admin',
    initialData: [],
  });

  const { data: stats } = useQuery({
    queryKey: ['moderation-stats'],
    queryFn: async () => {
      const all = await base44.entities.ContentModeration.list();
      return {
        pending: all.filter(m => m.status === 'pending').length,
        flagged: all.filter(m => m.status === 'flagged').length,
        under_review: all.filter(m => m.status === 'under_review').length,
        approved_today: all.filter(m => {
          if (m.status !== 'approved' || !m.reviewed_date) return false;
          const today = new Date().toDateString();
          return new Date(m.reviewed_date).toDateString() === today;
        }).length,
        rejected_today: all.filter(m => {
          if (m.status !== 'rejected' || !m.reviewed_date) return false;
          const today = new Date().toDateString();
          return new Date(m.reviewed_date).toDateString() === today;
        }).length,
      };
    },
    enabled: !!user && user.role === 'admin',
    initialData: { pending: 0, flagged: 0, under_review: 0, approved_today: 0, rejected_today: 0 },
  });

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user && user.role === 'admin',
    initialData: [],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ moderationItem, notes }) => {
      // Update moderation record
      await base44.entities.ContentModeration.update(moderationItem.id, {
        status: 'approved',
        moderator_email: user.email,
        moderator_notes: notes,
        reviewed_date: new Date().toISOString(),
      });

      // Update the actual content entity status
      if (moderationItem.content_type === 'video') {
        await base44.entities.VideoPodcast.update(moderationItem.content_id, {
          status: 'approved'
        });
      } else if (moderationItem.content_type === 'audio') {
        await base44.entities.AudioContent.update(moderationItem.content_id, {
          status: 'approved'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      // Invalidate all videoPodcasts queries regardless of role
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['audioContent'], refetchType: 'all' });
      toast.success("✅ Content approved!");
      setSelectedItem(null);
      setModeratorNotes("");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ moderationItem, reason, notes }) => {
      // Update moderation record
      await base44.entities.ContentModeration.update(moderationItem.id, {
        status: 'rejected',
        moderator_email: user.email,
        moderator_notes: notes,
        rejection_reason: reason,
        reviewed_date: new Date().toISOString(),
      });

      // Update the actual content entity status
      if (moderationItem.content_type === 'video') {
        await base44.entities.VideoPodcast.update(moderationItem.content_id, {
          status: 'rejected'
        });
      } else if (moderationItem.content_type === 'audio') {
        await base44.entities.AudioContent.update(moderationItem.content_id, {
          status: 'rejected'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      // Invalidate all videoPodcasts queries regardless of role
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['audioContent'], refetchType: 'all' });
      toast.success("❌ Content rejected!");
      setSelectedItem(null);
      setModeratorNotes("");
      setRejectionReason("");
      setShowRejectDialog(false);
    },
  });

  const markUnderReviewMutation = useMutation({
    mutationFn: async (moderationId) => {
      await base44.entities.ContentModeration.update(moderationId, {
        status: 'under_review',
        moderator_email: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      toast.info("Marked as under review");
    },
  });

  const toggleTrustedUploaderMutation = useMutation({
    mutationFn: async ({ userEmail, trusted }) => {
      const userToUpdate = allUsers.find(u => u.email === userEmail);
      if (!userToUpdate) throw new Error("User not found");
      
      await base44.entities.User.update(userToUpdate.id, {
        trusted_uploader: trusted
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(variables.trusted ? "✅ User marked as trusted uploader" : "❌ Trusted uploader status removed");
      setShowUserTrustDialog(false);
      setSelectedUserEmail("");
    },
    onError: (error) => {
      toast.error("Failed to update user: " + error.message);
    }
  });

  const editContentMutation = useMutation({
    mutationFn: async ({ contentType, contentId, data }) => {
      if (contentType === 'video') {
        await base44.entities.VideoPodcast.update(contentId, data);
      } else if (contentType === 'audio') {
        await base44.entities.AudioContent.update(contentId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
      queryClient.invalidateQueries({ queryKey: ['audioContent'] });
      toast.success("✅ Content updated successfully!");
      setShowEditDialog(false);
      setEditingContent(null);
      setEditForm({});
    },
    onError: (error) => {
      toast.error("Failed to update content: " + error.message);
    }
  });

  const handleEditContent = async (item) => {
    setEditingContent(item);
    
    // Fetch the actual content to get current values
    try {
      let content;
      if (item.content_type === 'video') {
        const videos = await base44.entities.VideoPodcast.filter({ id: item.content_id });
        content = videos[0];
      } else if (item.content_type === 'audio') {
        const audios = await base44.entities.AudioContent.filter({ id: item.content_id });
        content = audios[0];
      }
      
      if (content) {
        setEditForm({
          title: content.title || '',
          description: content.description || '',
          category: content.category || '',
          speaker: content.speaker || '',
          language: content.language || '',
          tags: content.tags ? content.tags.join(', ') : '',
        });
        setShowEditDialog(true);
      } else {
        toast.error("Content not found");
      }
    } catch (error) {
      toast.error("Failed to load content: " + error.message);
    }
  };

  const handleSaveEdit = () => {
    if (!editForm.title) {
      toast.error("Title is required");
      return;
    }
    
    const updateData = {
      title: editForm.title,
      description: editForm.description,
      category: editForm.category,
      speaker: editForm.speaker,
      language: editForm.language,
      tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(t => t) : [],
    };
    
    editContentMutation.mutate({
      contentType: editingContent.content_type,
      contentId: editingContent.content_id,
      data: updateData,
    });
  };

  const handleApprove = (item) => {
    approveMutation.mutate({
      moderationItem: item,
      notes: moderatorNotes,
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({
      moderationItem: selectedItem,
      reason: rejectionReason,
      notes: moderatorNotes,
    });
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'podcast': return FileText;
      case 'audio': return Music;
      case 'video': return VideoIcon;
      case 'comment': return MessageSquare;
      default: return FileText;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'flagged': return 'bg-orange-500';
      case 'under_review': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredQueue = moderationQueue.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.content_title?.toLowerCase().includes(search) ||
      item.uploader_email?.toLowerCase().includes(search) ||
      item.content_id?.toLowerCase().includes(search)
    );
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card className="bg-white border-red-200 shadow-lg max-w-md">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-700">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-sm md:text-base lg:text-lg text-gray-700">Review and manage uploaded content</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xl md:text-2xl font-bold">{stats.pending}</span>
              </div>
              <p className="text-xs md:text-sm font-medium">Pending Review</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <Flag className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xl md:text-2xl font-bold">{stats.flagged}</span>
              </div>
              <p className="text-xs md:text-sm font-medium">Flagged</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <Eye className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xl md:text-2xl font-bold">{stats.under_review}</span>
              </div>
              <p className="text-xs md:text-sm font-medium">Under Review</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xl md:text-2xl font-bold">{stats.approved_today}</span>
              </div>
              <p className="text-xs md:text-sm font-medium">Approved Today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-pink-500 text-white border-0 col-span-2 sm:col-span-1">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xl md:text-2xl font-bold">{stats.rejected_today}</span>
              </div>
              <p className="text-xs md:text-sm font-medium">Rejected Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardContent className="p-3 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <Label className="text-gray-800 mb-2 block text-sm">Status Filter</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-800 mb-2 block text-sm">Content Type</Label>
                <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="podcast">Podcasts</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="comment">Comments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-800 mb-2 block text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search content..."
                    className="pl-10 bg-white border-gray-300 text-gray-900 h-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-800 mb-2 block text-sm">Manage Users</Label>
                <Button
                  onClick={() => setShowUserTrustDialog(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
                >
                  <User className="w-4 h-4 mr-2" />
                  Trusted Uploaders
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Queue */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-700">Loading moderation queue...</p>
          </div>
        ) : filteredQueue.length > 0 ? (
          <div className="grid gap-3 md:gap-4">
            {filteredQueue.map((item) => {
              const ContentIcon = getContentTypeIcon(item.content_type);
              return (
                <Card key={item.id} className="bg-white border-gray-300 hover:border-purple-400 hover:shadow-lg transition-all">
                  <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0`}>
                        <ContentIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>

                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 md:gap-4 mb-2">
                          <div className="flex-1 w-full">
                            <h3 className="text-gray-900 font-semibold text-base md:text-lg mb-1 break-words">{item.content_title}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${getStatusColor(item.status)} text-white text-xs`}>
                                {item.status}
                              </Badge>
                              <Badge variant="outline" className="border-gray-400 text-gray-700 text-xs">
                                {item.content_type}
                              </Badge>
                              {item.auto_flagged && (
                                <Badge className="bg-orange-500 text-white text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  AI Flagged
                                </Badge>
                              )}
                              {item.flags && item.flags.length > 0 && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  <Flag className="w-3 h-3 mr-1" />
                                  {item.flags.length} Reports
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-gray-700 mb-3 md:mb-4">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
                            <span className="truncate">Uploaded by: {item.uploader_email || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{format(new Date(item.created_date), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                        </div>

                        {item.ai_analysis && item.ai_analysis.flagged && (
                          <Alert className="bg-orange-50 border-orange-300 mb-3 md:mb-4">
                            <AlertTriangle className="w-4 h-4 text-orange-700" />
                            <AlertDescription className="text-orange-900 text-xs md:text-sm">
                              <strong>AI Analysis:</strong> {item.ai_analysis.concerns?.join(', ')}
                              {item.ai_analysis.confidence && ` (${Math.round(item.ai_analysis.confidence * 100)}% confidence)`}
                            </AlertDescription>
                          </Alert>
                        )}

                        {item.flags && item.flags.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 md:mb-4">
                            <h4 className="text-sm font-semibold text-red-900 mb-2">User Reports:</h4>
                            <div className="space-y-2">
                              {item.flags.slice(0, 3).map((flag, idx) => (
                                <div key={idx} className="text-sm text-red-800">
                                  <strong>{flag.reason}:</strong> Reported by {flag.reporter_email}
                                  {flag.timestamp && ` on ${format(new Date(flag.timestamp), 'MMM d, h:mm a')}`}
                                </div>
                              ))}
                              {item.flags.length > 3 && (
                                <p className="text-xs text-red-600">+ {item.flags.length - 3} more reports</p>
                              )}
                            </div>
                          </div>
                        )}

                        {item.moderator_notes && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 md:mb-4">
                            <h4 className="text-sm font-semibold text-blue-900 mb-1">Moderator Notes:</h4>
                            <p className="text-sm text-blue-800">{item.moderator_notes}</p>
                            {item.moderator_email && (
                              <p className="text-xs text-blue-600 mt-1">By: {item.moderator_email}</p>
                            )}
                          </div>
                        )}

                        {item.rejection_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 md:mb-4">
                            <h4 className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</h4>
                            <p className="text-sm text-red-800">{item.rejection_reason}</p>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {item.content_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(item.content_url, '_blank')}
                              className="border-gray-300 text-gray-700 text-xs h-8"
                            >
                              <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                              View Content
                            </Button>
                          )}

                          {(item.content_type === 'video' || item.content_type === 'audio') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditContent(item)}
                              className="border-blue-300 text-blue-700 text-xs h-8"
                            >
                              <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                              Edit
                            </Button>
                          )}

                          {(item.status === 'pending' || item.status === 'flagged' || item.status === 'under_review') && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setModeratorNotes("");
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                              >
                                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setRejectionReason("");
                                  setModeratorNotes("");
                                  setShowRejectDialog(true);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                              >
                                <XCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                Reject
                              </Button>

                              {item.status !== 'under_review' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markUnderReviewMutation.mutate(item.id)}
                                  className="border-blue-600 text-blue-700 text-xs h-8"
                                >
                                  <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                  Review
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border-gray-300 shadow-md">
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Content to Review</h3>
              <p className="text-gray-700">All clear! There's nothing in the {selectedStatus} queue.</p>
            </CardContent>
          </Card>
        )}

        {/* User Trust Management Dialog */}
        <Dialog open={showUserTrustDialog} onOpenChange={setShowUserTrustDialog}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Trusted Uploaders</DialogTitle>
              <DialogDescription className="text-gray-700">
                Trusted uploaders can publish content immediately without moderation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Alert className="bg-blue-50 border-blue-300">
                <Shield className="w-4 h-4 text-blue-700" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Trusted Uploaders:</strong> Content uploaded by these users will be automatically approved and visible immediately, bypassing the moderation queue.
                </AlertDescription>
              </Alert>

              {allUsers.length > 0 ? (
                <div className="space-y-2">
                  {allUsers.map(u => (
                    <Card key={u.id} className={`${u.trusted_uploader ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{u.full_name || u.email}</h4>
                              {u.role === 'admin' && (
                                <Badge className="bg-purple-500 text-white text-xs">Admin</Badge>
                              )}
                              {u.trusted_uploader && (
                                <Badge className="bg-green-500 text-white text-xs">Trusted</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{u.email}</p>
                          </div>
                          
                          {u.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant={u.trusted_uploader ? "outline" : "default"}
                              onClick={() => {
                                toggleTrustedUploaderMutation.mutate({
                                  userEmail: u.email,
                                  trusted: !u.trusted_uploader
                                });
                              }}
                              disabled={toggleTrustedUploaderMutation.isPending}
                              className={u.trusted_uploader ? 
                                "border-red-300 text-red-700 hover:bg-red-50" : 
                                "bg-green-600 hover:bg-green-700 text-white"
                              }
                            >
                              {toggleTrustedUploaderMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : u.trusted_uploader ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Remove Trust
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Trusted
                                </>
                              )}
                            </Button>
                          )}
                          
                          {u.role === 'admin' && (
                            <span className="text-sm text-gray-600 italic">Auto-approved</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">No users found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={selectedItem && !showRejectDialog} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="bg-white border-gray-300 text-gray-900">
            <DialogHeader>
              <DialogTitle>Approve Content</DialogTitle>
              <DialogDescription className="text-gray-700">
                Add optional notes for this approval
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-800">Moderator Notes (Optional)</Label>
                <Textarea
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Internal notes about this approval..."
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApprove(selectedItem)}
                  disabled={approveMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve Content
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Content Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit {editingContent?.content_type === 'video' ? 'Video' : 'Audio'} Content</DialogTitle>
              <DialogDescription className="text-gray-700">
                Update the content details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label className="text-gray-800">Title *</Label>
                <Input
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  placeholder="Content title"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              
              <div>
                <Label className="text-gray-800">Description</Label>
                <Textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Content description"
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-800">Category</Label>
                  <Input
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    placeholder="Category"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-800">Speaker/Artist</Label>
                  <Input
                    value={editForm.speaker || ''}
                    onChange={(e) => setEditForm({...editForm, speaker: e.target.value})}
                    placeholder="Speaker name"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-800">Language</Label>
                  <Input
                    value={editForm.language || ''}
                    onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                    placeholder="Language"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-800">Tags (comma-separated)</Label>
                  <Input
                    value={editForm.tags || ''}
                    onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                    placeholder="tag1, tag2, tag3"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingContent(null);
                    setEditForm({});
                  }}
                  className="flex-1 border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={editContentMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editContentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="bg-white border-gray-300 text-gray-900">
            <DialogHeader>
              <DialogTitle>Reject Content</DialogTitle>
              <DialogDescription className="text-gray-700">
                Provide a reason for rejection (will be shown to uploader)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-800">Rejection Reason *</Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {flagReasons.map(reason => (
                      <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-800">Additional Details (Optional)</Label>
                <Textarea
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Internal notes (not shown to uploader)..."
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject Content
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
