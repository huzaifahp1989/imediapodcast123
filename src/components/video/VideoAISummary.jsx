import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw, BookOpen, ListChecks, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function VideoAISummary({ 
  videoId, 
  videoTitle, 
  videoDescription,
  existingSummary,
  existingHighlights,
  onSummaryGenerated 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(existingSummary || "");
  const [highlights, setHighlights] = useState(existingHighlights || []);
  const [isExpanded, setIsExpanded] = useState(true);

  const generateSummary = async () => {
    if (!videoTitle) {
      toast.error("Video title is required to generate summary");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `You are an Islamic content summarizer. Based on the following video information, generate a comprehensive summary and key highlights.

Video Title: ${videoTitle}
${videoDescription ? `Description: ${videoDescription}` : ''}

Please provide:
1. A detailed summary (2-3 paragraphs) of what this video likely covers based on the title and description
2. 5-7 key highlights or main points that viewers can expect to learn
3. Make it relevant to Islamic education and spirituality

Format your response as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "A comprehensive 2-3 paragraph summary of the video content"
            },
            highlights: {
              type: "array",
              items: { type: "string" },
              description: "5-7 key highlights or main points"
            },
            topics: {
              type: "array",
              items: { type: "string" },
              description: "Main topics covered"
            }
          }
        }
      });

      setSummary(result.summary);
      setHighlights(result.highlights || []);
      
      if (onSummaryGenerated) {
        onSummaryGenerated({
          summary: result.summary,
          highlights: result.highlights,
          topics: result.topics
        });
      }

      toast.success("AI summary generated successfully!");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg flex items-center gap-2 text-gray-900">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            AI Summary
            <Badge className="bg-purple-100 text-purple-700 text-xs ml-2">Beta</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={generateSummary}
                disabled={isGenerating}
                className="h-8 px-2 text-purple-600"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-gray-600"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {!summary && !isGenerating && (
          <div className="text-center py-4">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-purple-400" />
            <p className="text-gray-600 text-sm mb-4">
              Generate an AI-powered summary of this video
            </p>
            <Button
              onClick={generateSummary}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-purple-600 animate-spin" />
            <p className="text-gray-600 text-sm">Analyzing video content...</p>
            <p className="text-gray-400 text-xs mt-1">This may take a few seconds</p>
          </div>
        )}

        {summary && !isGenerating && isExpanded && (
          <div className="space-y-4">
            {/* Summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-gray-900 text-sm">Summary</h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {summary}
              </p>
            </div>

            {/* Key Highlights */}
            {highlights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Key Highlights</h4>
                </div>
                <ul className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {summary && !isExpanded && (
          <p className="text-sm text-gray-600 line-clamp-2">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
}