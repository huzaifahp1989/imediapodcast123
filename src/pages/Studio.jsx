import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Mic, 
  Square,
  Pause,
  Play,
  AlertCircle,
  CheckCircle,
  Loader2,
  Volume2,
  Image as ImageIcon,
  X,
  Plus // Added Plus icon
} from "lucide-react";
import { toast } from "sonner";
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

export default function Studio() {
  const [user, setUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [coverArtFile, setCoverArtFile] = useState(null);
  const [coverArtPreview, setCoverArtPreview] = useState(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false); // New state
  const [customCategory, setCustomCategory] = useState(""); // New state
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const coverArtInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    host_name: "",
    guest_names: "",
    category: "General",
    tags: "",
    series: "",
    season: "",
    episode_number: "",
    pinned_to_front: false,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        host_name: currentUser.full_name || currentUser.email || ""
      }));
    }).catch(() => {
      setUser(null);
    });
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording || isPaused || !analyserRef.current) {
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let running = true;

    const monitor = () => {
      if (!running || !analyserRef.current) return;

      try {
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const level = sum / dataArray.length / 255;
        setAudioLevel(level);
      } catch (error) {
        console.error("Audio monitoring error:", error);
      }

      if (running) {
        animationFrameRef.current = requestAnimationFrame(monitor);
      }
    };

    monitor();

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const handleCoverArtChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image file is too large. Please use an image under 10MB");
        return;
      }
      
      setCoverArtFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverArtPreview(reader.result);
        toast.success("Cover art loaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const requestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      setMicPermission(true);
      toast.success("🎤 Microphone access granted!");
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast.error("Microphone access denied");
      console.error(error);
    }
  };

  const startRecording = async () => {
    if (!micPermission) {
      toast.error("Please grant microphone access first");
      return;
    }

    try {
      toast.info("Starting recording...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.5;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      source.connect(analyserRef.current);
      
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!selectedMimeType) {
        throw new Error("No supported audio format found");
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await handleRecordingComplete();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("🎙️ Recording started!");
    } catch (error) {
      toast.error("Failed to start recording: " + error.message);
      console.error(error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setIsPaused(true);
      setAudioLevel(0);
      toast.info("Recording paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setIsPaused(false);
      toast.info("Recording resumed");
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);
    toast.info("Processing recording...");
  };

  const handleRecordingComplete = async () => {
    setIsProcessing(true);
    
    try {
      if (!audioChunksRef.current || audioChunksRef.current.length === 0) {
        throw new Error("No audio data recorded");
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size === 0) {
        throw new Error("Recording is empty");
      }

      const slug = (formData.title || `episode-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${dateStr}-${slug}.webm`;

      const audioFile = new File([audioBlob], filename, {
        type: 'audio/webm',
      });

      toast.info("Uploading audio file...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

      let coverArtUrl = null;
      if (coverArtFile) {
        toast.info("Uploading cover art...");
        const coverArtResult = await base44.integrations.Core.UploadFile({ file: coverArtFile });
        coverArtUrl = coverArtResult.file_url;
      }

      const showNotes = `
## Introduction
Welcome to this episode${formData.title ? ` of ${formData.title}` : ''}!

## Summary
${formData.description || 'Episode description will be added here.'}

## Key Points
- Topic 1
- Topic 2
- Topic 3

## Timestamps
- 00:00 - Introduction
- [Add timestamps here]

## Guests
${formData.guest_names || 'No guests in this episode.'}

## Conclusion
Thank you for listening!
      `.trim();

      // Create podcast automatically
      const podcastData = {
        title: formData.title || `Episode ${dateStr}`,
        slug: slug,
        description: formData.description || "",
        audio_url: file_url,
        cover_art_url: coverArtUrl,
        duration: recordingTime,
        file_size: audioBlob.size,
        published_date: new Date().toISOString(),
        status: "published",
        host_name: formData.host_name || "",
        guest_names: formData.guest_names ? formData.guest_names.split(',').map(n => n.trim()) : [],
        category: formData.category || "General",
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        series: formData.series || null,
        season: formData.season ? parseInt(formData.season) : null,
        episode_number: formData.episode_number ? parseInt(formData.episode_number) : null,
        pinned_to_front: formData.pinned_to_front,
        show_notes: showNotes,
        play_count: 0,
        like_count: 0,
        comment_count: 0,
        save_count: 0,
      };
      
      toast.info("Publishing podcast...");
      await base44.entities.Podcast.create(podcastData);
      
      await queryClient.invalidateQueries({ queryKey: ['podcasts'] });

      // Format duration for email
      const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
          return `${hrs}h ${mins}m ${secs}s`;
        }
        return `${mins}m ${secs}s`;
      };

      // Send notification email
      const emailBody = `
<h2>📻 New Podcast Published</h2>

<p style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px;">
✅ This podcast has been automatically published and is now live!
</p>

<h3>Episode Details:</h3>
<ul>
  <li><strong>Title:</strong> ${formData.title || 'Untitled Episode'}</li>
  <li><strong>Description:</strong> ${formData.description || 'No description provided'}</li>
  <li><strong>Category:</strong> ${formData.category}</li>
  <li><strong>Host:</strong> ${formData.host_name || 'Unknown'}</li>
  ${formData.guest_names ? `<li><strong>Guests:</strong> ${formData.guest_names}</li>` : ''}
  ${formData.tags ? `<li><strong>Tags:</strong> ${formData.tags}</li>` : ''}
  ${formData.series ? `<li><strong>Series:</strong> ${formData.series}</li>` : ''}
  ${formData.season ? `<li><strong>Season:</strong> ${formData.season}</li>` : ''}
  ${formData.episode_number ? `<li><strong>Episode Number:</strong> ${formData.episode_number}</li>` : ''}
  <li><strong>Duration:</strong> ${formatTime(recordingTime)}</li>
  <li><strong>File Size:</strong> ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB</li>
  <li><strong>Pin to Front:</strong> ${formData.pinned_to_front ? 'Yes ⭐' : 'No'}</li>
  <li><strong>Published by:</strong> ${user?.email || 'Anonymous'}</li>
  <li><strong>Published Date:</strong> ${new Date().toLocaleString()}</li>
  <li><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">LIVE ✅</span></li>
</ul>

<h3>Audio File:</h3>
<p><a href="${file_url}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Listen to Audio</a></p>
<p>Direct link: <a href="${file_url}">${file_url}</a></p>

${coverArtUrl ? `
<h3>Cover Art:</h3>
<p><a href="${coverArtUrl}" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Cover Art</a></p>
<img src="${coverArtUrl}" style="max-width: 400px; margin-top: 10px; border-radius: 8px;" />
` : ''}

<hr style="margin: 20px 0;" />

<p><strong>🎧 Podcast is now available at:</strong></p>
<ul>
  <li>Podcast Library</li>
  <li>Home Page ${formData.pinned_to_front ? '(Featured!)' : ''}</li>
  <li>RSS Feed</li>
</ul>

<p style="color: #666; font-size: 12px; margin-top: 30px;">
This is an automated notification from PodcastHub. The podcast was automatically published upon recording completion.
</p>
      `;

      // Send email notification (don't wait for it)
      base44.integrations.Core.SendEmail({
        to: "imediac786@gmail.com",
        subject: `✅ Podcast Published: ${formData.title || 'Untitled Episode'}`,
        body: emailBody
      }).catch(err => console.error("Email notification failed:", err));
      
      toast.success("✅ Podcast published successfully!");
      toast.info("Your podcast is now live in the library!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        host_name: user?.full_name || user?.email || "",
        guest_names: "",
        category: "General",
        tags: "",
        series: "",
        season: "",
        episode_number: "",
        pinned_to_front: false,
      });
      setRecordingTime(0);
      audioChunksRef.current = [];
      setCoverArtFile(null);
      setCoverArtPreview(null);
      setCustomCategory(""); // Reset custom category
      setShowCustomCategory(false); // Hide custom category input
      
    } catch (error) {
      toast.error("Failed to publish podcast: " + error.message);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Mic className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Recording Studio</h1>
          <p className="text-gray-700 text-sm md:text-lg">Record and instantly publish your podcast episodes</p>
        </div>

        <Alert className="bg-green-50 border-green-300">
          <CheckCircle className="w-4 h-4 text-green-700" />
          <AlertDescription className="text-green-900">
            <strong>✅ Auto-Publish:</strong> Your recordings will be automatically published and available immediately in the podcast library!
          </AlertDescription>
        </Alert>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Episode Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!micPermission ? (
              <Alert className="bg-yellow-50 border-yellow-300">
                <AlertCircle className="w-4 h-4 text-yellow-700" />
                <AlertDescription className="text-yellow-900">
                  <div className="flex items-center justify-between">
                    <span>Microphone access required to record</span>
                    <Button 
                      onClick={requestMicAccess}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Grant Access
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 border-green-300">
                <CheckCircle className="w-4 h-4 text-green-700" />
                <AlertDescription className="text-green-900">
                  ✅ Ready to record!
                </AlertDescription>
              </Alert>
            )}

            {isRecording && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-300">
                <div className="flex items-center gap-3 mb-2">
                  <Volume2 className="w-4 h-4 text-gray-700" />
                  <Label className="text-gray-700 text-sm">Audio Level</Label>
                  <span className="text-gray-900 text-sm ml-auto font-mono">{Math.round(audioLevel * 100)}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 rounded-full ${
                      audioLevel > 0.8 ? 'bg-red-500' :
                      audioLevel > 0.5 ? 'bg-green-500' :
                      audioLevel > 0.2 ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.max(audioLevel * 100, 2)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {audioLevel < 0.05 ? "🔇 Speak into your microphone" : 
                   audioLevel > 0.8 ? "🔴 Audio too loud!" :
                   audioLevel > 0.5 ? "✅ Perfect level" :
                   audioLevel > 0.2 ? "⚠️ Could be louder" : "🔇 Very quiet"}
                </p>
              </div>
            )}

            {!isRecording && !isProcessing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="md:col-span-2">
                  <Label className="text-gray-800">Episode Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="My Awesome Episode"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-gray-800">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="What's this episode about?"
                    className="bg-white border-gray-300 text-gray-900 h-24"
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Islamic Topic *</Label>
                  {!showCustomCategory ? (
                    <div className="space-y-2">
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => {
                          if (value === "__custom__") {
                            setShowCustomCategory(true);
                            setFormData({...formData, category: ""}); // Clear category when switching to custom
                          } else {
                            setFormData({...formData, category: value});
                          }
                        }}
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
                          <SelectItem value="__custom__">
                            <div className="flex items-center gap-2">
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
                          value={customCategory}
                          onChange={(e) => {
                            setCustomCategory(e.target.value);
                            setFormData({...formData, category: e.target.value});
                          }}
                          placeholder="Enter custom topic name..."
                          className="bg-white border-gray-300 text-gray-900"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCustomCategory(false);
                            setCustomCategory("");
                            setFormData({...formData, category: "General"}); // Revert to default
                          }}
                          className="border-gray-300 text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">
                        Creating a new topic: <strong>{customCategory || "..."}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-800">Host Name</Label>
                  <Input
                    value={formData.host_name}
                    onChange={(e) => setFormData({...formData, host_name: e.target.value})}
                    placeholder="Your name"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Guest Names</Label>
                  <Input
                    value={formData.guest_names}
                    onChange={(e) => setFormData({...formData, guest_names: e.target.value})}
                    placeholder="John Doe, Jane Smith"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Tags</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="ramadan, prayer, quran"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Series</Label>
                  <Input
                    value={formData.series}
                    onChange={(e) => setFormData({...formData, series: e.target.value})}
                    placeholder="Season 1"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-800">Season</Label>
                    <Input
                      type="number"
                      value={formData.season}
                      onChange={(e) => setFormData({...formData, season: e.target.value})}
                      placeholder="1"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-800">Episode #</Label>
                    <Input
                      type="number"
                      value={formData.episode_number}
                      onChange={(e) => setFormData({...formData, episode_number: e.target.value})}
                      placeholder="1"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-gray-800 mb-2 block">Cover Art (Optional - 16:9 ratio recommended)</Label>
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
                            if (coverArtInputRef.current) {
                              coverArtInputRef.current.value = '';
                            }
                            toast.info("Cover art removed");
                          }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 p-0 text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => coverArtInputRef.current?.click()}
                        className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-xs text-gray-600">Upload</span>
                      </div>
                    )}
                    <input
                      ref={coverArtInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverArtChange}
                      className="hidden"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">
                        JPG or PNG, recommended size: 1920x1080 (16:9 ratio)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Max file size: 10MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-300">
                  <Switch
                    checked={formData.pinned_to_front}
                    onCheckedChange={(checked) => setFormData({...formData, pinned_to_front: checked})}
                  />
                  <div>
                    <Label className="text-gray-800 text-sm font-semibold">Pin to Front Page</Label>
                    <p className="text-xs text-gray-700">Feature this episode on the homepage</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-4 p-8 border-t border-gray-300">
              {isProcessing ? (
                <div className="text-center">
                  <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold">Publishing your podcast...</p>
                </div>
              ) : isRecording ? (
                <>
                  <div className="text-center mb-4">
                    <Badge className="bg-red-500 text-white text-lg px-4 py-2 animate-pulse mb-3">
                      {isPaused ? "PAUSED" : "RECORDING"}
                    </Badge>
                    <p className="text-gray-900 text-3xl font-mono font-bold">
                      {formatTime(recordingTime)}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    {!isPaused ? (
                      <Button
                        size="lg"
                        onClick={pauseRecording}
                        className="w-24 h-24 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Pause className="w-8 h-8" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={resumeRecording}
                        className="w-24 h-24 rounded-full bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Play className="w-8 h-8" />
                      </Button>
                    )}
                    
                    <Button
                      size="lg"
                      onClick={stopRecording}
                      className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Square className="w-8 h-8" />
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={startRecording}
                  disabled={!micPermission}
                  className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl hover:scale-105 transition-all duration-300 text-white"
                >
                  <div className="flex flex-col items-center">
                    <Mic className="w-12 h-12 mb-2" />
                    <span className="text-sm font-bold">START</span>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}