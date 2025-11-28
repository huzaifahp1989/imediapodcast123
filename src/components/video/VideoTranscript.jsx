import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, Clock, ChevronDown, ChevronUp, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VideoTranscript({ transcript, videoRef, onSeek }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Parse transcript into segments (assuming format: "00:00 - Text here")
  const parseTranscript = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n').filter(line => line.trim());
    const segments = [];
    
    lines.forEach((line, index) => {
      const timeMatch = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*(.+)/);
      if (timeMatch) {
        const timeStr = timeMatch[1];
        const parts = timeStr.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 3) {
          seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else {
          seconds = parts[0] * 60 + parts[1];
        }
        segments.push({
          id: index,
          time: timeStr,
          seconds,
          text: timeMatch[2].trim()
        });
      } else if (line.trim()) {
        segments.push({
          id: index,
          time: null,
          seconds: null,
          text: line.trim()
        });
      }
    });
    
    return segments;
  };

  const segments = parseTranscript(transcript);

  const filteredSegments = segments.filter(segment =>
    segment.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSegmentClick = (segment) => {
    if (segment.seconds !== null && onSeek) {
      onSeek(segment.seconds);
      setHighlightedIndex(segment.id);
    }
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    toast.success("Transcript copied to clipboard!");
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded!");
  };

  const highlightSearchTerm = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 text-gray-900 px-0.5 rounded">{part}</mark>
      ) : part
    );
  };

  if (!transcript) return null;

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg flex items-center gap-2 text-gray-900">
            <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            Transcript
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyTranscript}
              className="h-8 px-2 text-gray-600"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTranscript}
              className="h-8 px-2 text-gray-600"
            >
              <Download className="w-4 h-4" />
            </Button>
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
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transcript..."
            className="pl-9 h-9 text-sm bg-gray-50 border-gray-200"
          />
          {searchTerm && filteredSegments.length > 0 && (
            <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-700 text-xs">
              {filteredSegments.length} results
            </Badge>
          )}
        </div>

        {/* Transcript content */}
        <ScrollArea className={`${isExpanded ? 'h-80' : 'h-40'} transition-all`}>
          <div className="space-y-2 pr-4">
            {(searchTerm ? filteredSegments : segments).map((segment) => (
              <div
                key={segment.id}
                onClick={() => handleSegmentClick(segment)}
                className={`p-2 rounded-lg transition-all ${
                  segment.seconds !== null 
                    ? 'cursor-pointer hover:bg-gray-100' 
                    : ''
                } ${highlightedIndex === segment.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
              >
                <div className="flex gap-2">
                  {segment.time && (
                    <span className="text-xs text-blue-600 font-mono flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {segment.time}
                    </span>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {highlightSearchTerm(segment.text)}
                  </p>
                </div>
              </div>
            ))}
            
            {searchTerm && filteredSegments.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">
                No results found for "{searchTerm}"
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}