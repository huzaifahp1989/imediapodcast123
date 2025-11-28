import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Music,
  Upload,
  Play,
  Pause,
  Search,
  Plus,
  X,
  Loader2,
  BookOpen,
  Mic2,
  MessageSquare,
  BookMarked,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  SkipBack,
  SkipForward,
  Info,
  CheckCircle2,
  AlertCircle,
  Settings,
  Timer,
  Gauge,
  ListMusic,
  Save,
  Trash2,
  GripVertical,
  Check,
  Headphones,
  Clock,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import ShareButtons from "@/components/ShareButtons";
import RatingWidget from "@/components/RatingWidget";
import CommentsWidget from "@/components/CommentsWidget";
import FavoriteButton from "@/components/FavoriteButton";

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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const speakers = [
  "Mufti Ismail Menk",
  "Sheikh Suleman Moola",
  "Maulana Tariq Jameel",
  "Maulana Suleman Khatani",
  "Nouman Ali Khan",
  "Omar Suleiman",
  "Yasir Qadhi",
  "Abdul Nasir Jangda",
  "Sheikh Hamza Yusuf",
  "Maulana Imtiyaz Sidat",
  "Other"
];

// Zain Bhikha is in nasheedArtists below, not in speakers

const nasheedArtists = [
  "Zain Bhikha",
  "Omar Esa",
  "Molana Imtiyaz Sidat",
  "Hafiz Mizaan",
  "Kamaluddin",
  "Muhammad al Muqit",
  "Mesut Kurtis",
  "Maher Zain",
  "Sami Yusuf",
  "Native Deen",
  "Dawud Wharnsby",
  "Maudh",
  "Ahmed Bukhatir",
  "Other"
];

const quranReciters = [
  "Sheikh Sudais",
  "Sheikh Shuraim",
  "Sheikh Shatri",
  "Sheikh Mishary Rashid Alafasy",
  "Sheikh Saad Al-Ghamdi",
  "Sheikh Maher Al Muaiqly",
  "Sheikh Ahmed Al Ajmi",
  "Sheikh Abdul Basit",
  "Sheikh Muhammad Ayyub",
  "Sheikh Ali Jaber",
  "Sheikh Nasser Al Qatami",
  "Other"
];

