"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Navigation, 
  Search, 
  User, 
  Menu,
  X,
  Layers,
  Compass,
  MapPinIcon,
  Car,
  PersonStanding,
  Bike,
  Train,
  Bus,
  TrainFront,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

// Toronto coordinates for search bias
const TORONTO_COORDS: [number, number] = [-79.3832, 43.6532]; // CN Tower

interface SearchSuggestion {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted: string;
  feature_type: string;
  poi_category?: string[];
  maki?: string;
}

enum TransportMode {
  DRIVING = 'driving',
  WALKING = 'walking',
  CYCLING = 'cycling',
  TRANSIT = 'transit'
}

// Google Transit Types
enum GoogleTransitMode {
  BUS = 'BUS',
  SUBWAY = 'SUBWAY',
  TRAIN = 'TRAIN',
  TRAM = 'TRAM',
  RAIL = 'RAIL'
}

interface TransitDetails {
  arrivalStop: string;
  arrivalTime: string;
  departureStop: string;
  departureTime: string;
  headsign: string;
  line: {
    name: string;
    shortName?: string;
    color?: string;
    textColor?: string;
    vehicle?: {
      type: GoogleTransitMode;
      name: string;
      icon?: string;
    };
    agencies?: Array<{
      name: string;
      url?: string;
      phone?: string;
    }>;
  };
  numStops: number;
}

interface RouteStep {
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
  instructions?: string;
  travelMode?: string;
  transitDetails?: TransitDetails;
  steps?: RouteStep[]; // For sub-steps in transit
  polyline?: {
    points: string;
  };
  maneuver?: string;
}

interface GoogleRoute {
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  copyrights: string;
  legs: Array<{
    arrival_time?: {
      text: string;
      time_zone: string;
      value: number;
    };
    departure_time?: {
      text: string;
      time_zone: string;
      value: number;
    };
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    end_address: string;
    end_location: { lat: number; lng: number };
    start_address: string;
    start_location: { lat: number; lng: number };
    steps: RouteStep[];
  }>;
  overview_polyline: {
    points: string;
  };
  summary: string;
  warnings?: string[];
  waypoint_order?: number[];
  fare?: {
    currency: string;
    value: number;
    text: string;
  };
}

interface RouteInfo {
  duration: number;
  distance: number;
  geometry?: GeoJSON.Geometry;
  polyline?: string;
  mode: TransportMode;
  googleRoute?: GoogleRoute;
  departureTime?: Date;
  arrivalTime?: Date;
  fare?: {
    currency: string;
    value: number;
    text: string;
  };
  warnings?: string[];
}

// Decode Google polyline to coordinates
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

