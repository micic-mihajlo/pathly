"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";

interface HeatmapLegendProps {
  visible: boolean;
}

export function HeatmapLegend({ visible }: HeatmapLegendProps) {
  if (!visible) return null;

  return (
    <Card className="absolute bottom-4 left-4 z-10 p-4 bg-gray-900/90 border-gray-700 backdrop-blur-sm max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-orange-400" />
        <h3 className="text-sm font-medium text-white">Safety Zones</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500"></div>
          <span className="text-xs text-gray-300">Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500"></div>
          <span className="text-xs text-gray-300">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500"></div>
          <span className="text-xs text-gray-300">High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-800"></div>
          <span className="text-xs text-gray-300">Very High Risk</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-start gap-2">
          <Info className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-400">
            Each hexagon shows aggregated crime data from June-August 2024. Red zones strongly suggest using public transit.
          </p>
        </div>
      </div>
    </Card>
  );
} 