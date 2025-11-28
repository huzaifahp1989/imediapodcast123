import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  Upload,
  Play,
  Search,
  Plus,
  X,
  Loader2,
  BookOpen,
  Mic2,
  MessageSquare,
  BookMarked,
  Info,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Eye,
  Clock,
  Music,
  Edit,
  Save,
  Trash2,
  Youtube,
  ListVideo,
  GripVertical,
  Check,
  Volume2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import UploadProgress from "@/components/UploadProgress";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ShareButtons from "@/components/ShareButtons";
import FavoriteButton from "@/components/FavoriteButton";
import VideoAIFeatures from "@/components/video/VideoAIFeatures";
import CommentsWidget from "@/components/CommentsWidget";
import RatingWidget from "@/components/RatingWidget";


const speakers = [
  "Mufti Ismail Menk",
  "Sheikh Suleman Moola",
  "Maulana Tariq Jameel",
  "Nouman Ali Khan",
  "Omar Suleiman",
  "Yasir Qadhi",
  "Sheikh Hamza Yusuf",
  "Maulana Imtiyaz Sidat",
  "Abdul Nasir Jangda",
  "Other"
];

const nasheedArtists = [
  "Zain Bhikha",
  "Omar Esa",
  "Maher Zain",
  "Sami Yusuf",
  "Mesut Kurtis",
  "Native Deen",
  "Other"
];

