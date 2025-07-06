"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface HeatmapControlProps {
  heatmapVisible: boolean;
  heatmapLoaded: boolean;
  heatmapError?: string | null;
  onToggleHeatmap: () => void;
  onSetIntensity: (intensity: number) => void;
}

export function HeatmapControl({
  heatmapVisible,
  heatmapLoaded,
  heatmapError,
  onToggleHeatmap,
  onSetIntensity,
}: HeatmapControlProps) {
  const [showIntensity, setShowIntensity] = useState(false);

  const handleIntensityChange = (intensity: number) => {
    onSetIntensity(intensity);
    setShowIntensity(false);
  };

  return (
    <div className="absolute top-4 right-16 z-10 flex flex-col gap-2">
      <Card className="p-2 bg-gray-900/90 border-gray-700 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant={heatmapVisible ? "default" : "outline"}
            size="sm"
            onClick={onToggleHeatmap}
            disabled={!heatmapLoaded}
            className="flex items-center gap-2 text-xs"
            title={heatmapError ? `Error: ${heatmapError}` : heatmapLoaded ? "Toggle safety overlay" : "Loading safety data..."}
          >
            {heatmapVisible ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {heatmapError ? "Error" : heatmapLoaded ? (heatmapVisible ? "Hide Safety" : "Show Safety") : "Loading..."}
          </Button>
          
          {heatmapVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIntensity(!showIntensity)}
              className="p-2"
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>

      {showIntensity && heatmapVisible && (
        <Card className="p-3 bg-gray-900/90 border-gray-700 backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-gray-300 mb-2">
              Safety Overlay Intensity
            </h3>
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleIntensityChange(0.3)}
                className="text-xs py-1"
              >
                Subtle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleIntensityChange(0.6)}
                className="text-xs py-1"
              >
                Normal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleIntensityChange(0.9)}
                className="text-xs py-1"
              >
                Intense
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 