import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function HaramainLive() {
  const streams = [
    {
      id: "7-Qf3g-0xEI",
      title: "Makkah Live",
      description: "Live stream from Masjid al-Haram, Makkah",
      location: "Makkah Al-Mukarramah",
    },
    {
      id: "TpT8b8JFZ6E",
      title: "Madinah Live",
      description: "Live stream from Masjid an-Nabawi, Madinah",
      location: "Madinah Al-Munawwarah",
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Haramain Live</h1>
          <p className="text-gray-700 text-lg">Watch live broadcasts from the Two Holy Mosques</p>
        </div>

        {/* Live Streams */}
        <div className="grid md:grid-cols-2 gap-6">
          {streams.map((stream) => (
            <Card key={stream.id} className="bg-white border-gray-300 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                {/* Video Container */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${stream.id}?autoplay=0&mute=0`}
                    title={stream.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ border: 0 }}
                  />
                </div>

                {/* Stream Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">{stream.title}</h2>
                    <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-2">{stream.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <span>{stream.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Alert */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              About Haramain Live
            </h3>
            <div className="space-y-2 text-gray-700">
              <p>
                📍 Watch live 24/7 broadcasts from the Two Holy Mosques
              </p>
              <p>
                🕌 Experience the daily prayers, Friday sermons, and special occasions
              </p>
              <p>
                🌙 Connect spiritually with the blessed places from anywhere in the world
              </p>
              <p className="text-sm text-gray-600 mt-4">
                These streams are provided by official channels. May Allah accept your worship and grant you the opportunity to visit these blessed places.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}