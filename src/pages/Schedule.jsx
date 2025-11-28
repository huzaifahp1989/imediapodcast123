import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import ShowCard from "../components/radio/ShowCard";

export default function Schedule() {
  const [filter, setFilter] = useState("all");

  const { data: shows, isLoading } = useQuery({
    queryKey: ['shows'],
    queryFn: () => base44.entities.Show.list('-scheduled_start'),
    initialData: [],
  });

  const filterShows = (shows) => {
    const now = new Date();
    
    return shows.filter(show => {
      if (!show || !show.scheduled_start) return false;
      
      try {
        const startDate = new Date(show.scheduled_start);
        
        switch (filter) {
          case "today":
            return isToday(startDate);
          case "tomorrow":
            return isTomorrow(startDate);
          case "week":
            return isThisWeek(startDate);
          case "live":
            return show.status === "live";
          default:
            return startDate > now || show.status === "live";
        }
      } catch (error) {
        console.error("Error filtering show:", error, show);
        return false;
      }
    });
  };

  const filteredShows = filterShows(shows);

  const groupByDate = (shows) => {
    const grouped = {};
    shows.forEach(show => {
      if (!show || !show.scheduled_start) return;
      
      try {
        const date = format(new Date(show.scheduled_start), "yyyy-MM-dd");
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(show);
      } catch (error) {
        console.error("Error grouping show:", error, show);
      }
    });
    return grouped;
  };

  const groupedShows = groupByDate(filteredShows);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white glow-text">Show Schedule</h1>
          <p className="text-purple-300 text-sm md:text-lg">Plan your listening schedule</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center">
          <Tabs value={filter} onValueChange={setFilter} className="w-full max-w-2xl">
            <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full bg-slate-800/50 border border-purple-500/30 gap-1">
              <TabsTrigger value="all" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
                All
              </TabsTrigger>
              <TabsTrigger value="live" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
                Live
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
                Today
              </TabsTrigger>
              <TabsTrigger value="tomorrow" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 hidden sm:flex">
                Tomorrow
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 hidden sm:flex">
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Schedule */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-purple-300 mt-4">Loading schedule...</p>
          </div>
        ) : Object.keys(groupedShows).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedShows).map(([date, dayShows]) => {
              try {
                const formattedDate = format(new Date(date), "EEEE, MMMM d, yyyy");
                return (
                  <div key={date}>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <CalendarIcon className="w-6 h-6 text-purple-400" />
                      {formattedDate}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {dayShows.map(show => (
                        <ShowCard key={show.id} show={show} />
                      ))}
                    </div>
                  </div>
                );
              } catch (error) {
                console.error("Error rendering date group:", error, date);
                return null;
              }
            })}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Shows Scheduled</h3>
              <p className="text-purple-300">
                {filter === "all" 
                  ? "No upcoming shows scheduled yet"
                  : `No shows scheduled for ${filter}`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}