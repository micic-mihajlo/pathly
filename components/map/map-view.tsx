"use client";

import { RefObject } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapViewProps {
  mapContainer: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
}

export function MapView({ mapContainer, isLoading }: MapViewProps) {
  return (
    <>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full" />
    </>
  );
} 