const categories = [
  { value: "Quran", icon: BookOpen, color: "from-green-500 to-emerald-500" },
  { value: "Hadith", icon: BookMarked, color: "from-orange-500 to-red-500" },
  { value: "Salah", icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
  { value: "Fiqh", icon: Volume2, color: "from-purple-500 to-indigo-500" },
  { value: "Aqeedah", icon: BookOpen, color: "from-pink-500 to-rose-500" },
  { value: "Nasheeds", icon: Music, color: "from-teal-500 to-cyan-500" },
  { value: "Lectures", icon: Mic2, color: "from-indigo-500 to-purple-500" },
  { value: "Tafsir", icon: BookOpen, color: "from-emerald-500 to-green-500" },
  { value: "Seerah", icon: BookMarked, color: "from-blue-600 to-indigo-600" },
  { value: "Ramadan", icon: MessageSquare, color: "from-yellow-500 to-amber-500" },
  { value: "Hajj", icon: BookMarked, color: "from-orange-600 to-red-600" },
  { value: "Zakat", icon: Volume2, color: "from-green-600 to-emerald-600" },
  { value: "Islamic History", icon: BookOpen, color: "from-purple-600 to-pink-600" },
  { value: "Spirituality", icon: MessageSquare, color: "from-cyan-500 to-blue-500" },
  { value: "General", icon: Sparkles, color: "from-gray-500 to-slate-500" },
];

export default function VideoPodcast() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null); // New state for editing video
  const [editForm, setEditForm] = useState({}); // New state for edit form fields
  const [uploadMethod, setUploadMethod] = useState("file"); // "file" or "youtube"
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // For YouTube upload processing
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState("");
  const [youtubeSearchResults, setYoutubeSearchResults] = useState([]);
  const [selectedYoutubeVideos, setSelectedYoutubeVideos] = useState([]);
  const [youtubeApiKeyInput, setYoutubeApiKeyInput] = useState(getYouTubeApiKey());
  const [youtubeSearchError, setYoutubeSearchError] = useState("");
  const [localSearchResults, setLocalSearchResults] = useState([]);

  // Playlist states
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showPlaylistDetails, setShowPlaylistDetails] = useState(null);
  const [playlistForm, setPlaylistForm] = useState({ name: "", description: "" });
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [playlistEditForm, setPlaylistEditForm] = useState({ name: "", description: "" });


  const videoFileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "Lectures",
    speaker: "",
    language: "",
    tags: "",
    video_file: null,
    thumbnail: null,
  });

  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const queryClient = useQueryClient();

  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    stage: 'compressing',
    progress: 0,
    fileName: '',
    fileSize: 0,
    uploadSpeed: 0,
    estimatedTime: 0
  });

  React.useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setUserLoaded(true);
      })
      .catch(() => {
        setUser(null);
        setUserLoaded(true);
      });
    try {
      const params = new URLSearchParams(window.location.search);
      const ytkey = params.get('ytkey');
      if (ytkey) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('youtube_api_key', ytkey);
          setYoutubeApiKeyInput(ytkey);
          toast.success('YouTube API key loaded');
        }
      }
    } catch {}
  }, []);

  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ['videoPodcasts', user?.role],
    queryFn: async () => {
      const allVideos = await base44.entities.VideoPodcast.list('-published_date');
      if (user?.role === 'admin') {
        return allVideos;
      }
      return allVideos.filter(v => !v.status || v.status === 'approved');
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15,
  });

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery({
    queryKey: ['videoPlaylists', user?.email],
    queryFn: () => user ? base44.entities.VideoPlaylist.filter({ user_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: [],
  });

  const extractYouTubeVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (videoId) => {
    // Use standard definition thumbnail which is more reliable
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  };

  function getYouTubeApiKey() {
    return import.meta.env.VITE_YOUTUBE_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem('youtube_api_key') : '') || "";
  }

  const timeoutFetch = async (url, options = {}, timeoutMs = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally { clearTimeout(id); }
  };

  const verifyYouTubeApi = async () => {
    try {
      const key = getYouTubeApiKey();
      if (!key) {
        toast.error("No YouTube API key detected");
        return;
      }
      const testId = "dQw4w9WgXcQ";
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${testId}&key=${key}`;
      const r = await timeoutFetch(url, {}, 5000);
      const data = await r.json();
      if (r.ok && Array.isArray(data.items) && data.items.length > 0) {
        toast.success("YouTube API working");
      } else {
        toast.error(data?.error?.message || "YouTube API test failed");
      }
    } catch (e) {
      toast.error(e.message || "YouTube API test failed");
    }
  };

  const saveYouTubeApiKey = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('youtube_api_key', youtubeApiKeyInput || '');
        toast.success('Saved YouTube API key');
      } else {
        toast.error('Local storage not available');
      }
    } catch (e) {
      toast.error('Failed to save API key');
    }
  };

  const extractVideoId = (input) => {
    const str = input.trim();
    try {
      const url = new URL(str);
      if (url.hostname.includes('youtu.be')) {
        return url.pathname.replace('/', '');
      }
      if (url.hostname.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v) return v;
      }
    } catch {}
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    return '';
  };

  const importFromInput = async () => {
    setYoutubeSearchError("");
    const id = extractVideoId(youtubeSearchQuery);
    if (!id) {
      toast.error('Enter a YouTube URL or video ID');
      return;
    }
    setIsSearchingYouTube(true);
    setYoutubeSearchResults([]);
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
      let title = '';
      let channel = '';
      try {
        const r = await timeoutFetch(oembedUrl, {}, 5000);
        if (r.ok) {
          const data = await r.json();
          title = data.title || '';
          channel = data.author_name || '';
        }
      } catch {}
      const item = {
        videoId: id,
        title: title || 'YouTube Video',
        channel,
        thumbnail: getYouTubeThumbnail(id),
      };
      setYoutubeSearchResults([item]);
      toast.success('Video loaded');
    } catch (error) {
      toast.error('Failed to load video');
      setYoutubeSearchError(error?.message || 'Failed to load video');
    } finally {
      setIsSearchingYouTube(false);
    }
  };

  const searchYouTube = async () => {
    if (!youtubeSearchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearchingYouTube(true);
    setYoutubeSearchResults([]);
    
    try {
      setYoutubeSearchError("");
      const maybeId = extractVideoId(youtubeSearchQuery);
      if (maybeId) {
        if (!getYouTubeApiKey()) {
          await importFromInput();
          return;
        }
        const apiUrlById = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${maybeId}&key=${getYouTubeApiKey()}`;
        const respById = await timeoutFetch(apiUrlById, {}, 5000);
        const dataById = await respById.json();
        if (respById.status === 429 || dataById?.error?.errors?.[0]?.reason?.includes('quota')) {
          toast.error("YouTube throttled. Browsing local database only.");
          setYoutubeSearchError('YouTube throttled or quota exceeded');
          return;
        }
        if (dataById.items && dataById.items.length > 0) {
          const item = dataById.items[0];
          const video = {
            videoId: maybeId,
            title: item.snippet?.title || 'YouTube Video',
            channel: item.snippet?.channelTitle || '',
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || getYouTubeThumbnail(maybeId)
          };
          setYoutubeSearchResults([video]);
          toast.success('Loaded video by URL/ID');
          return;
        }
        await importFromInput();
        return;
      }
      const apiUrl = `/api/youtube-search?q=${encodeURIComponent(youtubeSearchQuery)}&key=${encodeURIComponent(getYouTubeApiKey())}`;
      const response = await timeoutFetch(apiUrl, {}, 8000);
      const data = await response.json();
      
      console.log("YouTube API response:", data);
      
      if (response.status === 429 || data?.error?.message?.includes('Quota')) {
        toast.error("YouTube throttled. Browsing local database only.");
        setYoutubeSearchError('YouTube throttled or quota exceeded');
        return;
      }
      if (data.error) {
        console.error("YouTube API error:", data.error);
        toast.error(`YouTube API error: ${data.error.message || 'Unknown error'}`);
        setYoutubeSearchError(data.error.message || 'YouTube API error');
        return;
      }
      
      if (data.items?.length > 0) {
        const videos = data.items
          .map(item => ({
            videoId: item.videoId || item.id?.videoId,
            title: item.title || item.snippet?.title,
            channel: item.channel || item.snippet?.channelTitle,
            thumbnail: ((item.thumbnail != null ? item.thumbnail : item.snippet?.thumbnails?.medium?.url) || item.snippet?.thumbnails?.default?.url)
          }))
          .filter(v => v.videoId);
        
        setYoutubeSearchResults(videos);
        try {
          const term = youtubeSearchQuery.toLowerCase();
          const local = (videos || [])
            .filter(v =>
              (v.title || '').toLowerCase().includes(term) ||
              (v.description || '').toLowerCase().includes(term) ||
              (v.speaker || '').toLowerCase().includes(term)
            )
            .slice(0, 20);
          setLocalSearchResults(local);
        } catch {}
        toast.success(`Found ${videos.length} videos`);
      } else {
        toast.error("No videos found. Try a different search term.");
        setYoutubeSearchError('No videos found');
        try {
          const term = youtubeSearchQuery.toLowerCase();
          const local = (videos || [])
            .filter(v =>
              (v.title || '').toLowerCase().includes(term) ||
              (v.description || '').toLowerCase().includes(term) ||
              (v.speaker || '').toLowerCase().includes(term)
            )
            .slice(0, 20);
          setLocalSearchResults(local);
        } catch {}
      }
    } catch (error) {
      console.error("YouTube search error:", error);
      if (error.name === 'AbortError') {
        toast.error("Search timed out. Try again.");
        setYoutubeSearchError('Search timed out');
      } else {
        toast.error("Search failed: " + error.message);
        setYoutubeSearchError(error.message || 'Search failed');
      }
    } finally {
      setIsSearchingYouTube(false);
    }
  };

  const toggleVideoSelection = (video) => {
    setSelectedYoutubeVideos(prev =>
      prev.some(v => v.videoId === video.videoId)
        ? prev.filter(v => v.videoId !== video.videoId)
        : [...prev, video]
    );
  };

  const importSelectedVideos = async () => {
    if (selectedYoutubeVideos.length === 0) {
      toast.error("Please select at least one video to import.");
      return;
    }

    setIsProcessing(true);
    let successfulImports = 0;

    for (const video of selectedYoutubeVideos) {
      try {
        const videoUrl = `https://www.youtube.com/embed/${video.videoId}`;
        const thumbnailUrl = video.thumbnail || getYouTubeThumbnail(video.videoId);

        const videoData = {
          title: video.title,
          description: video.channel ? `From: ${video.channel}` : "",
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          category: uploadForm.category,
          speaker: uploadForm.speaker || null,
          duration: 0,
          file_size: 0,
          language: uploadForm.language || null,
          tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()).filter(t => t) : [],
          published_date: new Date().toISOString(),
          view_count: 0,
          featured: false,
          status: "approved",
          created_by: user ? user.email : null,
        };

        await base44.entities.VideoPodcast.create(videoData);
        successfulImports++;
      } catch (error) {
        console.error(`Failed to import ${video.title}:`, error);
      }
    }

    try {
      const all = await base44.entities.VideoPodcast.list('-published_date');
      const approved = all.filter(v => !v.status || v.status === 'approved');
      try { localStorage.setItem('cache_videoPodcasts', JSON.stringify(approved)); } catch {}
    } catch {}
    queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
    toast.success(`✅ Successfully imported ${successfulImports} video${successfulImports > 1 ? 's' : ''}!`);

    setSelectedYoutubeVideos([]);
    setYoutubeSearchResults([]);
    setYoutubeSearchQuery("");
    setShowUploadForm(false);
    setIsProcessing(false);
    try { setTimeout(() => { window.location.reload(); }, 300); } catch {}
  };

  const handleYouTubeSubmit = async () => {
    if (!uploadForm.title) {
      toast.error("Please provide a title");
      return;
    }

    if (!youtubeUrl) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      toast.error("Invalid YouTube URL. Please use a valid YouTube video link.");
      return;
    }

    try {
      setIsProcessing(true);
      toast.info("📹 Adding YouTube video...");
      
      const videoUrl = `https://www.youtube.com/embed/${videoId}`;
      const thumbnailUrl = getYouTubeThumbnail(videoId);

      // Auto-approve for ALL logged-in users
      const contentStatus = "approved";

      const videoData = {
        title: uploadForm.title,
        description: uploadForm.description || "",
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        category: uploadForm.category,
        speaker: uploadForm.speaker || null,
        duration: 0,
        file_size: 0,
        language: uploadForm.language || null,
        tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        published_date: new Date().toISOString(),
        view_count: 0,
        featured: false,
        status: contentStatus, // Auto-approve for all users
        created_by: user ? user.email : null,
      };

      const createdVideo = await base44.entities.VideoPodcast.create(videoData);

      // Send notification email
      const emailBody = `
<h2>🎬 New YouTube Video Published (Auto-Approved)</h2>

<p style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px;">
✅ This video was auto-published and is now LIVE!
</p>

<h3>Video Details:</h3>
<ul>
  <li><strong>Title:</strong> ${uploadForm.title || 'Untitled'}</li>
  <li><strong>Description:</strong> ${uploadForm.description || 'No description provided'}</li>
  <li><strong>Category:</strong> ${uploadForm.category}</li>
  ${uploadForm.speaker ? `<li><strong>Speaker:</strong> ${uploadForm.speaker}</li>` : ''}
  ${uploadForm.language ? `<li><strong>Language:</strong> ${uploadForm.language}</li>` : ''}
  ${uploadForm.tags ? `<li><strong>Tags:</strong> ${uploadForm.tags}</li>` : ''}
  <li><strong>Uploaded by:</strong> ${user?.email || 'Anonymous'}</li>
  <li><strong>Upload Date:</strong> ${new Date().toLocaleString()}</li>
  <li><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">LIVE ✅</span></li>
</ul>

<h3>YouTube Video:</h3>
<p><a href="${videoUrl}" style="background: #FF0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View YouTube Video</a></p>
<p>Direct link: <a href="${videoUrl}">${videoUrl}</a></p>
<p>Video ID: ${videoId}</p>

<h3>Thumbnail:</h3>
<img src="${thumbnailUrl}" style="max-width: 400px; margin-top: 10px; border-radius: 8px;" />

<hr style="margin: 20px 0;" />

<p style="color: #666; font-size: 12px; margin-top: 30px;">
This video was automatically published. All logged-in users can now upload content without moderation.
</p>
      `;

      base44.integrations.Core.SendEmail({
        to: "imediac786@gmail.com",
        subject: `✅ YouTube Video Published: ${uploadForm.title}`,
        body: emailBody
      }).catch(err => console.error("Email notification failed:", err));

      try {
        const all = await base44.entities.VideoPodcast.list('-published_date');
        const approved = all.filter(v => !v.status || v.status === 'approved');
        try { localStorage.setItem('cache_videoPodcasts', JSON.stringify(approved)); } catch {}
      } catch {}
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
      
      toast.success("✅ YouTube video published successfully!");
      toast.info("Your video is now live!");
      
      // Reset form
      setShowUploadForm(false);
      setUploadForm({
        title: "",
        description: "",
        category: "Lectures",
        speaker: "",
        language: "",
        tags: "",
        video_file: null,
        thumbnail: null,
      });
      setYoutubeUrl("");
      setUploadMethod("file");
      try { setTimeout(() => { window.location.reload(); }, 300); } catch {}
    } catch (error) {
      toast.error("Failed to add YouTube video: " + error.message);
      console.error("YouTube upload error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const startTime = Date.now();

      setUploadProgress({
        show: true,
        stage: 'uploading',
        progress: 0,
        fileName: data.video_file.name,
        fileSize: data.video_file.size,
        uploadSpeed: 0,
        estimatedTime: (data.video_file.size / (500 * 1024))
      });

      const videoFile = data.video_file;

      toast.info("⬆️ Uploading video file... This may take a while.");

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev.progress < 75 && prev.stage === 'uploading') {
            const elapsed = (Date.now() - startTime) / 1000;
            const estimatedLoaded = ((prev.progress) / 75) * videoFile.size;
            const speed = estimatedLoaded / elapsed;
            const remainingSize = videoFile.size - estimatedLoaded;
            const estimatedRemainingTime = speed > 0 ? remainingSize / speed : 0;

            return {
              ...prev,
              progress: Math.min(prev.progress + 1, 75),
              uploadSpeed: speed,
              estimatedTime: estimatedRemainingTime
            };
          }
          return prev;
        });
      }, 1000);

      try {
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: videoFile
        });

        clearInterval(progressInterval);

        setUploadProgress(prev => ({
          ...prev,
          progress: 75
        }));

        let thumbnailUrl = null;
        if (data.thumbnail) {
          setUploadProgress(prev => ({
            ...prev,
            progress: 78,
            stage: 'uploading',
            fileName: 'Uploading thumbnail...'
          }));

          const result = await base44.integrations.Core.UploadFile({
            file: data.thumbnail
          });
          thumbnailUrl = result.file_url;
        }

        setUploadProgress(prev => ({
          ...prev,
          stage: 'processing',
          progress: 80
        }));

        let duration = 0;
        try {
          const video = document.createElement('video');
          duration = await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              resolve(Math.floor(video.duration));
            };
            video.onerror = () => {
              resolve(0);
            };
            video.src = URL.createObjectURL(videoFile);
          });
        } catch (error) {
          console.error("Error getting video duration:", error);
          duration = 0;
        }

        setUploadProgress(prev => ({
          ...prev,
          progress: 90
        }));

        // Auto-approve for ALL logged-in users
        const contentStatus = "approved";

        const videoData = {
          title: data.title,
          description: data.description || "",
          video_url: file_url,
          thumbnail_url: thumbnailUrl,
          category: data.category,
          speaker: data.speaker || null,
          duration: duration,
          file_size: videoFile.size,
          language: data.language || null,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
          published_date: new Date().toISOString(),
          view_count: 0,
          featured: false,
          status: contentStatus, // Auto-approve for all users
          created_by: user ? user.email : null,
        };

        const createdVideo = await base44.entities.VideoPodcast.create(videoData);

        // Format duration for email
        const formatTime = (seconds) => {
          const hrs = Math.floor(seconds / 3600);
          const mins = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;
          
          if (hrs > 0) {
            return `${hrs}h ${mins}m ${secs}s`;
          }
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Send notification email
        const emailBody = `
<h2>🎬 New Video Published (Auto-Approved)</h2>

<p style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px;">
✅ This video was auto-published and is now LIVE!
</p>

<h3>Video Details:</h3>
<ul>
  <li><strong>Title:</strong> ${data.title || 'Untitled'}</li>
  <li><strong>Description:</strong> ${data.description || 'No description provided'}</li>
  <li><strong>Category:</strong> ${data.category}</li>
  ${data.speaker ? `<li><strong>Speaker:</strong> ${data.speaker}</li>` : ''}
  ${data.language ? `<li><strong>Language:</strong> ${data.language}</li>` : ''}
  ${data.tags ? `<li><strong>Tags:</strong> ${data.tags}</li>` : ''}
  <li><strong>Duration:</strong> ${formatTime(duration)}</li>
  <li><strong>File Size:</strong> ${(videoFile.size / 1024 / 1024).toFixed(2)} MB</li>
  <li><strong>Uploaded by:</strong> ${user?.email || 'Anonymous'}</li>
  <li><strong>Upload Date:</strong> ${new Date().toLocaleString()}</li>
  <li><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">LIVE ✅</span></li>
</ul>

<h3>Video File:</h3>
<p><a href="${file_url}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Watch Video</a></p>
<p>Direct link: <a href="${file_url}">${file_url}</a></p>

${thumbnailUrl ? `
<h3>Thumbnail:</h3>
<p><a href="${thumbnailUrl}" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Thumbnail</a></p>
<img src="${thumbnailUrl}" style="max-width: 400px; margin-top: 10px; border-radius: 8px;" />
` : ''}

<hr style="margin: 20px 0;" />

<p style="color: #666; font-size: 12px; margin-top: 30px;">
This video was automatically published. All logged-in users can now upload content without moderation.
</p>
        `;

        base44.integrations.Core.SendEmail({
          to: "imediac786@gmail.com",
          subject: `✅ Video Published: ${data.title}`,
          body: emailBody
        }).catch(err => console.error("Email notification failed:", err));

        setUploadProgress(prev => ({
          ...prev,
          stage: 'complete',
          progress: 100
        }));

        setTimeout(() => {
          setUploadProgress({
            show: false,
            stage: 'compressing',
            progress: 0,
            fileName: '',
            fileSize: 0,
            uploadSpeed: 0,
            estimatedTime: 0
          });
        }, 2000);

        return file_url;
      } finally {
        clearInterval(progressInterval);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
      
      toast.success("✅ Video published successfully!");
      toast.info("Your video is now live!");
      
      setShowUploadForm(false);
      setUploadForm({
        title: "",
        description: "",
        category: "Lectures",
        speaker: "",
        language: "",
        tags: "",
        video_file: null,
        thumbnail: null,
      });
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      try { setTimeout(() => { window.location.reload(); }, 300); } catch {}
    },
    onError: (error) => {
      setUploadProgress({
        show: false,
        stage: 'compressing',
        progress: 0,
        fileName: '',
        fileSize: 0,
        uploadSpeed: 0,
        estimatedTime: 0
      });
      toast.error("Failed to upload video: " + error.message);
      console.error("Upload error:", error);
    }
  });

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VideoPodcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
      toast.success("✅ Video updated successfully!");
      setEditingVideo(null);
      setEditForm({});
      // If the selected video was being edited, update it in the view dialog
      setSelectedVideo(prev => prev && prev.id === editingVideo.id ? { ...prev, ...editForm } : prev);
    },
    onError: (error) => {
      toast.error("Failed to update video: " + error.message);
      console.error("Update error:", error);
    }
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id) => base44.entities.VideoPodcast.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
      toast.success("Video deleted!");
      setEditingVideo(null); // Close edit dialog if open
      setSelectedVideo(null); // Close view dialog if open
      // Also remove from any playlists that contain this video
      playlists.forEach(playlist => {
        if (playlist.video_ids?.includes(id)) {
          removeFromPlaylist(playlist, id);
        }
      });
    },
    onError: (error) => {
      toast.error("Failed to delete video: " + error.message);
      console.error("Delete error:", error);
    }
  });

  const incrementViewCountMutation = useMutation({
    mutationFn: async (videoId) => {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      await base44.entities.VideoPodcast.update(videoId, {
        view_count: (video.view_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (data) => {
      const playlist = await base44.entities.VideoPlaylist.create({
        ...data,
        user_email: user.email,
        video_ids: [],
        video_count: 0,
        total_duration: 0,
      });
      return playlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoPlaylists'] });
      toast.success("✅ Playlist created!");
      setShowCreatePlaylist(false);
      setPlaylistForm({ name: "", description: "" });
    },
    onError: (error) => {
      toast.error("Failed to create playlist: " + error.message);
      console.error("Create playlist error:", error);
    }
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VideoPlaylist.update(id, data),
    onSuccess: (updatedPlaylist) => {
      queryClient.invalidateQueries({ queryKey: ['videoPlaylists'] });
      toast.success("✅ Playlist updated!");
      if (showPlaylistDetails?.id === updatedPlaylist.id) {
        setShowPlaylistDetails(updatedPlaylist);
      }
      if (currentPlaylist?.id === updatedPlaylist.id) {
        setCurrentPlaylist(updatedPlaylist);
      }
      if (editingPlaylist?.id === updatedPlaylist.id) {
        setEditingPlaylist(null);
        setPlaylistEditForm({ name: "", description: "" });
      }
    },
    onError: (error) => {
      toast.error("Failed to update playlist: " + error.message);
      console.error("Update playlist error:", error);
    }
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: (id) => base44.entities.VideoPlaylist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoPlaylists'] });
      toast.success("Playlist deleted!");
      setShowPlaylistDetails(null);
      if (currentPlaylist?.id === showPlaylistDetails?.id) {
        setCurrentPlaylist(null);
      }
    },
    onError: (error) => {
      toast.error("Failed to delete playlist: " + error.message);
      console.error("Delete playlist error:", error);
    }
  });

  const handleUploadSubmit = (e) => {
    e.preventDefault();

    if (!uploadForm.title || !uploadForm.video_file) {
      toast.error("Please provide title and video file");
      return;
    }

    uploadMutation.mutate(uploadForm);
  };

  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error("Please select a video file");
        return;
      }

      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video file is too large. Maximum size is 500MB");
        return;
      }

      setUploadForm(prev => ({...prev, video_file: file}));
      toast.success("Video file loaded!");

      // Auto-generate thumbnail from video if no thumbnail is set
      if (!uploadForm.thumbnail) {
        toast.info("Generating thumbnail from video...");
        try {
          const thumbnail = await extractThumbnailFromVideo(file);
          setUploadForm(prev => ({...prev, thumbnail: thumbnail}));
          toast.success("Thumbnail generated automatically!");
        } catch (error) {
          console.error("Failed to generate thumbnail:", error);
          toast.warning("Couldn't generate thumbnail automatically. You can upload one manually.");
        }
      }
    }
  };

  const extractThumbnailFromVideo = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Set canvas size to video dimensions (16:9 ratio preferred)
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to 2 seconds or 10% of video duration, whichever is smaller
        const seekTime = Math.min(2, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailFile = new File(
                [blob],
                `${videoFile.name.split('.')[0]}-thumbnail.jpg`,
                { type: 'image/jpeg' }
              );
              resolve(thumbnailFile);
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          }, 'image/jpeg', 0.9);

          // Clean up
          URL.revokeObjectURL(video.src);
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      // Load the video
      video.src = URL.createObjectURL(videoFile);
    });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      setUploadForm({...uploadForm, thumbnail: file});
      toast.success("Thumbnail loaded!");
    }
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    incrementViewCountMutation.mutate(video.id);
  };

  const handleEditVideo = (video) => {
    setEditForm({
      title: video.title,
      description: video.description || "",
      category: video.category,
      speaker: video.speaker || "",
      language: video.language || "",
      tags: video.tags ? video.tags.join(', ') : "",
    });
    setEditingVideo(video);
  };

  const handleSaveEdit = () => {
    if (!editForm.title || !editingVideo) {
      toast.error("Title cannot be empty.");
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
    
    updateVideoMutation.mutate({ id: editingVideo.id, data: updateData });
  };

  const handleDeleteVideo = (videoId) => {
    if (confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const addToPlaylist = (playlist, videoId) => {
    if (playlist.video_ids?.includes(videoId)) {
      toast.info("Video already in this playlist");
      return;
    }
    
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const newVideoIds = [...(playlist.video_ids || []), videoId];
    const newDuration = (playlist.total_duration || 0) + (video.duration || 0);

    updatePlaylistMutation.mutate({
      id: playlist.id,
      data: {
        video_ids: newVideoIds,
        video_count: newVideoIds.length,
        total_duration: newDuration,
      }
    });
    toast.success(`Added to ${playlist.name}`);
  };

  const removeFromPlaylist = (playlist, videoId) => {
    const video = videos.find(v => v.id === videoId);
    const newVideoIds = playlist.video_ids.filter(id => id !== videoId);
    const newDuration = (playlist.total_duration || 0) - (video?.duration || 0);

    updatePlaylistMutation.mutate({
      id: playlist.id,
      data: {
        video_ids: newVideoIds,
        video_count: newVideoIds.length,
        total_duration: Math.max(0, newDuration),
      }
    });
    toast.info(`Removed from ${playlist.name}`);
  };

  const reorderPlaylist = (playlist, result) => {
    if (!result.destination) return;

    const newVideoIds = Array.from(playlist.video_ids);
    const [removed] = newVideoIds.splice(result.source.index, 1);
    newVideoIds.splice(result.destination.index, 0, removed);

    updatePlaylistMutation.mutate({
      id: playlist.id,
      data: { video_ids: newVideoIds }
    });
  };

  const playPlaylist = (playlist, startIndex = 0) => {
    if (!playlist.video_ids || playlist.video_ids.length === 0) {
      toast.error("Playlist is empty");
      return;
    }

    const video = videos.find(v => v.id === playlist.video_ids[startIndex]);
    if (!video) {
      toast.error("Video not found");
      return;
    }

    setCurrentPlaylist(playlist);
    setCurrentPlaylistIndex(startIndex);
    handleVideoClick(video);
    toast.info(`Playing: ${playlist.name}`);
  };

  const handleEditPlaylist = (playlist) => {
    setPlaylistEditForm({
      name: playlist.name,
      description: playlist.description || ""
    });
    setEditingPlaylist(playlist);
  };

  const handleSavePlaylistEdit = () => {
    if (!playlistEditForm.name || !editingPlaylist) {
      toast.error("Playlist name cannot be empty.");
      return;
    }

    updatePlaylistMutation.mutate({
      id: editingPlaylist.id,
      data: {
        name: playlistEditForm.name,
        description: playlistEditForm.description
      }
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (video.title || "").toLowerCase().includes(searchLower) ||
      (video.description || "").toLowerCase().includes(searchLower) ||
      (video.speaker || "").toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50">
              <Video className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Islamic Video Library</h1>
          <p className="text-gray-700 text-sm md:text-lg">Watch Islamic lectures, lessons and talks</p>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            onClick={() => {
              setShowUploadForm(!showUploadForm);
              setShowRules(false);
              setShowPlaylists(false);
            }}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
          >
            {showUploadForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {showUploadForm ? "Cancel Upload" : "Upload Video"}
          </Button>

          <Button
            onClick={() => {
              setShowRules(!showRules);
              setShowUploadForm(false);
              setShowPlaylists(false);
            }}
            variant="outline"
            className="border-blue-600 text-blue-700 hover:bg-blue-50"
          >
            <Info className="w-5 h-5 mr-2" />
            Upload Guidelines
          </Button>

          {user && (
            <Button 
              onClick={() => {
                setShowPlaylists(!showPlaylists);
                setShowUploadForm(false);
                setShowRules(false);
              }}
              variant="outline"
              className="border-blue-600 text-blue-700 hover:bg-blue-50"
            >
              <ListVideo className="w-5 h-5 mr-2" />
              My Playlists ({playlists.length})
            </Button>
          )}
        </div>

        {showRules && (
          <Card className="bg-white border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Video Upload Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  ✅ Allowed Content
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Islamic Lectures:</strong> Educational talks by qualified scholars</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Quran Recitation:</strong> Beautiful recitations with proper tajweed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Tafsir:</strong> Quranic explanations and commentary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Islamic History:</strong> Educational content about Islamic history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Nasheeds:</strong> Islamic vocal music with no instruments</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ❌ Prohibited Content
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Inappropriate Content:</strong> No content contradicting Islamic values</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Copyrighted Material:</strong> Only upload content you have rights to</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Poor Quality:</strong> Avoid low-quality videos</span>
                  </li>
                </ul>
              </div>

              <Alert className="bg-blue-50 border-blue-300">
                <Info className="w-4 h-4 text-blue-700" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>📱 File Size Limit:</strong> Maximum video file size is 500MB. For larger files, consider compressing the video first.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {showUploadForm && (
          <Card className="bg-white border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload New Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Upload Method Selector */}
              <Tabs value={uploadMethod} onValueChange={setUploadMethod} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex items-center gap-2">
                    <Youtube className="w-4 h-4" />
                    YouTube URL
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (uploadMethod === "youtube") {
                  handleYouTubeSubmit();
                } else {
                  handleUploadSubmit(e);
                }
              }} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-gray-800">Title *</Label>
                    <Input
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                      placeholder="Video title"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-gray-800">Description</Label>
                    <Textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                      placeholder="Brief description"
                      className="bg-white border-gray-300 text-gray-900 h-24"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-800">Category *</Label>
                    <Select
                      value={uploadForm.category}
                      onValueChange={(value) => setUploadForm({...uploadForm, category: value})}
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-800">{uploadForm.category === "Nasheeds" ? "Artist" : "Speaker/Scholar"}</Label>
                    <div className="space-y-2">
                      <Select
                        value={(uploadForm.category === "Nasheeds" ? nasheedArtists : speakers).includes(uploadForm.speaker) ? uploadForm.speaker : ""}
                        onValueChange={(value) => setUploadForm({...uploadForm, speaker: value})}
                      >
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue placeholder={uploadForm.category === "Nasheeds" ? "Select artist..." : "Select from list..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {(uploadForm.category === "Nasheeds" ? nasheedArtists : speakers).map(person => (
                            <SelectItem key={person} value={person}>
                              {person}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <Input
                          value={(uploadForm.category === "Nasheeds" ? nasheedArtists : speakers).includes(uploadForm.speaker) ? "" : uploadForm.speaker}
                          onChange={(e) => setUploadForm({...uploadForm, speaker: e.target.value})}
                          placeholder="Or type name manually..."
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      {youtubeSearchError && (
                        <div className="text-sm text-red-600 mt-2">
                          {youtubeSearchError}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Select from list or type a custom name</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-800">Language</Label>
                    <Input
                      value={uploadForm.language}
                      onChange={(e) => setUploadForm({...uploadForm, language: e.target.value})}
                      placeholder="Arabic, English, Urdu..."
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-800">Tags</Label>
                    <Input
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                      placeholder="ramadan, prayer, quran"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>

                  {uploadMethod === "youtube" ? (
                    <div className="md:col-span-2 space-y-4">
                      {/* YouTube Search */}
                      <div>
                        <Label className="text-gray-800 mb-2 block">🔍 Search YouTube</Label>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          {getYouTubeApiKey() ? (
                            <Badge className="bg-green-100 text-green-700">API key detected</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">API key missing</Badge>
                          )}
                          {getYouTubeApiKey() && (
                            <span>
                              source: {import.meta.env.VITE_YOUTUBE_API_KEY ? 'env' : (typeof localStorage !== 'undefined' && localStorage.getItem('youtube_api_key') ? 'localStorage' : '')}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Input
                            value={youtubeSearchQuery}
                            onChange={(e) => setYoutubeSearchQuery(e.target.value)}
                            placeholder="Search for videos on YouTube..."
                            className="bg-white border-gray-300 text-gray-900 flex-1 min-w-[240px]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                searchYouTube();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={searchYouTube}
                            disabled={isSearchingYouTube || !youtubeSearchQuery.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white px-6"
                          >
                            {isSearchingYouTube ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Search className="w-4 h-4 mr-2" />
                                Search
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={verifyYouTubeApi}
                            variant="outline"
                            className="px-4"
                          >
                            Test API
                          </Button>
                          <Input
                            value={youtubeApiKeyInput}
                            onChange={(e) => setYoutubeApiKeyInput(e.target.value)}
                            placeholder="YouTube API Key"
                            className="bg-white border-gray-300 text-gray-900 w-[260px]"
                          />
                          <Button type="button" variant="outline" onClick={saveYouTubeApiKey}>
                            Save Key
                          </Button>
                        </div>
                      </div>

                      {/* Search Results */}
                      {youtubeSearchResults.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-gray-800">Select videos to import ({selectedYoutubeVideos.length} selected):</Label>
                            {selectedYoutubeVideos.length > 0 && (
                              <Button
                                type="button"
                                onClick={importSelectedVideos}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Importing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Import {selectedYoutubeVideos.length} Video{selectedYoutubeVideos.length > 1 ? 's' : ''}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                            {youtubeSearchResults.map((video, idx) => {
                              const isSelected = selectedYoutubeVideos.some(v => v.videoId === video.videoId);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleVideoSelection(video)}
                                  className={`flex gap-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm ${
                                    isSelected 
                                      ? 'bg-green-50 border-green-400 ring-2 ring-green-200' 
                                      : 'bg-white border-gray-200 hover:bg-red-50 hover:border-red-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-center w-6">
                                    {isSelected ? (
                                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    ) : (
                                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                                    )}
                                  </div>
                                  <img
                                    src={getYouTubeThumbnail(video.videoId)}
                                    alt={video.title}
                                    className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 line-clamp-2">{video.title}</h4>
                                    {video.channel && (
                                      <p className="text-sm text-gray-500 mt-1">📺 {video.channel}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {localSearchResults.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-gray-800">Local results ({localSearchResults.length})</Label>
                          </div>
                          <div className="grid gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                            {localSearchResults.map((v) => (
                              <div key={v.id} className="flex gap-3 p-3 border rounded-lg bg-white border-gray-200">
                                <img
                                  src={v.thumbnail_url}
                                  alt={v.title}
                                  className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 line-clamp-2">{v.title}</h4>
                                  {v.speaker && (
                                    <p className="text-sm text-gray-500 mt-1">{v.speaker}</p>
                                  )}
                                </div>
                                <Badge className="self-start bg-blue-100 text-blue-700">Uploaded</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Loading State */}
                      {isSearchingYouTube && (
                        <div className="flex items-center justify-center gap-3 p-6 bg-gray-50 rounded-lg border border-gray-200">
                          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                          <span className="text-gray-700">Searching YouTube...</span>
                        </div>
                      )}

                      {/* Selected Videos Summary */}
                      {selectedYoutubeVideos.length > 0 && youtubeSearchResults.length === 0 && (
                        <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                              <p className="font-medium text-gray-900">{selectedYoutubeVideos.length} video{selectedYoutubeVideos.length > 1 ? 's' : ''} ready to import</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedYoutubeVideos([])}
                              className="text-red-600 hover:text-red-700"
                            >
                              Clear All
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedYoutubeVideos.map((video, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                <img src={getYouTubeThumbnail(video.videoId)} alt="" className="w-16 h-10 rounded object-cover" />
                                <span className="line-clamp-1 flex-1">{video.title}</span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleVideoSelection(video)}
                                  className="h-6 w-6 text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      {selectedYoutubeVideos.length === 0 && (
                        <>
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-3 bg-white text-gray-500">or paste URL directly</span>
                            </div>
                          </div>

                          {/* Direct URL Input */}
                          <div>
                            <Label className="text-gray-800 mb-2 block">YouTube Video URL</Label>
                            <Input
                              value={youtubeUrl}
                              onChange={(e) => setYoutubeUrl(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="bg-white border-gray-300 text-gray-900"
                            />
                          </div>

                          {/* Category for direct URL */}
                          {youtubeUrl && extractYouTubeVideoId(youtubeUrl) && (
                            <div>
                              <Label className="text-gray-800 mb-2 block">Category/Topic *</Label>
                              <Select
                                value={uploadForm.category}
                                onValueChange={(value) => setUploadForm({...uploadForm, category: value})}
                              >
                                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Selected Video Preview */}
                          {youtubeUrl && extractYouTubeVideoId(youtubeUrl) && (
                            <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
                              <div className="flex items-center gap-3 mb-3">
                                <Youtube className="w-8 h-8 text-red-600" />
                                <div>
                                  <p className="font-medium text-gray-900">✅ Video Selected</p>
                                  <p className="text-xs text-gray-500">ID: {extractYouTubeVideoId(youtubeUrl)}</p>
                                </div>
                              </div>
                              <img 
                                src={getYouTubeThumbnail(extractYouTubeVideoId(youtubeUrl))} 
                                alt="Thumbnail"
                                className="w-full rounded-lg"
                              />
                            </div>
                          )}
                          
                          {youtubeUrl && !extractYouTubeVideoId(youtubeUrl) && (
                            <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                              <p className="text-sm text-red-700">❌ Invalid YouTube URL</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <Label className="text-gray-800 mb-2 block">Video File * (Max 500MB)</Label>
                        <div className="space-y-3">
                          <input
                            ref={videoFileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileChange}
                            className="w-full p-3 border-2 border-red-400 rounded-lg text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                          />
                          {uploadForm.video_file && (
                            <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                              <div className="text-gray-900">
                                <Video className="w-12 h-12 mx-auto mb-2 text-red-600" />
                                <p className="font-medium text-center">{uploadForm.video_file.name}</p>
                                <p className="text-sm text-gray-600 mt-1 text-center">
                                  {(uploadForm.video_file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-gray-600 text-center">
                            Supported formats: MP4, MOV, AVI, MKV, WebM
                          </p>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-gray-800 mb-2 block">Thumbnail (Optional)</Label>
                        <div className="space-y-3">
                          <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="w-full p-3 border-2 border-blue-400 rounded-lg text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                          />
                          {uploadForm.thumbnail && (
                            <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                              <div className="text-gray-900">
                                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-blue-600" />
                                <p className="font-medium text-center">{uploadForm.thumbnail.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUploadForm(false);
                      setYoutubeUrl("");
                    }}
                    className="flex-1 border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                  {uploadMethod === "youtube" && selectedYoutubeVideos.length > 0 ? (
                    <Button
                      type="button"
                      onClick={importSelectedVideos}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing {selectedYoutubeVideos.length} videos...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Import {selectedYoutubeVideos.length} Video{selectedYoutubeVideos.length > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={
                        uploadMutation.isPending || 
                        isProcessing || 
                        (uploadMethod === "youtube" ? (!youtubeUrl || !extractYouTubeVideoId(youtubeUrl) || !uploadForm.title) : (!uploadForm.video_file || !uploadForm.title))
                      }
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                    >
                      {uploadMutation.isPending || isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {uploadMethod === "youtube" ? "Adding..." : "Uploading..."}
                        </>
                      ) : (
                        <>
                          {uploadMethod === "youtube" ? (
                            <>
                              <Youtube className="w-4 h-4 mr-2" />
                              Add YouTube Video
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Video
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {uploadProgress.show && (
          <UploadProgress
            stage={uploadProgress.stage}
            progress={uploadProgress.progress}
            fileName={uploadProgress.fileName}
            fileSize={uploadProgress.fileSize}
            uploadSpeed={uploadProgress.uploadSpeed}
            estimatedTime={uploadProgress.estimatedTime}
          />
        )}

        {/* Playlists Section */}
        {showPlaylists && user && (
          <Card className="bg-white border-blue-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <ListVideo className="w-5 h-5" />
                  My Video Playlists
                </CardTitle>
                <Button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Playlist
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPlaylists ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : playlists.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlists.map(playlist => (
                    <Card 
                      key={playlist.id}
                      className="bg-white border-blue-200 hover:border-blue-400 transition-all shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <ListVideo className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-semibold line-clamp-1">{playlist.name}</h3>
                            <p className="text-gray-600 text-sm line-clamp-1">{playlist.description || "No description"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs border-red-400 text-red-700">
                                {playlist.video_count || 0} videos
                              </Badge>
                              <Badge variant="outline" className="text-xs border-red-400 text-red-700">
                                {formatDuration(playlist.total_duration || 0)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => playPlaylist(playlist)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            disabled={!playlist.video_ids || playlist.video_ids.length === 0}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPlaylistDetails(playlist)}
                            className="border-red-400 text-red-700"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPlaylist(playlist)}
                            className="border-emerald-400 text-emerald-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <ShareButtons
                            title={playlist.name}
                            description={`${playlist.description || 'Video playlist'} - ${playlist.video_count || 0} videos`}
                            contentType="playlist"
                            contentId={playlist.id}
                            compact={true}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ListVideo className="w-16 h-16 mx-auto mb-4 text-red-400 opacity-50" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Playlists Yet</h3>
                  <p className="text-gray-700 mb-4">Create your first playlist!</p>
                  <Button onClick={() => setShowCreatePlaylist(true)} className="bg-red-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Playlist
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Playlist Dialog */}
        <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
          <DialogContent className="bg-white border-blue-200 text-gray-900">
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
                  required
                />
              </div>
              <div>
                <Label className="text-gray-800">Description</Label>
                <Textarea
                  value={playlistForm.description}
                  onChange={(e) => setPlaylistForm({...playlistForm, description: e.target.value})}
                  placeholder="Collection of my favorite videos..."
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreatePlaylist(false);
                    setPlaylistForm({ name: "", description: "" });
                  }}
                  className="flex-1 border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => createPlaylistMutation.mutate(playlistForm)}
                  disabled={!playlistForm.name || createPlaylistMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {createPlaylistMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Create Playlist
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Playlist Dialog */}
        <Dialog open={!!editingPlaylist} onOpenChange={setEditingPlaylist}>
          <DialogContent className="bg-white border-blue-200 text-gray-900">
            <DialogHeader>
              <DialogTitle>Edit Playlist</DialogTitle>
              <DialogDescription className="text-gray-700">
                Update your playlist name and description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-800">Playlist Name *</Label>
                <Input
                  value={playlistEditForm.name}
                  onChange={(e) => setPlaylistEditForm({...playlistEditForm, name: e.target.value})}
                  placeholder="My Favorites"
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-800">Description</Label>
                <Textarea
                  value={playlistEditForm.description}
                  onChange={(e) => setPlaylistEditForm({...playlistEditForm, description: e.target.value})}
                  placeholder="Collection of my favorite videos..."
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingPlaylist(null);
                    setPlaylistEditForm({ name: "", description: "" });
                  }}
                  className="flex-1 border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePlaylistEdit}
                  disabled={!playlistEditForm.name || updatePlaylistMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {updatePlaylistMutation.isPending ? (
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

        {/* Playlist Details Dialog */}
        <Dialog open={!!showPlaylistDetails} onOpenChange={() => setShowPlaylistDetails(null)}>
          <DialogContent className="bg-white border-blue-200 text-gray-900 max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-gray-900">{showPlaylistDetails?.name}</DialogTitle>
                  <DialogDescription className="text-gray-700">
                    {showPlaylistDetails?.description || "No description"}
                  </DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs border-red-400 text-red-700">
                      {showPlaylistDetails?.video_count || 0} videos
                    </Badge>
                    <Badge variant="outline" className="text-xs border-red-400 text-red-700">
                      {formatDuration(showPlaylistDetails?.total_duration || 0)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <ShareButtons
                    title={showPlaylistDetails?.name || "Playlist"}
                    description={`${showPlaylistDetails?.description || 'Video playlist'} - ${showPlaylistDetails?.video_count || 0} videos`}
                    contentType="playlist"
                    contentId={showPlaylistDetails?.id}
                    compact={false}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      handleEditPlaylist(showPlaylistDetails);
                      setShowPlaylistDetails(null); // Close view dialog when opening edit dialog
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Edit className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this playlist? This action cannot be undone.")) {
                        deletePlaylistMutation.mutate(showPlaylistDetails.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deletePlaylistMutation.isPending}
                  >
                    {deletePlaylistMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            {showPlaylistDetails && (
              <div className="space-y-4">
                {showPlaylistDetails.video_ids && showPlaylistDetails.video_ids.length > 0 ? (
                  <DragDropContext onDragEnd={(result) => reorderPlaylist(showPlaylistDetails, result)}>
                    <Droppable droppableId="playlist">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {showPlaylistDetails.video_ids.map((videoId, index) => {
                            const video = videos.find(v => v.id === videoId);
                            if (!video) return null;

                            return (
                              <Draggable key={videoId} draggableId={videoId} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-300 ${
                                      snapshot.isDragging ? 'shadow-lg shadow-red-200' : ''
                                    }`}
                                  >
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                      <GripVertical className="w-5 h-5 text-gray-500" />
                                    </div>
                                    
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                      {video.thumbnail_url ? (
                                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <Video className="w-8 h-8 text-white" />
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-gray-900 font-medium line-clamp-1">{video.title}</h4>
                                      <p className="text-gray-600 text-sm">{video.speaker || video.category}</p>
                                    </div>
                                    
                                    <Badge variant="outline" className="text-xs border-gray-400 text-gray-700">
                                      {formatDuration(video.duration)}
                                    </Badge>
                                    
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        playPlaylist(showPlaylistDetails, index);
                                        setShowPlaylistDetails(null);
                                      }}
                                      className="hover:bg-red-100 text-red-600"
                                    >
                                      <Play className="w-4 h-4" />
                                    </Button>
                                    
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => removeFromPlaylist(showPlaylistDetails, videoId)}
                                      className="hover:bg-red-100 text-red-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="text-center py-8">
                    <Video className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-gray-700">No videos in this playlist yet</p>
                    <p className="text-sm text-gray-600 mt-1">Use the "+" button on video cards to add them</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos..."
            className="pl-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 h-12 rounded-2xl"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap justify-center gap-3">
          {/* Topics Dropdown */}
          <Select
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val)}
          >
            <SelectTrigger className="w-48 bg-white border-red-300 text-gray-900">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-red-600" />
                <SelectValue placeholder="Topics" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Topics ({videos.length})</SelectItem>
              {categories.map(cat => {
                const count = videos.filter(v => v.category === cat.value).length;
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.value} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Quran Reciters Dropdown */}
          {(() => {
            const quranVideos = videos.filter(v => v.category === "Quran");
            const reciters = [...new Set(quranVideos.map(v => v.speaker).filter(Boolean))];
            return (
              <Select
                value={searchTerm && reciters.includes(searchTerm) ? searchTerm : ""}
                onValueChange={(val) => setSearchTerm(val === "all" ? "" : val)}
              >
                <SelectTrigger className="w-48 bg-white border-green-300 text-gray-900">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-600" />
                    <SelectValue placeholder="Quran Reciters" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reciters</SelectItem>
                  {reciters.length > 0 ? reciters.map(reciter => (
                    <SelectItem key={reciter} value={reciter}>{reciter}</SelectItem>
                  )) : (
                    <SelectItem value="none" disabled>No reciters yet</SelectItem>
                  )}
                </SelectContent>
              </Select>
            );
          })()}

          {/* Nasheeds Artists Dropdown */}
          {(() => {
            const nasheedVideos = videos.filter(v => v.category === "Nasheeds");
            const artists = [...new Set(nasheedVideos.map(v => v.speaker).filter(Boolean))];
            return (
              <Select
                value={searchTerm && artists.includes(searchTerm) ? searchTerm : ""}
                onValueChange={(val) => setSearchTerm(val === "all" ? "" : val)}
              >
                <SelectTrigger className="w-48 bg-white border-pink-300 text-gray-900">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-pink-600" />
                    <SelectValue placeholder="Nasheed Artists" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Artists</SelectItem>
                  {artists.length > 0 ? artists.map(artist => (
                    <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                  )) : (
                    <SelectItem value="none" disabled>No artists yet</SelectItem>
                  )}
                </SelectContent>
              </Select>
            );
          })()}

          {/* General Speakers Dropdown */}
          {(() => {
            const otherVideos = videos.filter(v => v.category !== "Quran" && v.category !== "Nasheeds");
            const speakersList = [...new Set(otherVideos.map(v => v.speaker).filter(Boolean))];
            return (
              <Select
                value={searchTerm && speakersList.includes(searchTerm) ? searchTerm : ""}
                onValueChange={(val) => setSearchTerm(val === "all" ? "" : val)}
              >
                <SelectTrigger className="w-48 bg-white border-indigo-300 text-gray-900">
                  <div className="flex items-center gap-2">
                    <Mic2 className="w-4 h-4 text-indigo-600" />
                    <SelectValue placeholder="Speakers" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Speakers</SelectItem>
                  {speakersList.length > 0 ? speakersList.map(speaker => (
                    <SelectItem key={speaker} value={speaker}>{speaker}</SelectItem>
                  )) : (
                    <SelectItem value="none" disabled>No speakers yet</SelectItem>
                  )}
                </SelectContent>
              </Select>
            );
          })()}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-700 mt-4">Loading videos...</p>
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                className="bg-white border-gray-300 hover:border-blue-400 hover:shadow-xl transition-all group"
              >
                <CardContent className="p-0">
                  <div 
                    className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden cursor-pointer"
                    onClick={() => handleVideoClick(video)}
                  >
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          // Fallback to a gradient if image fails to load
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add('bg-gradient-to-br', 'from-red-500', 'to-pink-500');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-500">
                        <Video className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-red-600 ml-1" />
                      </div>
                    </div>
                    {video.duration > 0 && (
                      <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                        {formatDuration(video.duration)}
                      </Badge>
                    )}
                    {user && user.email === video.created_by && (
                      <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
                        Your Video
                      </Badge>
                    )}
                    {video.status === 'pending' && (
                      <Badge className="absolute top-2 right-2 bg-yellow-600 text-white">
                        Pending Approval
                      </Badge>
                    )}
                    {video.status === 'rejected' && (
                      <Badge className="absolute top-2 right-2 bg-red-600 text-white">
                        Rejected
                      </Badge>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 font-semibold line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {video.title}
                        </h3>
                        {video.speaker && (
                          <p className="text-gray-600 text-sm mt-1">{video.speaker}</p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {/* Favorite Button */}
                        <FavoriteButton
                          contentId={video.id}
                          contentType="video"
                          contentTitle={video.title}
                          contentThumbnail={video.thumbnail_url}
                          contentCategory={video.category}
                          size="icon"
                        />
                        {/* Share Button */}
                        <ShareButtons
                          title={video.title}
                          description={video.description}
                          contentType="video"
                          contentId={video.id}
                          compact={true}
                        />

                        {user && (user.email === video.created_by || user.role === 'admin') && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleEditVideo(video); }}
                            className="rounded-full hover:bg-blue-100 text-blue-600 h-8 w-8"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}

                        {user && playlists.length > 0 && video.status === 'approved' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-full hover:bg-red-100 text-red-600 h-8 w-8"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white border-gray-300">
                              {playlists.map(playlist => (
                                <DropdownMenuItem
                                  key={playlist.id}
                                  onClick={(e) => { e.stopPropagation(); addToPlaylist(playlist, video.id); }}
                                  className="text-gray-900 hover:bg-red-50 cursor-pointer flex items-center justify-between"
                                >
                                  <div className="flex items-center">
                                    <ListVideo className="w-4 h-4 mr-2" />
                                    {playlist.name}
                                  </div>
                                  {playlist.video_ids?.includes(video.id) && (
                                    <Check className="w-4 h-4 ml-auto text-green-600" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className="border-red-400 text-red-700 mb-2">
                        {video.category}
                    </Badge>

                    {video.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {video.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatViewCount(video.view_count || 0)} views
                      </span>
                      {video.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-gray-300 shadow-md">
            <CardContent className="p-12 text-center">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-700">Try a different category or search term</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Video Dialog */}
        <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Edit Video</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-800">Title *</Label>
                <Input
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  placeholder="Video title"
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-800">Description</Label>
                <Textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Brief description"
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>

              <div>
                <Label className="text-gray-800">Category *</Label>
                <Select
                  value={editForm.category || categories[0].value}
                  onValueChange={(value) => setEditForm({...editForm, category: value})}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-800">Speaker/Scholar</Label>
                <Select
                  value={editForm.speaker || ''}
                  onValueChange={(value) => setEditForm({...editForm, speaker: value})}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select speaker" />
                  </SelectTrigger>
                  <SelectContent>
                    {speakers.map(speaker => (
                      <SelectItem key={speaker} value={speaker}>
                        {speaker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-800">Language</Label>
                <Input
                  value={editForm.language || ''}
                  onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                  placeholder="Arabic, English, Urdu..."
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <Label className="text-gray-800">Tags</Label>
                <Input
                  value={editForm.tags || ''}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  placeholder="ramadan, prayer, quran (comma-separated)"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-4 items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteVideo(editingVideo.id)}
                  disabled={deleteVideoMutation.isPending}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteVideoMutation.isPending ? "Deleting..." : "Delete Video"}
                </Button>
                <div className="flex-1"></div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingVideo(null)}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updateVideoMutation.isPending || !editForm.title}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                >
                  {updateVideoMutation.isPending ? (
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

        {/* View Video Dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-gray-900 flex-1">{selectedVideo?.title}</DialogTitle>
                {user && selectedVideo && user.email === selectedVideo.created_by && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleEditVideo(selectedVideo);
                      setSelectedVideo(null); // Close view dialog when opening edit dialog
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Video
                  </Button>
                )}
              </div>
            </DialogHeader>

            {selectedVideo && (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {selectedVideo.video_url && selectedVideo.video_url.includes('youtube.com/embed') ? (
                    <iframe
                      src={selectedVideo.video_url}
                      controls
                      autoPlay
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={selectedVideo.title}
                    />
                  ) : (
                    <video
                      src={selectedVideo.video_url}
                      controls
                      autoPlay
                      className="w-full h-full"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="border-red-400 text-red-700">
                      {selectedVideo.category}
                    </Badge>
                    {selectedVideo.speaker && (
                      <Badge variant="outline" className="border-gray-400 text-gray-700">
                        {selectedVideo.speaker}
                      </Badge>
                    )}
                    {selectedVideo.language && (
                      <Badge variant="outline" className="border-gray-400 text-gray-700">
                        {selectedVideo.language}
                      </Badge>
                    )}
                  </div>

                  {selectedVideo.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Description</h4>
                      <p className="text-gray-700 text-sm">{selectedVideo.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewCount(selectedVideo.view_count || 0)} views
                    </span>
                    {selectedVideo.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(selectedVideo.duration)}
                      </span>
                    )}
                  </div>

                  {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedVideo.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-gray-400 text-gray-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Share and Engagement Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <FavoriteButton
                      contentId={selectedVideo.id}
                      contentType="video"
                      contentTitle={selectedVideo.title}
                      contentThumbnail={selectedVideo.thumbnail_url}
                      contentCategory={selectedVideo.category}
                      showCount={true}
                    />
                    <RatingWidget
                      contentId={selectedVideo.id}
                      contentType="video"
                      contentTitle={selectedVideo.title}
                    />
                    <ShareButtons
                      title={selectedVideo.title}
                      description={selectedVideo.description || `Watch ${selectedVideo.title} - ${selectedVideo.category}`}
                      contentType="video"
                      contentId={selectedVideo.id}
                      compact={false}
                    />
                  </div>
                </div>

                {/* AI Features Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <VideoAIFeatures 
                    video={selectedVideo}
                    onVideoUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
                    }}
                  />
                </div>

                {/* Comments Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <CommentsWidget
                    contentId={selectedVideo.id}
                    contentType="video"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
