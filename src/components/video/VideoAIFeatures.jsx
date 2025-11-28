import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import VideoAISummary from "./VideoAISummary";
import VideoTranscript from "./VideoTranscript";
import TranscriptGenerator from "./TranscriptGenerator";

export default function VideoAIFeatures({ video, onVideoUpdate }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("summary");

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VideoPodcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoPodcasts'] });
      if (onVideoUpdate) onVideoUpdate();
    },
  });

  const handleSummaryGenerated = async (summaryData) => {
    try {
      await updateVideoMutation.mutateAsync({
        id: video.id,
        data: {
          ai_summary: summaryData.summary,
          ai_highlights: summaryData.highlights,
        }
      });
    } catch (error) {
      console.error("Error saving summary:", error);
    }
  };

  const handleTranscriptGenerated = async (transcript) => {
    try {
      await updateVideoMutation.mutateAsync({
        id: video.id,
        data: {
          transcript: transcript,
        }
      });
    } catch (error) {
      console.error("Error saving transcript:", error);
    }
  };

  if (!video) return null;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-gray-100">
          <TabsTrigger 
            value="summary" 
            className="text-xs md:text-sm data-[state=active]:bg-white"
          >
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">AI </span>Summary
          </TabsTrigger>
          <TabsTrigger 
            value="transcript" 
            className="text-xs md:text-sm data-[state=active]:bg-white"
          >
            <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Transcript
          </TabsTrigger>
          <TabsTrigger 
            value="search" 
            className="text-xs md:text-sm data-[state=active]:bg-white"
          >
            <Search className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <VideoAISummary
            videoId={video.id}
            videoTitle={video.title}
            videoDescription={video.description}
            existingSummary={video.ai_summary}
            existingHighlights={video.ai_highlights}
            onSummaryGenerated={handleSummaryGenerated}
          />
        </TabsContent>

        <TabsContent value="transcript" className="mt-4">
          {video.transcript ? (
            <VideoTranscript
              transcript={video.transcript}
              onSeek={(seconds) => {
                // Could integrate with video player seek
                console.log("Seek to:", seconds);
              }}
            />
          ) : (
            <TranscriptGenerator
              videoId={video.id}
              videoTitle={video.title}
              videoDescription={video.description}
              videoDuration={video.duration}
              existingTranscript={video.transcript}
              onTranscriptGenerated={handleTranscriptGenerated}
            />
          )}
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          {video.transcript ? (
            <VideoTranscript
              transcript={video.transcript}
              onSeek={(seconds) => {
                console.log("Seek to:", seconds);
              }}
            />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 text-sm mb-2">No transcript to search</p>
              <p className="text-gray-400 text-xs">
                Generate a transcript first to enable search
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}