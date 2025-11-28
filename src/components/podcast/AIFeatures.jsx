import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Clock, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

export default function AIFeatures({ episode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const generateAIContentMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      // Generate transcript (simulated - in production would use audio processing)
      toast.info("Generating AI content...");
      
      const prompt = `Based on this podcast episode:
Title: ${episode.title}
Description: ${episode.description || ""}
Duration: ${Math.floor(episode.duration / 60)} minutes

Please generate:
1. A concise 2-3 sentence summary
2. 5 key highlights or takeaways
3. 5-7 relevant topic tags
4. Chapter timestamps (estimate based on typical podcast structure)

Return as JSON with this structure:
{
  "summary": "...",
  "highlights": ["...", "...", ...],
  "tags": ["...", "...", ...],
  "chapters": [
    {"timestamp": 0, "title": "Introduction"},
    {"timestamp": 180, "title": "Main Topic"},
    ...
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" } },
            chapters: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  timestamp: { type: "number" },
                  title: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Update episode with AI content
      await base44.entities.Podcast.update(episode.id, {
        ai_summary: result.summary,
        ai_highlights: result.highlights,
        tags: [...new Set([...(episode.tags || []), ...result.tags])], // Merge with existing tags
        chapters: result.chapters
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      toast.success("AI content generated successfully!");
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error("Failed to generate AI content");
      console.error(error);
      setIsGenerating(false);
    }
  });

  const hasAIContent = episode.ai_summary || episode.ai_highlights?.length > 0 || episode.chapters?.length > 0;

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI-Enhanced Content
          </CardTitle>
          {!hasAIContent && (
            <Button
              onClick={() => generateAIContentMutation.mutate()}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Content
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasAIContent ? (
          <>
            {/* AI Summary */}
            {episode.ai_summary && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <h4 className="font-semibold text-white">AI Summary</h4>
                </div>
                <p className="text-gray-300 bg-slate-900/50 p-4 rounded-lg">
                  {episode.ai_summary}
                </p>
              </div>
            )}

            {/* Key Highlights */}
            {episode.ai_highlights && episode.ai_highlights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h4 className="font-semibold text-white">Key Highlights</h4>
                </div>
                <ul className="space-y-2">
                  {episode.ai_highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <span className="text-purple-400 mt-1">✦</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chapters */}
            {episode.chapters && episode.chapters.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <h4 className="font-semibold text-white">Chapters</h4>
                </div>
                <div className="space-y-2">
                  {episode.chapters.map((chapter, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors">
                      <Badge variant="outline" className="border-purple-400/50 text-purple-300">
                        {Math.floor(chapter.timestamp / 60)}:{(chapter.timestamp % 60).toString().padStart(2, '0')}
                      </Badge>
                      <span className="text-gray-300">{chapter.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Generated Tags */}
            {episode.tags && episode.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <h4 className="font-semibold text-white">Topics</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {episode.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="border-purple-400/50 text-purple-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
            <p className="text-purple-300 mb-4">
              Generate AI-powered summaries, highlights, chapters, and topic tags for this episode
            </p>
            <Button
              onClick={() => generateAIContentMutation.mutate()}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Content
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}