import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";

export default function ShowCard({ show, onClick }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "live": return "bg-green-500 text-white";
      case "recording": return "bg-red-500 text-white animate-pulse";
      case "scheduled": return "bg-blue-500 text-white";
      case "ended": return "bg-gray-500 text-white";
      case "cancelled": return "bg-orange-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (!show) return null;

  return (
    <Card 
      className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white">{show.title || "Untitled Show"}</h3>
          {show.stream_url && (
            <Badge className="bg-green-500 text-white">
              Available
            </Badge>
          )}
          {!show.stream_url && show.status && (
            <Badge className={getStatusColor(show.status)}>
              {show.status}
            </Badge>
          )}
        </div>
        <p className="text-purple-300 text-sm">{show.description || "No description"}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {show.host_name && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <User className="w-4 h-4 text-purple-400" />
            <span>{show.host_name}</span>
          </div>
        )}
        {show.scheduled_start && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>{format(new Date(show.scheduled_start), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>
                {format(new Date(show.scheduled_start), "h:mm a")}
                {show.scheduled_end && ` - ${format(new Date(show.scheduled_end), "h:mm a")}`}
              </span>
            </div>
          </>
        )}
        {show.tags && show.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {show.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-purple-400/50 text-purple-300">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}