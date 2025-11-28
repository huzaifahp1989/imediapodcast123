import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AudioPlayer({ 
  streamUrl, 
  title = "Live Stream", 
  subtitle = "Now Playing",
  thumbnail,
  isLive = false 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current || !streamUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!streamUrl) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-purple-500/30 backdrop-blur-xl overflow-hidden">
      <div className="relative">
        {thumbnail && (
          <div className="absolute inset-0 opacity-20">
            <img src={thumbnail} alt={title || "Audio"} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="relative p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {thumbnail ? (
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/50 flex-shrink-0">
                <img src={thumbnail} alt={title || "Audio"} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50 flex-shrink-0">
                <div className="text-4xl">🎵</div>
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h3 className="text-2xl font-bold text-white glow-text">{title || "Live Stream"}</h3>
                {isLive && (
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-purple-300">{subtitle || "Now Playing"}</p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                size="lg"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/50 transition-all duration-300 hover:scale-110"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </Button>

              <div className="flex items-center gap-3 bg-slate-800/50 rounded-full px-4 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="hover:bg-purple-500/20 rounded-full"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-purple-300" /> : <Volume2 className="w-5 h-5 text-purple-300" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={streamUrl} />
    </Card>
  );
}