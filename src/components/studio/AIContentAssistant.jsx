import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  Loader2,
  FileText,
  Tag,
  Type,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function AIContentAssistant({ onApplyTitle, onApplyDescription, onApplyTags }) {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("video");
  const [category, setCategory] = useState("Lectures");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const categories = [
    "Quran", "Hadith", "Lectures", "Nasheeds", "Tafsir", 
    "Seerah", "Fiqh", "Spirituality", "General"
  ];

  const generateContent = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or brief description");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `You are an AI assistant for an Islamic media platform. Generate content metadata for a ${contentType} about: "${topic}"

Category: ${category}

Please generate:
1. A compelling, SEO-friendly title (max 60 characters)
2. A detailed description (150-200 words) that is informative and engaging
3. 8-10 relevant tags for discoverability

The content should be appropriate for an Islamic audience and maintain respectful, educational tone.

Respond in this exact JSON format:
{
  "title": "your generated title",
  "description": "your generated description",
  "tags": ["tag1", "tag2", "tag3", ...]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          },
          required: ["title", "description", "tags"]
        }
      });

      setGeneratedContent(response);
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApply = (field) => {
    if (!generatedContent) return;
    
    switch (field) {
      case "title":
        onApplyTitle?.(generatedContent.title);
        toast.success("Title applied!");
        break;
      case "description":
        onApplyDescription?.(generatedContent.description);
        toast.success("Description applied!");
        break;
      case "tags":
        onApplyTags?.(generatedContent.tags);
        toast.success("Tags applied!");
        break;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
      <CardHeader className="p-3 md:p-4 pb-2">
        <CardTitle className="text-white text-sm md:text-base flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Content Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-0 space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <div>
            <Label className="text-purple-300 text-xs md:text-sm">What's your content about?</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., A lecture on the importance of prayer in Islam, tips for memorizing Quran..."
              className="bg-slate-800/50 border-purple-500/30 text-white text-sm h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-purple-300 text-xs md:text-sm">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-purple-500/30">
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-300 text-xs md:text-sm">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-purple-500/30">
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateContent}
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div className="space-y-3 pt-3 border-t border-purple-500/30">
            {/* Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-purple-300 text-xs flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  Generated Title
                </Label>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedContent.title, "title")}
                    className="h-6 px-2 text-purple-300 hover:text-white"
                  >
                    {copiedField === "title" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  {onApplyTitle && (
                    <Button
                      size="sm"
                      onClick={() => handleApply("title")}
                      className="h-6 px-2 bg-purple-600 hover:bg-purple-700 text-xs"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-white text-sm">
                {generatedContent.title}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-purple-300 text-xs flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Generated Description
                </Label>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedContent.description, "description")}
                    className="h-6 px-2 text-purple-300 hover:text-white"
                  >
                    {copiedField === "description" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  {onApplyDescription && (
                    <Button
                      size="sm"
                      onClick={() => handleApply("description")}
                      className="h-6 px-2 bg-purple-600 hover:bg-purple-700 text-xs"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-white text-xs md:text-sm max-h-32 overflow-y-auto">
                {generatedContent.description}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-purple-300 text-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Generated Tags
                </Label>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedContent.tags.join(", "), "tags")}
                    className="h-6 px-2 text-purple-300 hover:text-white"
                  >
                    {copiedField === "tags" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  {onApplyTags && (
                    <Button
                      size="sm"
                      onClick={() => handleApply("tags")}
                      className="h-6 px-2 bg-purple-600 hover:bg-purple-700 text-xs"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {generatedContent.tags.map((tag, idx) => (
                  <Badge key={idx} className="bg-purple-500/20 text-purple-300 text-[10px] md:text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Regenerate */}
            <Button
              variant="outline"
              size="sm"
              onClick={generateContent}
              disabled={isGenerating}
              className="w-full border-purple-500/30 text-purple-300 hover:text-white"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}