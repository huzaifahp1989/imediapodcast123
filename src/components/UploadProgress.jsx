import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle, Clock, Gauge } from "lucide-react";

export default function UploadProgress({ 
  stage, 
  progress, 
  fileName, 
  fileSize,
  uploadSpeed,
  estimatedTime 
}) {
  const stages = {
    compressing: { 
      icon: Gauge, 
      text: "Compressing file...", 
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-300"
    },
    uploading: { 
      icon: Upload, 
      text: "Uploading...", 
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-300"
    },
    processing: { 
      icon: Loader2, 
      text: "Processing...", 
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-300"
    },
    complete: { 
      icon: CheckCircle, 
      text: "Complete!", 
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-300"
    }
  };

  const currentStage = stages[stage] || stages.uploading;
  const Icon = currentStage.icon;

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return "Calculating...";
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return "Calculating...";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className={`${currentStage.bg} ${currentStage.border} border-2`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${currentStage.bg}`}>
                <Icon className={`w-6 h-6 ${currentStage.color} ${stage === 'processing' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${currentStage.color}`}>
                  {currentStage.text}
                </h3>
                {fileName && (
                  <p className="text-sm text-gray-700 line-clamp-1">{fileName}</p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={`${currentStage.color} border-current`}>
              {Math.round(progress)}%
            </Badge>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="grid grid-cols-3 gap-4 text-sm">
            {fileSize && (
              <div className="flex items-center gap-2 text-gray-700">
                <Upload className="w-4 h-4" />
                <span>{formatFileSize(fileSize)}</span>
              </div>
            )}
            {uploadSpeed > 0 && (
              <div className="flex items-center gap-2 text-gray-700">
                <Gauge className="w-4 h-4" />
                <span>{formatSpeed(uploadSpeed)}</span>
              </div>
            )}
            {estimatedTime > 0 && (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4" />
                <span>{formatTime(estimatedTime)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}