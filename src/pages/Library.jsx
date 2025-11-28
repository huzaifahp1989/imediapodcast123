import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Headphones, Search, Calendar, Clock, Mic, BookOpen, Heart, Users, Globe, Sparkles, Play, Upload, X, Plus, Trash2, Loader2, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const islamicCategories = [
  { value: "All", label: "All Topics", icon: Sparkles, color: "from-purple-500 to-pink-500" },
  { value: "Quran", label: "Quran & Tafsir", icon: BookOpen, color: "from-green-500 to-emerald-500" },
  { value: "Hadith", label: "Hadith & Sunnah", icon: Mic, color: "from-blue-500 to-cyan-500" },
  { value: "Fiqh", label: "Fiqh & Rulings", icon: Users, color: "from-amber-500 to-orange-500" },
  { value: "Aqeedah", label: "Aqeedah & Belief", icon: Heart, color: "from-red-500 to-rose-500" },
  { value: "History", label: "Islamic History", icon: Globe, color: "from-indigo-500 to-purple-500" },
  { value: "Spirituality", label: "Spirituality", icon: Headphones, color: "from-teal-500 to-cyan-500" },
  { value: "General", label: "General", icon: Sparkles, color: "from-gray-500 to-slate-500" },
];

export default function Library() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [user, setUser] = useState(null);
  
  // Multi-upload state
  const [uploadFiles, setUploadFiles] = useState([]);
  const [seriesName, setSeriesName] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("General");
  const [isUploading, setIsUploading] = useState(false);
  const [coverArtFile, setCoverArtFile] = useState(null);
  const [coverArtPreview, setCoverArtPreview] = useState(null);

  // New state variables for custom topics
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState("");

  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setUploaderName(u.full_name || u.email || "");
      })
      .catch(() => setUser(null));
  }, []);

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.list('-published_date'),
    initialData: [],
  });

  // Get all unique categories from podcasts (including custom ones)
  const allCategories = React.useMemo(() => {
    const customCategories = [...new Set(
      podcasts
        .map(p => p.category)
        .filter(cat => cat && !islamicCategories.some(ic => ic.value === cat))
    )];

    const customCategoryItems = customCategories.map(cat => ({
      value: cat,
      label: cat,
      icon: Sparkles, // Default icon for custom topics
      color: "from-pink-500 to-rose-500" // Default color for custom topics
    }));

    return [...islamicCategories, ...customCategoryItems];
  }, [podcasts]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files);
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      toast.error("Please select audio files");
      return;
    }

    const newFiles = audioFiles.map((file, index) => ({
      id: Date.now() + index,
      file: file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      description: "",
      episode_number: uploadFiles.length + index + 1,
    }));

    setUploadFiles([...uploadFiles, ...newFiles]);
    toast.success(`${audioFiles.length} file(s) added`);
  };

  const removeFile = (id) => {
    setUploadFiles(uploadFiles.filter(f => f.id !== id));
  };

  const updateFileDetails = (id, field, value) => {
    setUploadFiles(uploadFiles.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handleCoverArtChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      setCoverArtFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverArtPreview(reader.result);
      reader.readAsDataURL(file);
      toast.success("Cover art loaded!");
    }
  };

  const handleUploadPodcasts = async () => {
    if (!user) {
      toast.error("Uploading is unavailable.");
      return;
    }

    if (uploadFiles.length === 0) {
      toast.error("Please add at least one audio file");
      return;
    }

    if (!uploaderName) {
      toast.error("Please enter uploader name");
      return;
    }

    if (!selectedTopic) {
      toast.error("Please select or create a topic");
      return;
    }

    setIsUploading(true);

    try {
      let coverArtUrl = null;
      if (coverArtFile) {
        toast.info("Uploading cover art...");
        const result = await base44.integrations.Core.UploadFile({ file: coverArtFile });
        coverArtUrl = result.file_url;
      }

      for (let i = 0; i < uploadFiles.length; i++) {
        const fileData = uploadFiles[i];
        toast.info(`Uploading ${i + 1}/${uploadFiles.length}: ${fileData.title}`);

        // Upload audio file
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: fileData.file
        });

        // Get duration
        let duration = 0;
        try {
          const audio = new Audio();
          duration = await new Promise((resolve) => {
            audio.onloadedmetadata = () => {
              resolve(Math.floor(audio.duration));
              URL.revokeObjectURL(audio.src);
            };
            audio.onerror = () => {
              resolve(0);
              URL.revokeObjectURL(audio.src);
            };
            audio.src = URL.createObjectURL(fileData.file);
          });
        } catch (error) {
          console.error("Error getting audio duration:", error);
          duration = 0;
        }

        // Create podcast
        const slug = fileData.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const showNotes = `
## Introduction
Welcome to ${fileData.title}!

## Summary
${fileData.description || 'Episode description will be added here.'}

## Series
${seriesName || 'Standalone episode'}

## Host
${uploaderName}
        `.trim();

        await base44.entities.Podcast.create({
          title: fileData.title,
          slug: `${slug}-${Date.now()}`,
          description: fileData.description || "",
          audio_url: file_url,
          cover_art_url: coverArtUrl,
          duration: duration,
          file_size: fileData.file.size,
          published_date: new Date().toISOString(),
          status: "published",
          host_name: uploaderName,
          category: selectedTopic,
          series: seriesName || null,
          episode_number: seriesName ? fileData.episode_number : null,
          show_notes: showNotes,
          play_count: 0,
          like_count: 0,
          comment_count: 0,
          save_count: 0,
        });

        // Send email notification
        const emailBody = `
<h2>📻 New Podcast Uploaded</h2>

<p style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px;">
✅ New podcast episode has been published!
</p>

<h3>Episode Details:</h3>
<ul>
  <li><strong>Title:</strong> ${fileData.title}</li>
  <li><strong>Description:</strong> ${fileData.description || 'No description'}</li>
  <li><strong>Topic:</strong> ${selectedTopic}</li>
  <li><strong>Series:</strong> ${seriesName || 'Standalone'}</li>
  ${seriesName ? `<li><strong>Episode Number:</strong> ${fileData.episode_number}</li>` : ''}
  <li><strong>Uploader:</strong> ${uploaderName}</li>
  <li><strong>Duration:</strong> ${Math.floor(duration / 60)}m ${duration % 60}s</li>
  <li><strong>File Size:</strong> ${(fileData.file.size / 1024 / 1024).toFixed(2)} MB</li>
  <li><strong>Uploaded by:</strong> ${user.email}</li>
  <li><strong>Upload Date:</strong> ${new Date().toLocaleString()}</li>
</ul>

<h3>Audio File:</h3>
<p><a href="${file_url}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Listen to Audio</a></p>

${coverArtUrl ? `
<h3>Cover Art:</h3>
<img src="${coverArtUrl}" style="max-width: 400px; margin-top: 10px; border-radius: 8px;" />
` : ''}

<p style="color: #666; font-size: 12px; margin-top: 30px;">
This is episode ${i + 1} of ${uploadFiles.length} uploaded in this batch.
</p>
        `;

        base44.integrations.Core.SendEmail({
          to: "imediac786@gmail.com",
          subject: `✅ Podcast Uploaded: ${fileData.title}`,
          body: emailBody
        }).catch(err => console.error("Email notification failed:", err));
      }

      await queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      
      toast.success(`✅ Successfully uploaded ${uploadFiles.length} podcast(s)!`);
      
      // Reset form
      setShowUploadDialog(false);
      setUploadFiles([]);
      setSeriesName("");
      setSelectedTopic("General");
      setCoverArtFile(null);
      setCoverArtPreview(null);
      setShowCustomTopic(false); // Reset custom topic state
      setCustomTopicInput(""); // Reset custom topic input
      
    } catch (error) {
      toast.error("Failed to upload podcasts: " + error.message);
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredPodcasts = podcasts.filter(podcast => {
    if (!podcast) return false;
    
    const matchesCategory = selectedCategory === "All" || podcast.category === selectedCategory;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (podcast.title || "").toLowerCase().includes(searchLower) ||
      (podcast.description || "").toLowerCase().includes(searchLower) ||
      (podcast.host_name || "").toLowerCase().includes(searchLower) ||
      (podcast.tags || []).some(tag => tag.toLowerCase().includes(searchLower));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Headphones className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Podcast Library</h1>
          <p className="text-gray-700 text-sm md:text-lg">Browse and listen to Islamic podcasts</p>
        </div>

        {/* Upload Button */}
        {user && (
          <div className="flex justify-center">
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Podcast(s)
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search episodes, hosts, topics..."
            className="pl-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 h-12 rounded-2xl"
          />
        </div>

        {/* Islamic Categories */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Browse by Topic</h2>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 md:gap-2 w-full bg-transparent h-auto p-0">
              {allCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.value;
                const count = podcasts.filter(p => cat.value === "All" ? true : p.category === cat.value).length;
                return (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    className={`flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 rounded-lg md:rounded-xl transition-all h-auto data-[state=inactive]:bg-white data-[state=inactive]:border-2 data-[state=inactive]:border-gray-300 data-[state=inactive]:text-gray-700 ${
                      isActive ? `bg-gradient-to-r ${cat.color} text-white shadow-lg` : ''
                    }`}
                  >
                    <Icon className="w-4 h-4 md:w-6 md:h-6" />
                    <span className="text-[10px] md:text-xs font-semibold text-center line-clamp-1">{cat.label}</span>
                    <span className="text-[10px] md:text-xs opacity-75">{count}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </section>

        {/* Episodes List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-700 mt-4">Loading episodes...</p>
          </div>
        ) : filteredPodcasts.length > 0 ? (
          <div className="space-y-4">
            {filteredPodcasts.map((episode) => (
              <Link 
                key={episode.id} 
                to={createPageUrl("Episode") + `?id=${episode.id}`}
                className="block group"
              >
                <Card className="bg-white border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all">
                  <CardContent className="p-3 md:p-6">
                    <div className="flex items-start gap-3 md:gap-6">
                      {/* Icon/Avatar - Simple, no image */}
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Mic className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {episode.category && (
                            <Badge variant="outline" className="text-xs border-blue-400 text-blue-700 font-semibold">
                              {episode.category}
                            </Badge>
                          )}
                          {episode.series && (
                            <Badge variant="outline" className="text-xs border-gray-400 text-gray-700">
                              {episode.series}
                            </Badge>
                          )}
                          {episode.episode_number && (
                            <Badge variant="outline" className="text-xs border-gray-400 text-gray-700">
                              Episode {episode.episode_number}
                            </Badge>
                          )}
                          {episode.status === 'draft' && (
                            <Badge className="bg-yellow-500 text-white text-xs">
                              Draft
                            </Badge>
                          )}
                          {episode.pinned_to_front && (
                            <Badge className="bg-pink-500 text-white text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                          {episode.title}
                        </h3>
                        
                        {/* Speaker Name */}
                        <p className="text-gray-700 font-medium mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                          <Mic className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                          {episode.host_name || "Unknown Host"}
                        </p>
                        
                        {/* Date & Duration */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {episode.published_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(episode.published_date), "MMM d, yyyy")}
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
                      
                      {/* Play Button */}
                      <Button
                        size="icon"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full w-10 h-10 md:w-12 md:h-12 flex-shrink-0 text-white"
                      >
                        <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-gray-300">
            <CardContent className="p-12 text-center">
              <Headphones className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Episodes Found</h3>
              <p className="text-gray-700">
                {searchTerm 
                  ? "Try a different search term" 
                  : selectedCategory !== "All"
                  ? `No episodes in ${selectedCategory} category yet.`
                  : "No episodes available yet"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Podcast Episode(s)</DialogTitle>
              <DialogDescription className="text-gray-700">
                Upload single or multiple podcast episodes. Great for series!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <Alert className="bg-blue-50 border-blue-300">
                <CheckCircle2 className="w-4 h-4 text-blue-700" />
                <AlertDescription className="text-blue-900">
                  <strong>✅ Multi-Upload:</strong> You can upload multiple episodes at once, perfect for series!
                </AlertDescription>
              </Alert>

              {/* Common Fields */}
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-800">Uploader Name *</Label>
                  <Input
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    placeholder="Your name"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Topic *</Label>
                  {!showCustomTopic ? (
                    <div className="space-y-2">
                      <Select value={selectedTopic} onValueChange={(value) => {
                        if (value === "__custom__") {
                          setShowCustomTopic(true);
                          setSelectedTopic(""); // Clear selected topic when switching to custom
                          setCustomTopicInput(""); // Clear custom input
                        } else {
                          setSelectedTopic(value);
                        }
                      }}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.filter(c => c.value !== "All").map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__">
                            <div className="flex items-center gap-2 text-blue-600">
                              <Plus className="w-4 h-4" />
                              Create Custom Topic
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={customTopicInput}
                          onChange={(e) => {
                            setCustomTopicInput(e.target.value);
                            setSelectedTopic(e.target.value); // Set selectedTopic to custom input
                          }}
                          placeholder="Enter custom topic name..."
                          className="bg-white border-gray-300 text-gray-900"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCustomTopic(false);
                            setCustomTopicInput("");
                            setSelectedTopic("General"); // Revert to General or previous selection
                          }}
                          className="border-gray-300 text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">
                        Creating new topic: <strong>{customTopicInput || "..."}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-800">Series Name (Optional)</Label>
                  <Input
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    placeholder="e.g., Ramadan Series 2024"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Leave empty for standalone episodes. Fill in for series episodes.
                  </p>
                </div>

                <div>
                  <Label className="text-gray-800 mb-2 block">Cover Art (Optional - shared for all episodes)</Label>
                  <div className="flex items-start gap-4">
                    {coverArtPreview ? (
                      <div className="relative">
                        <img 
                          src={coverArtPreview} 
                          alt="Cover art preview" 
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCoverArtFile(null);
                            setCoverArtPreview(null);
                          }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 p-0 text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-all">
                        <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-xs text-gray-600">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverArtChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* File Selection */}
              <div>
                <Label className="text-gray-800 mb-2 block">Audio Files *</Label>
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileSelection}
                  className="w-full p-3 border-2 border-purple-400 rounded-lg text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Select one or multiple audio files. Each file will become a separate episode.
                </p>
              </div>

              {/* Files List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Episodes to Upload ({uploadFiles.length})
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {uploadFiles.map((fileData) => (
                      <Card key={fileData.id} className="bg-gray-50 border-gray-300">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-3">
                              <div>
                                <Label className="text-gray-800 text-sm">Episode Title *</Label>
                                <Input
                                  value={fileData.title}
                                  onChange={(e) => updateFileDetails(fileData.id, 'title', e.target.value)}
                                  className="bg-white border-gray-300 text-gray-900"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-800 text-sm">Description (Optional)</Label>
                                <Textarea
                                  value={fileData.description}
                                  onChange={(e) => updateFileDetails(fileData.id, 'description', e.target.value)}
                                  className="bg-white border-gray-300 text-gray-900 h-20"
                                  placeholder="Brief description of this episode..."
                                />
                              </div>
                              {seriesName && (
                                <div>
                                  <Label className="text-gray-800 text-sm">Episode Number</Label>
                                  <Input
                                    type="number"
                                    value={fileData.episode_number}
                                    onChange={(e) => updateFileDetails(fileData.id, 'episode_number', parseInt(e.target.value))}
                                    className="bg-white border-gray-300 text-gray-900 w-32"
                                  />
                                </div>
                              )}
                              <p className="text-xs text-gray-600">
                                File: {fileData.file.name} ({(fileData.file.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(fileData.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadDialog(false);
                    setUploadFiles([]);
                    setSeriesName("");
                    setCoverArtFile(null);
                    setCoverArtPreview(null);
                    setShowCustomTopic(false);
                    setCustomTopicInput("");
                  }}
                  className="flex-1 border-gray-300 text-gray-700"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadPodcasts}
                  disabled={isUploading || uploadFiles.length === 0 || !uploaderName || !selectedTopic}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {uploadFiles.length} Episode(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