const categories = [
  { value: "Quran", icon: BookOpen, color: "from-green-500 to-emerald-500" },
  { value: "Hadith", icon: BookMarked, color: "from-orange-500 to-red-500" },
  { value: "Salah", icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
  { value: "Fiqh", icon: Volume2, color: "from-purple-500 to-indigo-500" },
  { value: "Aqeedah", icon: BookOpen, color: "from-pink-500 to-rose-500" },
  { value: "Nasheeds", icon: Music, color: "from-teal-500 to-cyan-500" },
  { value: "Talks", icon: Mic2, color: "from-indigo-500 to-purple-500" },
  { value: "Dua", icon: MessageSquare, color: "from-amber-500 to-yellow-500" },
  { value: "Lectures", icon: Volume2, color: "from-slate-500 to-gray-500" },
  { value: "Tafsir", icon: BookOpen, color: "from-emerald-500 to-green-500" },
  { value: "Seerah", icon: BookMarked, color: "from-blue-600 to-indigo-600" },
  { value: "Ramadan", icon: MessageSquare, color: "from-yellow-500 to-amber-500" },
  { value: "Hajj", icon: BookMarked, color: "from-orange-600 to-red-600" },
  { value: "Zakat", icon: Volume2, color: "from-green-600 to-emerald-600" },
  { value: "Islamic History", icon: BookOpen, color: "from-purple-600 to-pink-600" },
  { value: "Spirituality", icon: MessageSquare, color: "from-cyan-500 to-blue-500" },
];

const playbackSpeeds = [
  { label: "0.75x", value: 0.75 },
  { label: "1x", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
];

const sleepTimerOptions = [
  { label: "Off", value: 0 },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
];

export default function Audio() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSpeaker, setSelectedSpeaker] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sleepTimer, setSleepTimer] = useState(0);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState(0);
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);

  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showPlaylistDetails, setShowPlaylistDetails] = useState(null);
  const [playlistForm, setPlaylistForm] = useState({ name: "", description: "" });
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);

  const [editingAudio, setEditingAudio] = useState(null);
  const [editForm, setEditForm] = useState({}); // This line was changed
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [playlistEditForm, setPlaylistEditForm] = useState({ name: "", description: "" });

  const [viewingAudio, setViewingAudio] = useState(null);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const coverImageInputRef = useRef(null);
  const sleepTimerIntervalRef = useRef(null);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "Talks",
    speaker: "",
    language: "",
    tags: "",
    audio_file: null,
    cover_image: null,
  });

  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setUserLoaded(true);
      })
      .catch(() => {
        setUser(null);
        setUserLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (currentPlaylist && currentPlaylistIndex < currentPlaylist.audio_ids.length - 1) {
        playNextInPlaylist();
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentPlaylist, currentPlaylistIndex]);

  useEffect(() => {
    if (!currentPlaying || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentPlaying.title,
      artist: currentPlaying.speaker || currentPlaying.category,
      album: "Islamic Audio Library",
      artwork: currentPlaying.cover_image_url ? [
        { src: currentPlaying.cover_image_url, sizes: '512x512', type: 'image/png' }
      ] : []
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      setIsPlaying(true);
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      skipBackward();
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      skipForward();
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      audioRef.current?.pause();
      setCurrentPlaying(null);
      setIsPlaying(false);
    });

    if (currentPlaylist) {
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextInPlaylist();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPreviousInPlaylist();
      });
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      }
    };
  }, [currentPlaying, currentPlaylist]);

  useEffect(() => {
    if (sleepTimer > 0 && isPlaying) {
      if (sleepTimeRemaining <= 0 || sleepTimeRemaining > sleepTimer * 60) {
        setSleepTimeRemaining(sleepTimer * 60);
      }

      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }

      sleepTimerIntervalRef.current = setInterval(() => {
        setSleepTimeRemaining(prev => {
          if (prev <= 1) {
            if (audioRef.current) {
              audioRef.current.pause();
            }
            setSleepTimer(0);
            toast.info("⏰ Sleep timer ended - playback stopped");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (sleepTimerIntervalRef.current) {
          clearInterval(sleepTimerIntervalRef.current);
        }
      };
    } else {
      setSleepTimeRemaining(0);
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    }
  }, [sleepTimer, isPlaying]);

  const { data: audioContent, isLoading, refetch } = useQuery({
    queryKey: ['audioContent', user?.role, user?.email],
    queryFn: async () => {
      const allAudio = await base44.entities.AudioContent.list('-published_date');
      // Show all audio to admins, only approved to regular users and guests
      if (user?.role === 'admin') {
        return allAudio;
      }
      return allAudio.filter(a => a.status === 'approved');
    },
    enabled: userLoaded, // Only run after we've tried to load the user
    initialData: [],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Force refetch when user changes or is loaded
  useEffect(() => {
    if (userLoaded) {
      refetch();
    }
  }, [userLoaded, user?.role, user?.email, refetch]);

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery({
    queryKey: ['playlists', user?.email],
    queryFn: () => user ? base44.entities.Playlist.filter({ user_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: [],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      toast.info("⬆️ Uploading audio file...");
      
      const audioFile = data.audio_file;

      const { file_url } = await base44.integrations.Core.UploadFile({
        file: audioFile
      });

      let coverImageUrl = null;
      if (data.cover_image) {
        const result = await base44.integrations.Core.UploadFile({
          file: data.cover_image
        });
        coverImageUrl = result.file_url;
      }

      // Calculate duration - keeping this from original logic
      let duration = 0;
      try {
        const audio = new Audio();
        duration = await new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            resolve(Math.floor(audio.duration));
            URL.revokeObjectURL(audio.src); // Clean up the object URL
          };
          audio.onerror = () => {
            console.error("Error loading audio metadata for duration calculation.");
            resolve(0);
            URL.revokeObjectURL(audio.src); // Clean up the object URL
          };
          audio.src = URL.createObjectURL(audioFile); // Use Blob URL for local file
        });
      } catch (error) {
        console.error("Error getting audio duration:", error);
        duration = 0;
      }

      // Auto-approve for ALL logged-in users, no moderation record needed
      const audioData = {
        title: data.title,
        description: data.description || "",
        audio_url: file_url,
        cover_image_url: coverImageUrl,
        category: data.category,
        speaker: data.speaker || null,
        duration: duration, // Use calculated duration
        file_size: audioFile.size,
        language: data.language || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        published_date: new Date().toISOString(),
        play_count: 0,
        featured: false,
        status: "approved", // Auto-approve for all users
        created_by: user ? user.email : null, // Ensure created_by is set
      };

      const createdAudio = await base44.entities.AudioContent.create(audioData);

      // Format duration for email (local helper as per outline)
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      // Send notification email to admin as per outline
      const emailBody = `
<h2>🎵 New Audio Published (Auto-Approved)</h2>

<p style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px;">
✅ This audio was auto-published and is now LIVE!
</p>

<h3>Audio Details:</h3>
<ul>
  <li><strong>Title:</strong> ${data.title || 'Untitled'}</li>
  <li><strong>Description:</strong> ${data.description || 'No description provided'}</li>
  <li><strong>Category:</strong> ${data.category}</li>
  ${data.speaker ? `<li><strong>Speaker:</strong> ${data.speaker}</li>` : ''}
  ${data.language ? `<li><strong>Language:</strong> ${data.language}</li>` : ''}
  ${data.tags ? `<li><strong>Tags:</strong> ${data.tags}</li>` : ''}
  <li><strong>Duration:</strong> ${formatTime(duration)}</li>
  <li><strong>File Size:</strong> ${(audioFile.size / 1024 / 1024).toFixed(2)} MB</li>
  <li><strong>Uploaded by:</strong> ${user?.email || 'Anonymous'}</li>
  <li><strong>Upload Date:</strong> ${new Date().toLocaleString()}</li>
  <li><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">LIVE ✅</span></li>
</ul>

<h3>Audio File:</h3>
<p><a href="${file_url}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Listen to Audio</a></p>
<p>Direct link: <a href="${file_url}">${file_url}</a></p>

${coverImageUrl ? `
<h3>Cover Image:</h3>
<p><a href="${coverImageUrl}" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Cover Image</a></p>
<img src="${coverImageUrl}" style="max-width: 400px; margin-top: 10px; border-radius: 8px;" />
` : ''}

<hr style="margin: 20px 0;" />

<p style="color: #666; font-size: 12px; margin-top: 30px;">
This audio was automatically published. All logged-in users can now upload content without moderation.
</p>
      `;

      base44.integrations.Core.SendEmail({
        to: "imediac786@gmail.com",
        subject: `✅ Audio Published: ${data.title || 'Untitled'}`,
        body: emailBody
      }).catch(err => console.error("Email notification failed:", err));

      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioContent'] });
      toast.success("✅ Audio published successfully!");
      toast.info("Your audio is now live!");

      setShowUploadForm(false);
      setUploadForm({
        title: "",
        description: "",
        category: "Talks",
        speaker: "",
        language: "",
        tags: "",
        audio_file: null,
        cover_image: null,
        duration: 0,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    },
    onError: (error) => {
      toast.error("Failed to upload audio: " + error.message);
      console.error("Upload error:", error);
    }
  });

  const incrementPlayCountMutation = useMutation({
    mutationFn: async (audioId) => {
      const audio = audioContent.find(a => a.id === audioId);
      if (!audio) return;

      await base44.entities.AudioContent.update(audioId, {
        play_count: (audio.play_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioContent'] });
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (data) => {
      const playlist = await base44.entities.Playlist.create({
        ...data,
        user_email: user.email,
        audio_ids: [],
        track_count: 0,
        total_duration: 0,
      });
      return playlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success("✅ Playlist created!");
      setShowCreatePlaylist(false);
      setPlaylistForm({ name: "", description: "" });
    },
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Playlist.update(id, data),
    onSuccess: (updatedPlaylist) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      if (showPlaylistDetails?.id === updatedPlaylist.id) {
        setShowPlaylistDetails(updatedPlaylist);
      }
      if (currentPlaylist?.id === updatedPlaylist.id) {
        setCurrentPlaylist(updatedPlaylist);
      }
      if (editingPlaylist?.id === updatedPlaylist.id) {
        setEditingPlaylist(null);
        setPlaylistEditForm({ name: "", description: "" });
        toast.success("✅ Playlist updated!");
      }
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: (id) => base44.entities.Playlist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success("Playlist deleted!");
      setShowPlaylistDetails(null);
      if (currentPlaylist?.id === showPlaylistDetails?.id) {
        setCurrentPlaylist(null);
      }
    },
  });

  const updateAudioMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AudioContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioContent'] });
      toast.success("✅ Audio updated successfully!");
      setEditingAudio(null);
      setEditForm({});
    },
    onError: (error) => {
      toast.error("Failed to update audio: " + error.message);
      console.error("Update error:", error);
    }
  });

  const deleteAudioMutation = useMutation({
    mutationFn: (id) => base44.entities.AudioContent.delete(id),
    onSuccess: (deletedAudioId) => {
      queryClient.invalidateQueries({ queryKey: ['audioContent'] });
      toast.success("Audio deleted!");
      setEditingAudio(null);
      // Also remove from any playlists that contain this audio
      playlists.forEach(playlist => {
        if (playlist.audio_ids?.includes(deletedAudioId)) {
          removeFromPlaylist(playlist, deletedAudioId);
        }
      });
    },
    onError: (error) => {
      toast.error("Failed to delete audio: " + error.message);
      console.error("Delete error:", error);
    }
  });

  const addToPlaylist = (playlist, audioId) => {
    if (playlist.audio_ids?.includes(audioId)) {
      toast.info("Audio already in this playlist");
      return;
    }

    const audio = audioContent.find(a => a.id === audioId);
    if (!audio) return;

    const newAudioIds = [...(playlist.audio_ids || []), audioId];
    const newDuration = (playlist.total_duration || 0) + (audio.duration || 0);

    updatePlaylistMutation.mutate({
      id: playlist.id,
      data: {
        audio_ids: newAudioIds,
        track_count: newAudioIds.length,
        total_duration: newDuration,
      }
    });
    toast.success(`Added to ${playlist.name}`);
  };

  const removeFromPlaylist = (playlist, audioId) => {
    const audio = audioContent.find(a => a.id === audioId);
    const newAudioIds = playlist.audio_ids.filter(id => id !== audioId);
    const newDuration = (playlist.total_duration || 0) - (audio?.duration || 0);

    updatePlaylistMutation.mutate({
      id: playlist.id,
      data: {
        audio_ids: newAudioIds,
        track_count: newAudioIds.length,
        total_duration: Math.max(0, newDuration),
      }
    });
    toast.info(`Removed from ${playlist.name}`);
  };

  const reorderPlaylist = (playlist, result) => {
    if (!result.destination) return;

    const newAudioIds = Array.from(playlist.audio_ids);
    const [removed] = newAudioIds.splice(result.source.index, 1);
    newAudioIds.splice(result.destination.index, 0, removed);

    updatePlaylistMutation.mutate({
      id: playlist.id,
      data: { audio_ids: newAudioIds }
    });
  };

  const playPlaylist = (playlist, startIndex = 0) => {
    if (!playlist.audio_ids || playlist.audio_ids.length === 0) {
      toast.error("Playlist is empty");
      return;
    }

    const audio = audioContent.find(a => a.id === playlist.audio_ids[startIndex]);
    if (!audio) {
      toast.error("Audio not found");
      return;
    }

    setCurrentPlaylist(playlist);
    setCurrentPlaylistIndex(startIndex);
    handlePlayPause(audio);
    toast.info(`Playing: ${playlist.name}`);
  };

  const playNextInPlaylist = () => {
    if (!currentPlaylist || currentPlaylistIndex >= currentPlaylist.audio_ids.length - 1) {
      toast.info("End of playlist");
      setCurrentPlaylist(null);
      return;
    }

    const nextIndex = currentPlaylistIndex + 1;
    const nextAudio = audioContent.find(a => a.id === currentPlaylist.audio_ids[nextIndex]);

    if (nextAudio) {
      setCurrentPlaylistIndex(nextIndex);
      setCurrentPlaying(nextAudio);
      setCurrentTime(0);
      incrementPlayCountMutation.mutate(nextAudio.id);
      setTimeout(() => {
        audioRef.current.src = nextAudio.audio_url;
        audioRef.current.play();
        setIsPlaying(true);
      }, 0);
    }
  };

  const playPreviousInPlaylist = () => {
    if (!currentPlaylist || currentPlaylistIndex <= 0) {
      toast.info("Beginning of playlist");
      return;
    }

    const prevIndex = currentPlaylistIndex - 1;
    const prevAudio = audioContent.find(a => a.id === currentPlaylist.audio_ids[prevIndex]);

    if (prevAudio) {
      setCurrentPlaylistIndex(prevIndex);
      setCurrentPlaying(prevAudio);
      setCurrentTime(0);
      incrementPlayCountMutation.mutate(prevAudio.id);
      setTimeout(() => {
        audioRef.current.src = prevAudio.audio_url;
        audioRef.current.play();
        setIsPlaying(true);
      }, 0);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();

    if (!uploadForm.title || !uploadForm.audio_file) {
      toast.error("Please provide title and audio file");
      return;
    }

    uploadMutation.mutate(uploadForm);
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error("Please select an audio file");
        return;
      }
      setUploadForm({...uploadForm, audio_file: file});
      toast.success("Audio file loaded!");
    } else {
      setUploadForm({...uploadForm, audio_file: null});
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      setUploadForm({...uploadForm, cover_image: file});
      toast.success("Cover image loaded!");
    } else {
      setUploadForm({...uploadForm, cover_image: null});
    }
  };

  const handlePlayPause = (audio) => {
    if (currentPlaying?.id === audio.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentPlaying?.id !== audio.id) {
        setCurrentPlaying(audio);
        setCurrentTime(0);
        incrementPlayCountMutation.mutate(audio.id);
        setTimeout(() => {
          audioRef.current.src = audio.audio_url;
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.play();
          setIsPlaying(true);
        }, 0);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 10,
        audioRef.current.duration
      );
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - 10,
        0
      );
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    toast.success(`Playback speed: ${speed}x`);
  };

  const handleSleepTimerChange = (minutes) => {
    setSleepTimer(minutes);
    if (minutes > 0) {
      toast.success(`⏰ Sleep timer set for ${minutes} minutes`);
    } else {
      toast.info("Sleep timer off");
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSleepTimer = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = (duration, currentTime) => {
    const remaining = Math.max(0, duration - currentTime);
    return formatDuration(Math.floor(remaining));
  };

  const formatPlayCount = (count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return `${count}`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const filteredAudio = audioContent.filter(audio => {
    const matchesCategory = selectedCategory === "All" || audio.category === selectedCategory;
    const matchesSpeaker = selectedSpeaker === "all" || audio.speaker === selectedSpeaker;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (audio.title || "").toLowerCase().includes(searchLower) ||
      (audio.description || "").toLowerCase().includes(searchLower) ||
      (audio.speaker || "").toLowerCase().includes(searchLower);

    return matchesCategory && matchesSpeaker && matchesSearch;
  });

  const audioByCategory = {};
  if (selectedSpeaker === "all") {
    let groupList = [];

    if (selectedCategory === "Talks") {
      groupList = speakers;
    } else if (selectedCategory === "Nasheeds") {
      groupList = nasheedArtists;
    } else if (selectedCategory === "Quran") {
      groupList = quranReciters;
    }

    if (groupList.length > 0) {
      groupList.forEach(person => {
        const personAudio = filteredAudio.filter(a => a.speaker === person);
        if (personAudio.length > 0) {
          audioByCategory[person] = personAudio;
        }
      });

      const audioWithoutSpeaker = filteredAudio.filter(a => !a.speaker || !groupList.includes(a.speaker));
      if (audioWithoutSpeaker.length > 0) {
        let unknownLabel = "Unknown";
        if (selectedCategory === "Talks") unknownLabel = "Unknown Speaker";
        else if (selectedCategory === "Nasheeds") unknownLabel = "Unknown Artist";
        else if (selectedCategory === "Quran") unknownLabel = "Unknown Reciter";

        audioByCategory[unknownLabel] = audioWithoutSpeaker;
      }
    } else {
      audioByCategory["All"] = filteredAudio;
    }
  } else {
    audioByCategory["All"] = filteredAudio;
  }

  const getSpeakerList = () => {
    switch (selectedCategory) {
      case "Talks":
        return { list: speakers, label: "Speaker" };
      case "Nasheeds":
        return { list: nasheedArtists, label: "Artist" };
      case "Quran":
        return { list: quranReciters, label: "Reciter" };
      default:
        return null;
    }
  };

  const speakerInfo = getSpeakerList();

  const handleEditAudio = (audio) => {
    setEditForm({
      title: audio.title,
      description: audio.description || "",
      category: audio.category,
      speaker: audio.speaker || "",
      language: audio.language || "",
      tags: audio.tags ? audio.tags.join(', ') : "",
    });
    setEditingAudio(audio);
  };

  const handleSaveEdit = () => {
    if (!editForm.title || !editingAudio) {
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

    updateAudioMutation.mutate({ id: editingAudio.id, data: updateData });
  };

  const handleDeleteAudio = (audioId) => {
    if (confirm("Are you sure you want to delete this audio? This action cannot be undone.")) {
      deleteAudioMutation.mutate(audioId);
    }
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
              <Music className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Islamic Audio Library</h1>
          <p className="text-gray-700 text-lg">Quran, Nasheeds, Talks, Hadith & More</p>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            onClick={() => {
              setShowUploadForm(!showUploadForm);
              setShowRules(false);
              setShowPlaylists(false);
            }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            {showUploadForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {showUploadForm ? "Cancel Upload" : "Upload Audio"}
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
              <ListMusic className="w-5 h-5 mr-2" />
              My Playlists ({playlists.length})
            </Button>
          )}
        </div>

        {showRules && (
          <Card className="bg-white border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Upload Guidelines & Rules
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
                    <span><strong>Quran Recitations:</strong> Clear and proper recitations by qualified reciters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Nasheeds:</strong> Islamic songs without musical instruments (vocal only or with duff)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Islamic Talks:</strong> Lectures, sermons, and educational content by qualified scholars</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Hadith Narrations:</strong> Authentic hadith recitations with proper attribution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span><strong>Duas:</strong> Islamic supplications and prayers in Arabic or other languages</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ❌ Prohibited Content
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Music with Instruments:</strong> No songs with musical instruments (except duff)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Inappropriate Content:</strong> No content contradicting Islamic values</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Copyrighted Material:</strong> Do not upload content you don't have rights to</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Sectarian Content:</strong> No divisive or sectarian material</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Poor Quality:</strong> Avoid low-quality recordings with excessive noise</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  📝 Quality Requirements
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Clear Audio:</strong> Ensure good sound quality with minimal background noise</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Proper Title:</strong> Use descriptive titles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Accurate Category:</strong> Select the correct category for your content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Speaker/Artist Info:</strong> Provide accurate information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Description:</strong> Add a brief description</span>
                  </li>
                </ul>
              </div>

              <Alert className="bg-blue-50 border-blue-300">
                <Info className="w-4 h-4 text-blue-700" />
                <AlertDescription className="text-blue-900">
                  <strong>📱 Mobile Users:</strong> You can upload audio files directly from your phone's storage or recordings.
                </AlertDescription>
              </Alert>

              <Alert className="bg-yellow-50 border-yellow-300">
                <AlertCircle className="w-4 h-4 text-yellow-700" />
                <AlertDescription className="text-yellow-900">
                  <strong>⚖️ Copyright Notice:</strong> By uploading content, you confirm that you have the right to share it.
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
                Upload New Audio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-gray-800">Title *</Label>
                    <Input
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                      placeholder="Audio title"
                      className="bg-white border-gray-300 text-gray-900"
                      required
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
                      onValueChange={(value) => {
                        setUploadForm({...uploadForm, category: value, speaker: ""});
                      }}
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

                  {uploadForm.category === "Talks" && (
                    <div>
                      <Label className="text-gray-800">Speaker</Label>
                      <Select
                        value={uploadForm.speaker}
                        onValueChange={(value) => setUploadForm({...uploadForm, speaker: value})}
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
                  )}

                  {uploadForm.category === "Nasheeds" && (
                    <div>
                      <Label className="text-gray-800">Artist</Label>
                      <Select
                        value={uploadForm.speaker}
                        onValueChange={(value) => setUploadForm({...uploadForm, speaker: value})}
                      >
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue placeholder="Select artist" />
                        </SelectTrigger>
                        <SelectContent>
                          {nasheedArtists.map(artist => (
                            <SelectItem key={artist} value={artist}>
                              {artist}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {uploadForm.category === "Quran" && (
                    <div>
                      <Label className="text-gray-800">Reciter</Label>
                      <Select
                        value={uploadForm.speaker}
                        onValueChange={(value) => setUploadForm({...uploadForm, speaker: value})}
                      >
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue placeholder="Select reciter" />
                        </SelectTrigger>
                        <SelectContent>
                          {quranReciters.map(reciter => (
                            <SelectItem key={reciter} value={reciter}>
                              {reciter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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

                <div className="md:col-span-2">
                  <Label className="text-gray-800 mb-2 block">Audio File * (Mobile-Friendly)</Label>
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileChange}
                      className="w-full p-3 border-2 border-blue-400 rounded-lg text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    {uploadForm.audio_file && (
                      <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                        <div className="text-gray-900">
                          <Music className="w-12 h-12 mx-auto mb-2 text-green-600" />
                          <p className="font-medium text-center">{uploadForm.audio_file.name}</p>
                          <p className="text-sm text-gray-600 mt-1 text-center">
                            {(uploadForm.audio_file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-600 text-center">
                      Supported formats: MP3, WAV, M4A, AAC, OGG, FLAC, etc.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-gray-800 mb-2 block">Cover Image (Optional)</Label>
                  <div className="space-y-3">
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="w-full p-3 border-2 border-blue-400 rounded-lg text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    {uploadForm.cover_image && (
                      <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                        <div className="text-gray-900">
                          <ImageIcon className="w-10 h-10 mx-auto mb-2 text-blue-600" />
                          <p className="font-medium text-center">{uploadForm.cover_image.name}</p>
                          <p className="text-sm text-gray-600 mt-1 text-center">
                            {(uploadForm.cover_image.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-600 text-center">
                      JPG, PNG (Mobile-Friendly)
                    </p>
                  </div>
                </div>

                </div>

                <Alert className="bg-blue-50 border-blue-300">
                  <Info className="w-4 h-4 text-blue-700" />
                  <AlertDescription className="text-blue-900 text-sm">
                    Please ensure your content follows our <button type="button" onClick={() => { setShowRules(true); setShowUploadForm(false); }} className="underline font-semibold">Upload Guidelines</button>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                    className="flex-1 border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploadMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Audio
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showPlaylists && user && (
          <Card className="bg-white border-blue-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <ListMusic className="w-5 h-5" />
                  My Playlists
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
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <ListMusic className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-semibold line-clamp-1">{playlist.name}</h3>
                            <p className="text-gray-600 text-sm line-clamp-1">{playlist.description || "No description"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">
                                {playlist.track_count || 0} tracks
                              </Badge>
                              <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">
                                {formatDuration(playlist.total_duration || 0)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              playPlaylist(playlist);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!playlist.audio_ids || playlist.audio_ids.length === 0}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPlaylistDetails(playlist);
                            }}
                            className="border-blue-400 text-blue-700"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPlaylist(playlist);
                            }}
                            className="border-emerald-400 text-emerald-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <ShareButtons
                            title={playlist.name}
                            description={`${playlist.description || 'Audio playlist'} - ${playlist.track_count || 0} tracks`}
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
                  <ListMusic className="w-16 h-16 mx-auto mb-4 text-blue-400 opacity-50" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Playlists Yet</h3>
                  <p className="text-gray-700 mb-4">Create your first playlist!</p>
                  <Button onClick={() => setShowCreatePlaylist(true)} className="bg-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Playlist
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                />
              </div>
              <div>
                <Label className="text-gray-800">Description</Label>
                <Textarea
                  value={playlistForm.description}
                  onChange={(e) => setPlaylistForm({...playlistForm, description: e.target.value})}
                  placeholder="Collection of my favorite nasheeds..."
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>
              <div className="flex gap-3">
                <Button
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
                  onClick={() => createPlaylistMutation.mutate(playlistForm)}
                  disabled={!playlistForm.name || createPlaylistMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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

        <Dialog open={!!editingPlaylist} onOpenChange={() => setEditingPlaylist(null)}>
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
                />
              </div>
              <div>
                <Label className="text-gray-800">Description</Label>
                <Textarea
                  value={playlistEditForm.description}
                  onChange={(e) => setPlaylistEditForm({...playlistEditForm, description: e.target.value})}
                  placeholder="Collection of my favorite nasheeds..."
                  className="bg-white border-gray-300 text-gray-900 h-24"
                />
              </div>
              <div className="flex gap-3">
                <Button
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
                  onClick={handleSavePlaylistEdit}
                  disabled={!playlistEditForm.name || updatePlaylistMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
                    <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">
                      {showPlaylistDetails?.track_count || 0} tracks
                    </Badge>
                    <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">
                      {formatDuration(showPlaylistDetails?.total_duration || 0)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <ShareButtons
                    title={showPlaylistDetails?.name || "Playlist"}
                    description={`${showPlaylistDetails?.description || 'Audio playlist'} - ${showPlaylistDetails?.track_count || 0} tracks`}
                    contentType="playlist"
                    contentId={showPlaylistDetails?.id}
                    compact={false}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowPlaylistDetails(null);
                      handleEditPlaylist(showPlaylistDetails);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Delete this playlist?")) {
                        deletePlaylistMutation.mutate(showPlaylistDetails.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {showPlaylistDetails && (
              <div className="space-y-4">
                {showPlaylistDetails.audio_ids && showPlaylistDetails.audio_ids.length > 0 ? (
                  <DragDropContext onDragEnd={(result) => reorderPlaylist(showPlaylistDetails, result)}>
                    <Droppable droppableId="playlist">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {showPlaylistDetails.audio_ids.map((audioId, index) => {
                            const audio = audioContent.find(a => a.id === audioId);
                            if (!audio) return null;

                            return (
                              <Draggable key={audioId} draggableId={audioId} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-300 ${
                                      snapshot.isDragging ? 'shadow-lg shadow-blue-200' : ''
                                    }`}
                                  >
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                      <GripVertical className="w-5 h-5 text-gray-500" />
                                    </div>

                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                      {audio.cover_image_url ? (
                                        <img src={audio.cover_image_url} alt={audio.title} className="w-full h-full object-cover rounded-lg" />
                                      ) : (
                                        <Music className="w-8 h-8 text-white" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-gray-900 font-medium line-clamp-1">{audio.title}</h4>
                                      <p className="text-gray-600 text-sm">{audio.speaker || audio.category}</p>
                                    </div>

                                    <Badge variant="outline" className="text-xs border-gray-400 text-gray-700">
                                      {formatDuration(audio.duration)}
                                    </Badge>

                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        playPlaylist(showPlaylistDetails, index);
                                        setShowPlaylistDetails(null);
                                      }}
                                      className="hover:bg-blue-100 text-blue-600"
                                    >
                                      <Play className="w-4 h-4" />
                                    </Button>

                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => removeFromPlaylist(showPlaylistDetails, audioId)}
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
                    <Music className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-gray-700">No tracks in this playlist yet</p>
                    <p className="text-sm text-gray-600 mt-1">Use the "+" button on audio tracks to add them</p>
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
            placeholder="Search audio..."
            className="pl-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 h-12 rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {/* Category Dropdown */}
          <Select 
            value={selectedCategory} 
            onValueChange={(value) => {
              setSelectedCategory(value);
              setSelectedSpeaker("all");
            }}
          >
            <SelectTrigger className="w-64 bg-white border-2 border-purple-400 text-gray-900 h-12 rounded-xl">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-600" />
                <SelectValue placeholder="Select Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="All" className="text-gray-900">
                All Categories ({audioContent.length})
              </SelectItem>
              {categories.map((cat) => {
                const count = audioContent.filter(a => a.category === cat.value).length;
                return (
                  <SelectItem key={cat.value} value={cat.value} className="text-gray-900">
                    {cat.value} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {(selectedCategory === "Talks" || selectedCategory === "Nasheeds" || selectedCategory === "Quran") && (
          <div className="flex justify-center">
            <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
              <SelectTrigger className="w-64 bg-white border-2 border-emerald-400 text-gray-900 h-12 rounded-xl">
                <div className="flex items-center gap-2">
                  {selectedCategory === "Quran" && <BookOpen className="w-5 h-5 text-emerald-600" />}
                  {selectedCategory === "Nasheeds" && <Music className="w-5 h-5 text-emerald-600" />}
                  {selectedCategory === "Talks" && <Mic2 className="w-5 h-5 text-emerald-600" />}
                  <SelectValue placeholder={`Select ${selectedCategory === "Quran" ? "Reciter" : selectedCategory === "Nasheeds" ? "Artist" : "Speaker"}`} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="all" className="text-gray-900">
                  All {selectedCategory === "Quran" ? "Reciters" : selectedCategory === "Nasheeds" ? "Artists" : "Speakers"}
                </SelectItem>
                {(selectedCategory === "Quran" ? quranReciters : selectedCategory === "Nasheeds" ? nasheedArtists : speakers)
                  .filter(s => audioContent.some(a => a.speaker === s && a.category === selectedCategory))
                  .map(person => (
                    <SelectItem key={person} value={person} className="text-gray-900">
                      {person}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-700 mt-4">Loading audio...</p>
          </div>
        ) : Object.keys(audioByCategory).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(audioByCategory).map(([groupName, groupAudio]) => (
              <div key={groupName}>
                {groupName !== "All" && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Mic2 className="w-6 h-6 text-blue-600" />
                    {groupName}
                  </h2>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupAudio.map((audio) => {
                    const isCurrentlyPlaying = currentPlaying?.id === audio.id;
                    const remaining = isCurrentlyPlaying ? getRemainingTime(audio.duration, currentTime) : formatDuration(audio.duration);

                    return (
                      <Card key={audio.id} className="bg-white border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              {audio.cover_image_url ? (
                                <img src={audio.cover_image_url} alt={audio.title} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <Music className="w-8 h-8 text-white" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-gray-900 font-semibold line-clamp-1">{audio.title}</h3>
                              {audio.speaker && (
                                <p className="text-gray-700 text-sm">{audio.speaker}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">
                                  {audio.category}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 items-end">
                              <Button
                                size="icon"
                                onClick={() => handlePlayPause(audio)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex-shrink-0 text-white"
                              >
                                {isCurrentlyPlaying && isPlaying ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </Button>

                              <div className="flex gap-1">
                                {/* Favorite Button */}
                                <FavoriteButton
                                  contentId={audio.id}
                                  contentType="audio"
                                  contentTitle={audio.title}
                                  contentThumbnail={audio.cover_image_url}
                                  contentCategory={audio.category}
                                  size="icon"
                                />
                                {/* Share Button */}
                                <ShareButtons
                                  title={audio.title}
                                  description={audio.description}
                                  contentType="audio"
                                  contentId={audio.id}
                                  compact={true}
                                />
                                {/* View Details Button */}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setViewingAudio(audio)}
                                  className="rounded-full hover:bg-blue-100 text-blue-600 h-8 w-8"
                                  title="View Details"
                                >
                                  <Info className="w-4 h-4" />
                                </Button>

                                {user && (user.email === audio.created_by || user.role === 'admin') && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEditAudio(audio)}
                                    className="rounded-full hover:bg-blue-100 text-blue-600 h-8 w-8"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}

                                {user && playlists.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="rounded-full hover:bg-blue-100 text-blue-600 h-8 w-8"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-white border-gray-300">
                                      {playlists.map(playlist => (
                                        <DropdownMenuItem
                                          key={playlist.id}
                                          onClick={() => addToPlaylist(playlist, audio.id)}
                                          className="text-gray-900 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                                        >
                                          <div className="flex items-center">
                                            <ListMusic className="w-4 h-4 mr-2" />
                                            {playlist.name}
                                          </div>
                                          {playlist.audio_ids?.includes(audio.id) && (
                                            <Check className="w-4 h-4 ml-auto text-green-600" />
                                          )}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          </div>

                          {audio.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{audio.description}</p>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              {isCurrentlyPlaying && isPlaying ? (
                                <>
                                  <Clock className="w-3 h-3" />
                                  {remaining} left
                                </>
                              ) : (
                                audio.duration > 0 ? (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(audio.duration)}
                                  </>
                                ) : (
                                  <span className="text-gray-400">No duration</span>
                                )
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Headphones className="w-3 h-3" />
                              {formatPlayCount(audio.play_count || 0)} plays
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-gray-300 shadow-md">
            <CardContent className="p-12 text-center">
              <Music className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No audio found</h3>
              <p className="text-gray-700">Try a different category or search term</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Audio Dialog */}
        <Dialog open={!!editingAudio} onOpenChange={() => setEditingAudio(null)}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Edit Audio</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-800">Title *</Label>
                <Input
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  placeholder="Audio title"
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
                  onValueChange={(value) => setEditForm({...editForm, category: value, speaker: ""})}
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

              {editForm.category === "Talks" && (
                <div>
                  <Label className="text-gray-800">Speaker</Label>
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
              )}

              {editForm.category === "Nasheeds" && (
                <div>
                  <Label className="text-gray-800">Artist</Label>
                  <Select
                    value={editForm.speaker || ''}
                    onValueChange={(value) => setEditForm({...editForm, speaker: value})}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select artist" />
                    </SelectTrigger>
                    <SelectContent>
                      {nasheedArtists.map(artist => (
                        <SelectItem key={artist} value={artist}>
                          {artist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editForm.category === "Quran" && (
                <div>
                  <Label className="text-gray-800">Reciter</Label>
                  <Select
                    value={editForm.speaker || ''}
                    onValueChange={(value) => setEditForm({...editForm, speaker: value})}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select reciter" />
                    </SelectTrigger>
                    <SelectContent>
                      {quranReciters.map(reciter => (
                        <SelectItem key={reciter} value={reciter}>
                          {reciter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                  onClick={() => handleDeleteAudio(editingAudio.id)}
                  disabled={deleteAudioMutation.isPending}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteAudioMutation.isPending ? "Deleting..." : "Delete Audio"}
                </Button>
                <div className="flex-1"></div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAudio(null)}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updateAudioMutation.isPending || !editForm.title}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  {updateAudioMutation.isPending ? (
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

        {/* Audio Details Dialog */}
        <Dialog open={!!viewingAudio} onOpenChange={() => setViewingAudio(null)}>
          <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{viewingAudio?.title}</DialogTitle>
              <DialogDescription className="text-gray-700">
                {viewingAudio?.speaker && `by ${viewingAudio.speaker}`}
              </DialogDescription>
            </DialogHeader>

            {viewingAudio && (
              <div className="space-y-6 py-4">
                {/* Audio Player */}
                {viewingAudio.audio_url && (
                  <audio 
                    controls 
                    className="w-full"
                    src={viewingAudio.audio_url}
                    autoPlay
                  />
                )}

                {/* Description */}
                {viewingAudio.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">{viewingAudio.description}</p>
                  </div>
                )}

                {/* Rating Widget */}
                <div className="border-t border-gray-200 pt-4">
                  <RatingWidget
                    contentId={viewingAudio.id}
                    contentType="audio"
                    contentTitle={viewingAudio.title}
                  />
                </div>

                {/* Comments Widget */}
                <CommentsWidget
                  contentId={viewingAudio.id}
                  contentType="audio"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <audio
          ref={audioRef}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />

        {currentPlaying && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-gray-300 p-4 backdrop-blur-xl z-50 shadow-2xl">
            <div className="max-w-7xl mx-auto">
              {currentPlaylist && (
                <div className="text-center text-sm text-blue-700 mb-2 font-medium">
                  Playing from: {currentPlaylist.name} • Track {currentPlaylistIndex + 1} of {currentPlaylist.audio_ids.length}
                </div>
              )}

              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  {currentPlaying.cover_image_url ? (
                    <img src={currentPlaying.cover_image_url} alt={currentPlaying.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Music className="w-6 h-6 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold truncate">{currentPlaying.title}</h4>
                  <p className="text-gray-700 text-sm truncate">{currentPlaying.speaker || currentPlaying.category}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="h-8 w-8 hover:bg-gray-200 rounded-full"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-gray-700" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-gray-700" />
                      )}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={(value) => setVolume(value[0])}
                      max={100}
                      step={1}
                      className="w-24"
                    />
                    <span className="text-xs text-gray-700 w-8">{isMuted ? 0 : volume}%</span>
                  </div>

                  <div className="text-sm text-gray-700 bg-gray-100 rounded-full px-4 py-2 font-medium">
                    {sleepTimeRemaining > 0 && isPlaying ? (
                      <span className="flex items-center gap-1">
                        ⏰ {formatSleepTimer(sleepTimeRemaining)}
                      </span>
                    ) : (
                      <span>{getRemainingTime(currentPlaying.duration, currentTime)} left</span>
                    )}
                  </div>

                  <Dialog open={showPlayerSettings} onOpenChange={setShowPlayerSettings}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 hover:bg-gray-200 rounded-full"
                      >
                        <Settings className="w-5 h-5 text-gray-700" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-gray-300 text-gray-900">
                      <DialogHeader>
                        <DialogTitle>Player Settings</DialogTitle>
                        <DialogDescription className="text-gray-700">
                          Adjust playback options for the current audio.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Gauge className="w-5 h-5 text-blue-600" />
                            <Label className="text-gray-900 text-base">Playback Speed</Label>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {playbackSpeeds.map(speed => (
                              <Button
                                key={speed.value}
                                variant={playbackSpeed === speed.value ? "default" : "outline"}
                                className={playbackSpeed === speed.value
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
                                }
                                onClick={() => handlePlaybackSpeedChange(speed.value)}
                              >
                                {speed.label}
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            Current speed: {playbackSpeed}x
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Timer className="w-5 h-5 text-blue-600" />
                            <Label className="text-gray-900 text-base">Sleep Timer</Label>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {sleepTimerOptions.map(option => (
                              <Button
                                key={option.value}
                                variant={sleepTimer === option.value ? "default" : "outline"}
                                className={sleepTimer === option.value
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
                                }
                                onClick={() => handleSleepTimerChange(option.value)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                          {sleepTimer > 0 && sleepTimeRemaining > 0 && (
                            <p className="text-xs text-gray-600 mt-2">
                              ⏰ Audio will stop in {formatSleepTimer(sleepTimeRemaining)}
                            </p>
                          )}
                        </div>

                        <Alert className="bg-blue-50 border-blue-300">
                          <Info className="w-4 h-4 text-blue-700" />
                          <AlertDescription className="text-blue-900 text-sm">
                            <strong>Background Playback:</strong> Audio will continue playing even when you switch apps or lock your screen. Control playback from your device's media controls.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-2">
                    {currentPlaylist ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={playPreviousInPlaylist}
                        className="h-10 w-10 hover:bg-gray-200 rounded-full"
                        title="Previous track"
                        disabled={currentPlaylistIndex === 0}
                      >
                        <SkipBack className="w-5 h-5 text-blue-700" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={skipBackward}
                        className="h-10 w-10 hover:bg-gray-200 rounded-full"
                        title="Skip backward 10 seconds"
                      >
                        <SkipBack className="w-5 h-5 text-gray-700" />
                      </Button>
                    )}

                    <Button
                      size="icon"
                      onClick={() => handlePlayPause(currentPlaying)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full h-12 w-12 text-white"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </Button>

                    {currentPlaylist ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={playNextInPlaylist}
                        className="h-10 w-10 hover:bg-gray-200 rounded-full"
                        title="Next track"
                        disabled={currentPlaylistIndex >= currentPlaylist.audio_ids.length - 1}
                      >
                        <SkipForward className="w-5 h-5 text-blue-700" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={skipForward}
                        className="h-10 w-10 hover:bg-gray-200 rounded-full"
                        title="Skip forward 10 seconds"
                      >
                        <SkipForward className="w-5 h-5 text-gray-700" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                  style={{ width: `${(currentTime / currentPlaying.duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}