import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Radio as RadioIcon, Plus, Play, Globe } from "lucide-react";
import AudioPlayer from "../components/radio/AudioPlayer";

export default function ExternalStreams() {
  const [showForm, setShowForm] = useState(false);
  const [currentStream, setCurrentStream] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stream_url: "",
    logo_url: "",
    genre: "",
    country: "",
  });

  const queryClient = useQueryClient();

  const { data: streams, isLoading } = useQuery({
    queryKey: ['externalStreams'],
    queryFn: () => base44.entities.ExternalStream.list('-created_date'),
    initialData: [],
  });

  const createStreamMutation = useMutation({
    mutationFn: (streamData) => base44.entities.ExternalStream.create(streamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalStreams'] });
      setShowForm(false);
      setFormData({
        name: "",
        description: "",
        stream_url: "",
        logo_url: "",
        genre: "",
        country: "",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createStreamMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <RadioIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white glow-text">External Radio Streams</h1>
          <p className="text-purple-300 text-sm md:text-lg">Listen to radio stations from around the world</p>
        </div>

        {/* Current Playing */}
        {currentStream && currentStream.stream_url && (
          <AudioPlayer
            streamUrl={currentStream.stream_url}
            title={currentStream.name}
            subtitle={`${currentStream.genre || "Radio"} • ${currentStream.country || "International"}`}
            thumbnail={currentStream.logo_url}
            isLive={true}
          />
        )}

        {/* Add Stream Button */}
        <div className="flex justify-center">
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Radio Station
          </Button>
        </div>

        {/* Add Stream Form */}
        {showForm && (
          <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Add External Radio Stream</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-purple-300">Station Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="BBC Radio 1"
                    className="bg-slate-900/50 border-purple-500/30 text-white"
                    required
                  />
                </div>

                <div>
                  <Label className="text-purple-300">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="The UK's leading music station"
                    className="bg-slate-900/50 border-purple-500/30 text-white"
                  />
                </div>

                <div>
                  <Label className="text-purple-300">Stream URL</Label>
                  <Input
                    value={formData.stream_url}
                    onChange={(e) => setFormData({...formData, stream_url: e.target.value})}
                    placeholder="https://stream.example.com/radio"
                    className="bg-slate-900/50 border-purple-500/30 text-white"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-purple-300">Genre</Label>
                    <Input
                      value={formData.genre}
                      onChange={(e) => setFormData({...formData, genre: e.target.value})}
                      placeholder="Pop, Rock, News..."
                      className="bg-slate-900/50 border-purple-500/30 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-purple-300">Country</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      placeholder="United Kingdom"
                      className="bg-slate-900/50 border-purple-500/30 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-purple-300">Logo URL (optional)</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    className="bg-slate-900/50 border-purple-500/30 text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    disabled={createStreamMutation.isPending}
                  >
                    {createStreamMutation.isPending ? "Adding..." : "Add Station"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Streams Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-purple-300 mt-4">Loading stations...</p>
          </div>
        ) : streams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {streams.filter(stream => stream).map((stream) => (
              <Card 
                key={stream.id}
                className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 backdrop-blur-sm group cursor-pointer"
                onClick={() => setCurrentStream(stream)}
              >
                <CardHeader className="pb-3">
                  <div className="flex gap-4 items-start">
                    {stream.logo_url ? (
                      <img 
                        src={stream.logo_url} 
                        alt={stream.name || "Radio Station"}
                        className="w-16 h-16 rounded-xl object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <RadioIcon className="w-8 h-8 text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{stream.name || "Radio Station"}</CardTitle>
                      <p className="text-purple-300 text-sm mt-1">{stream.description || ""}</p>
                    </div>

                    <Button
                      size="icon"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <Play className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    {stream.genre && (
                      <Badge variant="outline" className="border-purple-400/50 text-purple-300">
                        {stream.genre}
                      </Badge>
                    )}
                    {stream.country && (
                      <Badge variant="outline" className="border-purple-400/50 text-purple-300 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {stream.country}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardContent className="p-12 text-center">
              <RadioIcon className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No External Streams</h3>
              <p className="text-purple-300">Add your favorite radio stations to listen</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}