import React from "react";
import { Bus, Train, TrainFront } from "lucide-react";

// Google Transit Types
export enum GoogleTransitMode {
  BUS = 'BUS',
  SUBWAY = 'SUBWAY',
  TRAIN = 'TRAIN',
  TRAM = 'TRAM',
  RAIL = 'RAIL'
}

// Get transit icon based on vehicle type
export function getTransitIcon(type: GoogleTransitMode): React.ReactElement {
  switch (type) {
    case GoogleTransitMode.BUS:
      return <Bus className="h-4 w-4" />;
    case GoogleTransitMode.SUBWAY:
      return <TrainFront className="h-4 w-4" />;
    case GoogleTransitMode.TRAIN:
      return <Train className="h-4 w-4" />;
    case GoogleTransitMode.TRAM:
      return <Train className="h-4 w-4" />; // Use Train icon for tram
    default:
      return <Train className="h-4 w-4" />;
  }
}

// Get TTC line color (for known lines)
export function getTTCLineColor(lineName: string): { bg: string; text: string } {
  if (!lineName) {
    return { bg: '#165788', text: '#FFFFFF' };
  }
  
  const name = lineName.toUpperCase();
  
  // Subway lines - more flexible matching
  if (name.includes('LINE 1') || name.includes('YONGE') || name.includes('UNIVERSITY')) {
    return { bg: '#FCBA12', text: '#000000' };
  }
  if (name.includes('LINE 2') || name.includes('BLOOR') || name.includes('DANFORTH')) {
    return { bg: '#00923F', text: '#FFFFFF' };
  }
  if (name.includes('LINE 3') || name.includes('SCARBOROUGH') || name.includes('RT')) {
    return { bg: '#0082C9', text: '#FFFFFF' };
  }
  if (name.includes('LINE 4') || name.includes('SHEPPARD')) {
    return { bg: '#A3238E', text: '#FFFFFF' };
  }
  
  // Streetcars (red) - match line numbers
  if (name.match(/^\d{3}[A-Z]?$/)) { // e.g., "501", "509A"
    return { bg: '#E31937', text: '#FFFFFF' };
  }
  
  // Bus routes (numeric) - use TTC red
  if (name.match(/^\d{1,3}[A-Z]?$/)) { // e.g., "7", "25B", "196"
    return { bg: '#E31937', text: '#FFFFFF' };
  }
  
  // Default bus color for unknown
  return { bg: '#165788', text: '#FFFFFF' };
}

// Format time helper
export function formatTime(date: Date) {
  return date.toLocaleTimeString('en-CA', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Format duration helper
export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Format distance helper
export function formatDistance(meters: number) {
  const km = meters / 1000;
  if (km < 1) {
    return `${Math.round(meters)}m`;
  }
  return `${km.toFixed(1)}km`;
}

// Get route segment color based on transit details
export function getRouteSegmentColor(step: { transit_details?: { line?: { color?: string; name?: string; short_name?: string; vehicle?: { type?: string } } } }, isTransit: boolean): string {
  if (!isTransit) {
    // Walking segments - use green to differentiate from driving
    return '#22C55E'; // Green-500
  }

  // For transit segments, try to use actual line colors
  if (step.transit_details?.line) {
    const line = step.transit_details.line;
    
    // If Google provides a color, use it (but validate it's a real color)
    if (line.color && line.color.startsWith('#')) {
      return line.color;
    }
    
    // Otherwise, use our TTC color mapping
    const ttcColors = getTTCLineColor(line.name || line.short_name || '');
    
    // For buses (numeric routes), use TTC bus red
    if (line.vehicle?.type === 'BUS' || (line.short_name && /^\d+[A-Z]?$/.test(line.short_name))) {
      return '#E31937'; // TTC Bus Red
    }
    
    // For subway lines, use TTC colors
    return ttcColors.bg;
  }

  // Default fallback - purple for unknown transit
  return '#9333EA';
} 