// Get transit icon based on vehicle type
function getTransitIcon(type: GoogleTransitMode): React.ReactElement {
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
function getTTCLineColor(lineName: string): { bg: string; text: string } {
  const name = lineName.toUpperCase();
  
  // Subway lines
  if (name.includes('LINE 1') || name.includes('YONGE')) {
    return { bg: '#FCBA12', text: '#000000' };
  }
  if (name.includes('LINE 2') || name.includes('BLOOR')) {
    return { bg: '#00923F', text: '#FFFFFF' };
  }
  if (name.includes('LINE 3') || name.includes('SCARBOROUGH')) {
    return { bg: '#0082C9', text: '#FFFFFF' };
  }
  if (name.includes('LINE 4') || name.includes('SHEPPARD')) {
    return { bg: '#A3238E', text: '#FFFFFF' };
  }
  
  // Streetcars (red)
  if (name.match(/^\d{3}[A-Z]?$/)) { // e.g., "501", "509A"
    return { bg: '#E31937', text: '#FFFFFF' };
  }
  
  // Default bus color
  return { bg: '#165788', text: '#FFFFFF' };
}

export function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [selectedTransportMode, setSelectedTransportMode] = useState<TransportMode>(TransportMode.DRIVING);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [routeAlternatives, setRouteAlternatives] = useState<GoogleRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const [transitPreferences, setTransitPreferences] = useState({
    mode: 'best', // best, fewer_transfers, less_walking
    routePreference: 'best_route', // best_route, fewer_transfers, less_walking
    transitModes: ['bus', 'subway', 'train', 'tram']
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Get user location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation([longitude, latitude]);
        
        // Initialize map with user location
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [longitude, latitude],
          zoom: 15,
          pitch: 45,
          bearing: 0,
          antialias: true,
        });

        // Add user location marker
        const userMarker = new mapboxgl.Marker({
          color: "#3b82f6",
          scale: 1.2,
        })
          .setLngLat([longitude, latitude])
          .addTo(map.current);
        
        markersRef.current.push(userMarker);

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        });
        map.current.addControl(geolocate, "top-right");

        // Add scale control
        map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");

        // Add 3D buildings layer
        map.current.on("style.load", () => {
          if (!map.current) return;
          
          const layers = map.current.getStyle().layers;
          const labelLayerId = layers.find(
            (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
          )?.id;

          map.current.addLayer({
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.6,
            },
          }, labelLayerId);
        });

        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        // Fallback to Toronto (CN Tower) if geolocation fails
        setUserLocation(TORONTO_COORDS);
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          center: TORONTO_COORDS,
          zoom: 13,
          pitch: 45,
          bearing: 0,
          antialias: true,
        });

        // Add user location marker for Toronto fallback
        const userMarker = new mapboxgl.Marker({
          color: "#3b82f6",
          scale: 1.2,
        })
          .setLngLat(TORONTO_COORDS)
          .addTo(map.current);
        
        markersRef.current.push(userMarker);

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
        
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        });
        map.current.addControl(geolocate, "top-right");

        map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");

        setIsLoading(false);
      }
    );

    return () => {
      if (map.current) {
        map.current.remove();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Recalculate route when transport mode changes
  useEffect(() => {
    if (currentRoute && userLocation && destination) {
      getRoute(userLocation, destination, selectedTransportMode);
    }
  }, [selectedTransportMode]);

  // Real-time search with debouncing
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing route when starting a new search
    if (value.trim().length >= 2 && currentRoute) {
      clearRoute(false); // Don't clear search query
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSearchSuggestions(value);
    }, 300);
  };

  const sessionToken = useRef(Math.random().toString(36).substring(2, 15));

  const fetchSearchSuggestions = async (query: string) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?` +
        `q=${encodeURIComponent(query)}&` +
        `access_token=${MAPBOX_TOKEN}&` +
        `session_token=${sessionToken.current}&` +
        `limit=8&` +
        `proximity=${TORONTO_COORDS[0]},${TORONTO_COORDS[1]}&` +
        `language=en&` +
        `country=CA`
      );
      const data = await response.json();
      
      if (data.suggestions) {
        setSearchSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.full_address || suggestion.name);
    setShowSuggestions(false);
    
    try {
      // Retrieve coordinates using the mapbox_id
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `session_token=${sessionToken.current}`
      );
      const data = await response.json();
      
      if (data.features && data.features[0]) {
        const coordinates = data.features[0].geometry.coordinates as [number, number];
        setDestination(coordinates);
        
        if (userLocation) {
          getRoute(userLocation, coordinates, selectedTransportMode);
        }
      }
    } catch (error) {
      console.error("Error retrieving coordinates:", error);
    }
  };

  const getRoute = async (start: [number, number], end: [number, number], mode: TransportMode = selectedTransportMode) => {
    try {
      if (mode === TransportMode.TRANSIT) {
        // Use Google Maps API for transit
        await getGoogleTransitRoute(start, end);
      } else {
        // Use Mapbox for driving, walking, cycling
        await getMapboxRoute(start, end, mode);
      }
    } catch (error) {
      console.error("Route error:", error);
    }
  };

  const getGoogleTransitRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const origin = `${start[1]},${start[0]}`;
      const destination = `${end[1]},${end[0]}`;
      
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          mode: 'transit',
          alternatives: true,
          transitOptions: {
            modes: transitPreferences.transitModes,
            routingPreference: transitPreferences.routePreference,
            departureTime: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();
      
      // Debug log the response
      console.log('Frontend received Google transit data:', data);
      
      if (!response.ok) {
        console.error('Response not ok:', data);
        throw new Error(`API error: ${response.status}`);
      }
      
      if (data.routes && data.routes.length > 0) {
        setRouteAlternatives(data.routes);
        setSelectedRouteIndex(0);
        
        const route = data.routes[0];
        const leg = route.legs[0];
        
        setCurrentRoute({
          duration: leg.duration.value,
          distance: leg.distance.value,
          polyline: route.overview_polyline.points,
          mode: TransportMode.TRANSIT,
          googleRoute: route,
          departureTime: leg.departure_time ? new Date(leg.departure_time.value * 1000) : undefined,
          arrivalTime: leg.arrival_time ? new Date(leg.arrival_time.value * 1000) : undefined,
          fare: route.fare,
          warnings: route.warnings,
        });
        
        setRouteSteps(leg.steps);
        addGoogleRouteToMap(route, start, end, TransportMode.TRANSIT);
      }
    } catch (error) {
      console.error("Google transit error:", error);
      // Fallback to Mapbox driving if Google fails
      await getMapboxRoute(start, end, TransportMode.DRIVING);
    }
  };

  const getMapboxRoute = async (start: [number, number], end: [number, number], mode: TransportMode) => {
    try {
      const mapboxProfile = mode === TransportMode.TRANSIT ? TransportMode.DRIVING : mode;
      
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${mapboxProfile}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setCurrentRoute({
          duration: route.duration,
          distance: route.distance,
          geometry: route.geometry,
          mode: mode,
        });
        
        // Convert Mapbox steps to our format
        const convertedSteps = route.legs[0].steps.map((step: {
          distance: number;
          duration: number;
          maneuver?: { instruction?: string };
        }) => ({
          distance: {
            text: `${(step.distance / 1000).toFixed(1)} km`,
            value: step.distance,
          },
          duration: {
            text: `${Math.round(step.duration / 60)} min`,
            value: step.duration,
          },
          instructions: step.maneuver?.instruction || 'Continue',
          travelMode: mode.toUpperCase(),
        }));
        
        setRouteSteps(convertedSteps);
        addRouteToMap(route.geometry, start, end);
      }
    } catch (error) {
      console.error("Mapbox route error:", error);
    }
  };

  const addGoogleRouteToMap = (route: GoogleRoute, start: [number, number], end: [number, number], mode: TransportMode) => {
    if (!map.current) return;

    // Remove existing route layers
    ['route', 'route-walking', 'route-transit'].forEach(layerId => {
      if (map.current!.getSource(layerId)) {
        map.current!.removeLayer(layerId);
        map.current!.removeSource(layerId);
      }
    });

    if (mode === TransportMode.TRANSIT) {
      // Add color-coded segments for transit routes
      const leg = route.legs[0];
      leg.steps.forEach((step: RouteStep & { travel_mode?: string }, index) => {
        if (step.polyline?.points) {
          const coordinates = decodePolyline(step.polyline.points);
          // Check both possible property names from Google API
          const travelMode = step.travel_mode || step.travelMode;
          const isTransit = travelMode === 'TRANSIT';
          const sourceId = `route-segment-${index}`;
          const layerId = `route-segment-${index}`;
          
          // Debug log
          console.log(`Step ${index}: travelMode=${travelMode}, isTransit=${isTransit}`);

          map.current!.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates,
              },
            },
          });

          map.current!.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': isTransit ? '#9333ea' : '#22c55e', // Purple for transit, green for walking
              'line-width': isTransit ? 8 : 4,
              'line-opacity': 0.8,
            },
          });
        }
      });
    } else {
      // Single color for non-transit routes
      const coordinates = decodePolyline(route.overview_polyline.points);
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 6,
          'line-opacity': 0.8,
        },
      });
    }

    // Clear existing markers and add new ones
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add start marker (user location)
    const startMarker = new mapboxgl.Marker({
      color: "#22c55e",
      scale: 1.2,
    })
      .setLngLat(start)
      .addTo(map.current);
    markersRef.current.push(startMarker);

    // Add end marker (destination)
    const endMarker = new mapboxgl.Marker({
      color: "#ef4444",
      scale: 1.2,
    })
      .setLngLat(end)
      .addTo(map.current);
    markersRef.current.push(endMarker);

    // Fit map to route bounds
    const routeBounds = new mapboxgl.LngLatBounds();
    routeBounds.extend(start);
    routeBounds.extend(end);

    map.current.fitBounds(routeBounds, {
      padding: 80,
      duration: 1500,
    });
  };

  const addRouteToMap = (geometry: GeoJSON.Geometry, start: [number, number], end: [number, number]) => {
    if (!map.current) return;

    // Remove existing route
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Add route line
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: geometry,
      },
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 6,
        'line-opacity': 0.8,
      },
    });

    // Clear existing markers and add new ones
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add start marker (user location)
    const startMarker = new mapboxgl.Marker({
      color: "#22c55e",
      scale: 1.2,
    })
      .setLngLat(start)
      .addTo(map.current);
    markersRef.current.push(startMarker);

    // Add end marker (destination)
    const endMarker = new mapboxgl.Marker({
      color: "#ef4444",
      scale: 1.2,
    })
      .setLngLat(end)
      .addTo(map.current);
    markersRef.current.push(endMarker);
  };

  const clearRoute = (clearSearchQuery = true) => {
    if (!map.current) return;
    
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    // Clear transit route segments
    ['route-walking', 'route-transit'].forEach(layerId => {
      if (map.current!.getSource(layerId)) {
        map.current!.removeLayer(layerId);
        map.current!.removeSource(layerId);
      }
    });
    
    // Clear numbered route segments
    for (let i = 0; i < 20; i++) {
      const sourceId = `route-segment-${i}`;
      if (map.current!.getSource(sourceId)) {
        map.current!.removeLayer(sourceId);
        map.current!.removeSource(sourceId);
      }
    }
    
    setCurrentRoute(null);
    setDestination(null);
    if (clearSearchQuery) {
      setSearchQuery("");
    }
    setRouteSteps([]);
    setRouteAlternatives([]);
    setExpandedSteps(new Set());
    setShowDirections(false);
    
    // Clear all markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Re-add user location marker
    if (userLocation) {
      const userMarker = new mapboxgl.Marker({
        color: "#3b82f6",
        scale: 1.2,
      })
        .setLngLat(userLocation)
        .addTo(map.current);
      markersRef.current.push(userMarker);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    if (km < 1) {
      return `${Math.round(meters)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-CA', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const toggleStepExpansion = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const renderTransitStep = (step: RouteStep, index: number) => {
    const isExpanded = expandedSteps.has(index);
    
    if (step.transitDetails) {
      const colors = getTTCLineColor(step.transitDetails.line.name);
      
      return (
        <div key={index} className="mb-3">
          <button
            onClick={() => toggleStepExpansion(index)}
            className="w-full text-left hover:bg-gray-800 rounded-lg p-3 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div 
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {getTransitIcon(step.transitDetails.line.vehicle?.type || GoogleTransitMode.BUS)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">
                    {step.transitDetails.line.shortName || step.transitDetails.line.name}
                  </span>
                  <span className="text-gray-400 text-sm">
                    towards {step.transitDetails.headsign}
                  </span>
                </div>
                
                <div className="text-sm text-gray-400 mt-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>{step.transitDetails.departureTime} - {step.transitDetails.arrivalTime}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{step.transitDetails.numStops} stops • {step.duration?.text}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-end mt-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                </div>
              </div>
            </div>
          </button>
          
          {isExpanded && (
            <div className="ml-11 mt-2 p-3 bg-gray-800/50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <div>
                    <div className="text-white font-medium">Board at {step.transitDetails.departureStop}</div>
                    <div className="text-gray-400">{step.transitDetails.departureTime}</div>
                  </div>
                </div>
                
                <div className="border-l-2 border-gray-600 ml-1 pl-6 py-2">
                  <div className="text-gray-400">{step.transitDetails.numStops} stops</div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                  <div>
                    <div className="text-white font-medium">Exit at {step.transitDetails.arrivalStop}</div>
                    <div className="text-gray-400">{step.transitDetails.arrivalTime}</div>
                  </div>
                </div>
                
                {step.transitDetails.line.agencies?.[0] && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-gray-400 text-xs">
                      Operated by {step.transitDetails.line.agencies[0].name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Walking steps
    return (
      <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
        <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
          <PersonStanding className="h-4 w-4 text-gray-300" />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm">{step.instructions}</p>
          <p className="text-gray-400 text-xs mt-1">
            {step.distance?.text} • {step.duration?.text}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full">
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

      {/* Search bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-80 z-20">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700">
          <div className="relative search-container">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search destinations"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
              className="w-full pl-10 pr-10 py-3 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-400"></div>
              </div>
            )}
            {currentRoute && (
              <Button 
                onClick={() => clearRoute()}
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-full w-8 h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden" style={{ zIndex: 9999 }}>
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.mapbox_id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-b-0 flex items-center space-x-3"
                  >
                    <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {suggestion.name}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {suggestion.place_formatted}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-gray-900/95 backdrop-blur-sm shadow-xl text-white hover:bg-gray-800 rounded-full w-10 h-10 border border-gray-700"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="bg-gray-900/95 backdrop-blur-sm shadow-xl text-white hover:bg-gray-800 rounded-full w-10 h-10 border border-gray-700"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>

      {/* Transport Mode Selection */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 p-2">
          <div className="flex flex-col space-y-2">
            <Button
              variant={selectedTransportMode === TransportMode.DRIVING ? "default" : "ghost"}
              size="icon"
              onClick={() => setSelectedTransportMode(TransportMode.DRIVING)}
              className="w-10 h-10 rounded-lg"
            >
              <Car className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTransportMode === TransportMode.WALKING ? "default" : "ghost"}
              size="icon"
              onClick={() => setSelectedTransportMode(TransportMode.WALKING)}
              className="w-10 h-10 rounded-lg"
            >
              <PersonStanding className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTransportMode === TransportMode.CYCLING ? "default" : "ghost"}
              size="icon"
              onClick={() => setSelectedTransportMode(TransportMode.CYCLING)}
              className="w-10 h-10 rounded-lg"
            >
              <Bike className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTransportMode === TransportMode.TRANSIT ? "default" : "ghost"}
              size="icon"
              onClick={() => setSelectedTransportMode(TransportMode.TRANSIT)}
              className="w-10 h-10 rounded-lg"
            >
              <Train className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Route info component */}
      {currentRoute && (
        <>
          {/* Overlay when expanded */}
          {showDirections && (
            <div className="absolute inset-0 bg-black/30 z-30" onClick={() => setShowDirections(false)} />
          )}
          
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 ${showDirections ? 'w-96' : 'w-80'} z-40 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 transition-all duration-300 ${showDirections ? 'max-h-[70vh]' : 'max-h-32'} overflow-hidden`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    {currentRoute.mode === TransportMode.DRIVING && <Car className="h-4 w-4 text-blue-400" />}
                    {currentRoute.mode === TransportMode.WALKING && <PersonStanding className="h-4 w-4 text-green-400" />}
                    {currentRoute.mode === TransportMode.CYCLING && <Bike className="h-4 w-4 text-orange-400" />}
                    {currentRoute.mode === TransportMode.TRANSIT && <Train className="h-4 w-4 text-purple-400" />}
                    <span className="text-white font-medium">{formatDuration(currentRoute.duration)}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-600"></div>
                  <div className="flex items-center space-x-1">
                    <Navigation className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium">{formatDistance(currentRoute.distance)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowDirections(!showDirections)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    {showDirections ? 'Hide' : 'Details'}
                  </Button>
                  <Button
                    onClick={() => clearRoute()}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-8 h-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Transit-specific info */}
              {currentRoute.mode === TransportMode.TRANSIT && currentRoute.departureTime && currentRoute.arrivalTime && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Depart</span>
                      <span className="text-white font-medium">{formatTime(currentRoute.departureTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Arrive</span>
                      <span className="text-white font-medium">{formatTime(currentRoute.arrivalTime)}</span>
                    </div>
                  </div>
                  
                  {currentRoute.fare && (
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="text-white">{currentRoute.fare.text}</span>
                      <span className="text-gray-400">• Presto fare</span>
                    </div>
                  )}
                  
                  {/* Route alternatives for transit */}
                  {routeAlternatives.length > 1 && (
                    <div className="flex items-center space-x-2 pt-2">
                      <span className="text-gray-400 text-sm">Routes:</span>
                      <div className="flex space-x-1">
                        {routeAlternatives.slice(0, 3).map((_, index) => (
                          <Button
                            key={index}
                            variant={selectedRouteIndex === index ? "default" : "ghost"}
                            size="sm"
                            onClick={() => {
                              setSelectedRouteIndex(index);
                              const route = routeAlternatives[index];
                              const leg = route.legs[0];
                              setCurrentRoute({
                                duration: leg.duration.value,
                                distance: leg.distance.value,
                                polyline: route.overview_polyline.points,
                                mode: TransportMode.TRANSIT,
                                googleRoute: route,
                                departureTime: leg.departure_time ? new Date(leg.departure_time.value * 1000) : undefined,
                                arrivalTime: leg.arrival_time ? new Date(leg.arrival_time.value * 1000) : undefined,
                                fare: route.fare,
                                warnings: route.warnings,
                              });
                              setRouteSteps(leg.steps);
                              if (userLocation && destination) {
                                addGoogleRouteToMap(route, userLocation, destination, TransportMode.TRANSIT);
                              }
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Warnings */}
              {currentRoute.warnings && currentRoute.warnings.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-200">
                      {currentRoute.warnings.join(' ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Expandable directions */}
            {showDirections && (
              <div className="p-4 overflow-y-auto max-h-96 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                {currentRoute.mode === TransportMode.TRANSIT ? (
                  <div className="space-y-3">
                    {routeSteps.map((step, index) => renderTransitStep(step, index))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {routeSteps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{step.instructions}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {step.distance?.text} • {step.duration?.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-15"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="absolute left-0 top-0 bottom-0 z-20 w-64">
          <div className="h-full bg-gray-900/95 backdrop-blur-sm shadow-xl border-r border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full w-8 h-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
              >
                <MapPin className="h-4 w-4 mr-3" />
                Plan Route
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
              >
                <Compass className="h-4 w-4 mr-3" />
                Find Nearby
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
              >
                <Layers className="h-4 w-4 mr-3" />
                Map Layers
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
              >
                <User className="h-4 w-4 mr-3" />
                Find Buddy
              </Button>

              {/* Divider */}
              <div className="border-t border-gray-700 my-4"></div>
              
              {/* Transit preferences (when transit is selected) */}
              {selectedTransportMode === TransportMode.TRANSIT && (
                <>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs uppercase tracking-wide px-3 mb-2">Transit Preferences</p>
                    
                    <Button
                      variant={transitPreferences.routePreference === 'best_route' ? 'default' : 'ghost'}
                      onClick={() => setTransitPreferences({...transitPreferences, routePreference: 'best_route'})}
                      className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto text-sm"
                    >
                      <Compass className="h-4 w-4 mr-3" />
                      Best Route
                    </Button>
                    
                    <Button
                      variant={transitPreferences.routePreference === 'fewer_transfers' ? 'default' : 'ghost'}
                      onClick={() => setTransitPreferences({...transitPreferences, routePreference: 'fewer_transfers'})}
                      className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto text-sm"
                    >
                      <AlertCircle className="h-4 w-4 mr-3" />
                      Fewer Transfers
                    </Button>
                    
                    <Button
                      variant={transitPreferences.routePreference === 'less_walking' ? 'default' : 'ghost'}
                      onClick={() => setTransitPreferences({...transitPreferences, routePreference: 'less_walking'})}
                      className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto text-sm"
                    >
                      <PersonStanding className="h-4 w-4 mr-3" />
                      Less Walking
                    </Button>
                  </div>
                  
                  <div className="border-t border-gray-700 my-4"></div>
                </>
              )}
              
              {/* Quick POI Categories */}
              <div className="space-y-1">
                <p className="text-gray-400 text-xs uppercase tracking-wide px-3 mb-2">Quick Search</p>
                
                <Button
                  variant="ghost"
                  onClick={() => handleSearchInput("coffee near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">☕</span>
                  Coffee Shops
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleSearchInput("restaurant near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">🍽️</span>
                  Restaurants
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleSearchInput("gas station near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">⛽</span>
                  Gas Stations
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleSearchInput("hospital near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">🏥</span>
                  Hospitals
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleSearchInput("pharmacy near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">💊</span>
                  Pharmacies
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleSearchInput("bank near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">🏦</span>
                  Banks
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}