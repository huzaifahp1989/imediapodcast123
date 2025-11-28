import React from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Signal } from "lucide-react";

export default function ConnectionIndicator({ quality, audioLevel }) {
  const getQualityConfig = () => {
    switch (quality) {
      case 'excellent':
        return {
          icon: Signal,
          color: 'bg-green-500',
          text: 'Excellent',
          bars: 4
        };
      case 'good':
        return {
          icon: Signal,
          color: 'bg-blue-500',
          text: 'Good',
          bars: 3
        };
      case 'fair':
        return {
          icon: Signal,
          color: 'bg-yellow-500',
          text: 'Fair',
          bars: 2
        };
      case 'poor':
        return {
          icon: WifiOff,
          color: 'bg-red-500',
          text: 'Poor',
          bars: 1
        };
      case 'reconnecting':
        return {
          icon: Wifi,
          color: 'bg-orange-500 animate-pulse',
          text: 'Reconnecting...',
          bars: 0
        };
      default:
        return {
          icon: WifiOff,
          color: 'bg-gray-500',
          text: 'Offline',
          bars: 0
        };
    }
  };

  const config = getQualityConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-purple-500/30">
      {/* Connection Quality */}
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 text-white ${quality === 'reconnecting' ? 'animate-pulse' : ''}`} />
        <div>
          <p className="text-xs text-purple-300">Connection</p>
          <Badge className={`${config.color} text-white text-xs`}>
            {config.text}
          </Badge>
        </div>
      </div>

      {/* Signal Bars */}
      <div className="flex items-end gap-1 h-8">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-2 rounded-t transition-all duration-300 ${
              bar <= config.bars
                ? 'bg-green-500'
                : 'bg-gray-600'
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>

      {/* Audio Level Meter */}
      <div className="flex-1">
        <p className="text-xs text-purple-300 mb-1">Audio Level</p>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 rounded-full ${
              audioLevel > 0.8
                ? 'bg-red-500'
                : audioLevel > 0.5
                ? 'bg-green-500'
                : audioLevel > 0.2
                ? 'bg-blue-500'
                : 'bg-gray-500'
            }`}
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      </div>

      {/* Numeric Audio Level */}
      <div className="text-right">
        <p className="text-xs text-purple-300">Level</p>
        <p className="text-white font-mono text-sm">
          {Math.round(audioLevel * 100)}%
        </p>
      </div>
    </div>
  );
}