import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Sparkles, Wand2, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function TranscriptGenerator({ 
  videoId,
  videoTitle,
  videoDescription,
  videoDuration,
  existingTranscript,
  onTranscriptGenerated 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcript, setTranscript] = useState(existingTranscript || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");

  const formatDuration = (seconds) => {
    if (!seconds) return "unknown duration";
    const mins = Math.floor(seconds / 60);
    return `${mins} minutes`;
  };

  const generateTranscript = async () => {
    if (!videoTitle) {
      toast.error("Video title is required");
      return;
    }

    setIsGenerating(true);
    try {
      const duration = formatDuration(videoDuration);
      
      const prompt = `You are creating a detailed transcript for an Islamic educational video. Based on the video information below, generate a realistic transcript with timestamps.

Video Title: ${videoTitle}
Duration: ${duration}
${videoDescription ? `Description: ${videoDescription}` : ''}

Generate a detailed transcript that:
1. Has timestamps every 30-60 seconds (format: "00:00 - Text here")
2. Covers the topic comprehensively based on the title
3. Uses appropriate Islamic terminology and references
4. Includes introduction, main content, and conclusion
5. Is educational and informative

Make it realistic and educational. Each segment should be 2-3 sentences.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            transcript: {
              type: "string",
              description: "The full transcript with timestamps"
            }
          }
        }
      });

      setTranscript(result.transcript);
      
      if (onTranscriptGenerated) {
        onTranscriptGenerated(result.transcript);
      }

      toast.success("Transcript generated successfully!");
    } catch (error) {
      console.error("Error generating transcript:", error);
      toast.error("Failed to generate transcript");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setEditedTranscript(transcript);
    setIsEditing(true);
  };

  const handleSave = () => {
    setTranscript(editedTranscript);
    setIsEditing(false);
    if (onTranscriptGenerated) {
      onTranscriptGenerated(editedTranscript);
    }
    toast.success("Transcript saved!");
  };

  const handleCancel = () => {
    setEditedTranscript("");
    setIsEditing(false);
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg flex items-center gap-2 text-gray-900">
            <Wand2 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            AI Transcript Generator
            <Badge className="bg-green-100 text-green-700 text-xs ml-2">AI</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {!transcript && !isGenerating && (
          <div className="text-center py-6">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 text-sm mb-2">No transcript available</p>
            <p className="text-gray-400 text-xs mb-4">
              Generate an AI transcript based on video information
            </p>
            <Button
              onClick={generateTranscript}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Transcript
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-green-600 animate-spin" />
            <p className="text-gray-700 font-medium">Generating transcript...</p>
            <p className="text-gray-400 text-sm mt-1">
              Creating detailed timestamps and content
            </p>
          </div>
        )}

        {transcript && !isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-100 text-green-700">
                <FileText className="w-3 h-3 mr-1" />
                Transcript Ready
              </Badge>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      className="h-8 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateTranscript}
                      className="h-8 text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="h-8 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <Textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="min-h-[200px] text-sm font-mono"
                placeholder="Edit transcript..."
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {transcript.slice(0, 500)}
                  {transcript.length > 500 && "..."}
                </pre>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center">
              AI-generated transcript based on video title and description
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}