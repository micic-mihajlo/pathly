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
  AlertTriangle,
  CalendarClock,
  ChevronUp
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
  const [transitTimeMode, setTransitTimeMode] = useState<'leave_now' | 'leave_at' | 'arrive_by'>('leave_now');
  const [transitTargetTime, setTransitTargetTime] = useState<Date>(new Date());
  const [showTimeSelector, setShowTimeSelector] = useState(false);
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
      
      // Prepare time parameters based on transit time mode
      let timeParams: any = {};
      if (transitTimeMode === 'leave_now') {
        timeParams.departureTime = new Date().toISOString();
      } else if (transitTimeMode === 'leave_at') {
        timeParams.departureTime = transitTargetTime.toISOString();
      } else if (transitTimeMode === 'arrive_by') {
        timeParams.arrivalTime = transitTargetTime.toISOString();
      }

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
            ...timeParams,
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
        
        // Convert Google API format to our RouteStep format
        const convertedSteps = leg.steps.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          instructions: step.html_instructions?.replace(/<[^>]*>/g, '') || 'Continue', // Strip HTML tags
          travelMode: step.travel_mode,
          transitDetails: step.transit_details ? {
            arrivalStop: step.transit_details.arrival_stop.name,
            arrivalTime: step.transit_details.arrival_time.text,
            departureStop: step.transit_details.departure_stop.name,
            departureTime: step.transit_details.departure_time.text,
            headsign: step.transit_details.headsign,
            line: {
              name: step.transit_details.line.name,
              shortName: step.transit_details.line.short_name,
              color: step.transit_details.line.color,
              textColor: step.transit_details.line.text_color,
              vehicle: step.transit_details.line.vehicle ? {
                type: step.transit_details.line.vehicle.type,
                name: step.transit_details.line.vehicle.name,
                icon: step.transit_details.line.vehicle.icon,
              } : undefined,
              agencies: step.transit_details.line.agencies,
            },
            numStops: step.transit_details.num_stops,
          } : undefined,
          polyline: step.polyline,
          maneuver: step.maneuver,
        }));
        
        setRouteSteps(convertedSteps);
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

    // also remove any leftover transit layers/segments
    ['route-walking', 'route-transit'].forEach(id => {
      if (map.current!.getSource(id)) {
        map.current!.removeLayer(id);
        map.current!.removeSource(id);
      }
    });
    for (let i = 0; i < 20; i++) {
      const segId = `route-segment-${i}`;
      if (map.current!.getSource(segId)) {
        map.current!.removeLayer(segId);
        map.current!.removeSource(segId);
      }
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

    // NEW: fit map to the full route bounds with a smooth animation
    const bounds = new mapboxgl.LngLatBounds();
    // include all geometry coords for accurate fit
    if (geometry.type === 'LineString') {
      (geometry.coordinates as number[][]).forEach(coord => bounds.extend(coord as [number, number]));
    } else if (geometry.type === 'MultiLineString') {
      (geometry.coordinates as number[][][]).forEach(line => {
        line.forEach(coord => bounds.extend(coord as [number, number]));
      });
    }
    // ensure start & end are included (in case geometry missing them)
    bounds.extend(start);
    bounds.extend(end);

    map.current.fitBounds(bounds, {
      padding: 80,
      duration: 1500,
    });
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
    setShowTimeSelector(false); // Hide time selector when clearing route
    
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
      const vehicleIcon = getTransitIcon(step.transitDetails.line.vehicle?.type || GoogleTransitMode.BUS);
      
      return (
        <div key={index} className="relative">
          {/* Connection line to previous step */}
          {index > 0 && (
            <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-600"></div>
          )}
          
          <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
            <button
              onClick={() => toggleStepExpansion(index)}
              className="w-full text-left hover:bg-gray-700/30 transition-colors p-4"
            >
              <div className="flex items-center space-x-4">
                {/* Vehicle icon with line color */}
                <div 
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {vehicleIcon}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Line name and direction */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-white text-base">
                      {step.transitDetails.line.shortName || step.transitDetails.line.name}
                    </span>
                    <span className="text-gray-400 text-sm">→</span>
                    <span className="text-gray-300 text-sm font-medium truncate">
                      {step.transitDetails.headsign}
                    </span>
                  </div>
                  
                  {/* Time and stops info */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-medium">
                        {step.transitDetails.departureTime}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-white font-medium">
                        {step.transitDetails.arrivalTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        {step.transitDetails.numStops} stops
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-gray-300 font-medium">
                        {step.duration?.text}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Expand/collapse indicator */}
                <div className="flex-shrink-0">
                  {isExpanded ? 
                    <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  }
                </div>
              </div>
            </button>
            
            {/* Expanded details */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-700/50">
                <div className="ml-16 space-y-4">
                  {/* Journey timeline */}
                  <div className="relative">
                    {/* Departure */}
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mt-2 shadow-lg"></div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          Board at {step.transitDetails.departureStop}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          Platform • {step.transitDetails.departureTime}
                        </div>
                      </div>
                    </div>
                    
                    {/* Journey line */}
                    <div className="absolute left-1.5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500 to-red-500"></div>
                    
                    {/* Journey info */}
                    <div className="flex items-center space-x-3 mb-4 ml-6">
                      <div className="flex-1 py-3 px-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {step.transitDetails.line.shortName?.substring(0, 2) || 
                               step.transitDetails.line.name.substring(0, 2)}
                            </div>
                            <span className="text-gray-300 text-sm">
                              {step.transitDetails.numStops} stops
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm font-medium">
                              {step.duration?.text}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {step.distance?.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrival */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-3 h-3 bg-red-500 rounded-full mt-2 shadow-lg"></div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          Exit at {step.transitDetails.arrivalStop}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          Platform • {step.transitDetails.arrivalTime}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional transit info */}
                  {step.transitDetails.line.agencies?.[0] && (
                    <div className="mt-4 pt-3 border-t border-gray-700/50">
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-400">
                          Operated by {step.transitDetails.line.agencies[0].name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Walking/Transfer steps - redesigned to show connection
    const isWalkingStep = step.travelMode === 'WALKING';
    
    return (
      <div key={index} className="relative">
        {/* Connection line */}
        {index > 0 && (
          <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-600"></div>
        )}
        
        <div className="flex items-start space-x-4 p-4 bg-gray-800/20 rounded-xl border border-gray-700/30">
          {/* Walking icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <PersonStanding className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Instruction */}
            <div className="text-white font-medium text-sm mb-1">
              {step.instructions || 'Walk to next stop'}
            </div>
            
            {/* Duration and distance */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">{step.duration?.text || '2 min'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Navigation className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">{step.distance?.text || '150m'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Connection line to next step */}
        {index < routeSteps.length - 1 && (
          <div className="absolute left-6 bottom-0 w-0.5 h-3 bg-gray-600"></div>
        )}
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
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/50 p-2">
          <div className="flex flex-col space-y-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTransportMode(TransportMode.DRIVING)}
              className={`w-10 h-10 rounded-lg border border-gray-600/50 transition-all duration-200 ${
                selectedTransportMode === TransportMode.DRIVING
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500'
              }`}
            >
              <Car className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTransportMode(TransportMode.WALKING)}
              className={`w-10 h-10 rounded-lg border border-gray-600/50 transition-all duration-200 ${
                selectedTransportMode === TransportMode.WALKING
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500'
              }`}
            >
              <PersonStanding className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTransportMode(TransportMode.CYCLING)}
              className={`w-10 h-10 rounded-lg border border-gray-600/50 transition-all duration-200 ${
                selectedTransportMode === TransportMode.CYCLING
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500'
              }`}
            >
              <Bike className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTransportMode(TransportMode.TRANSIT)}
              className={`w-10 h-10 rounded-lg border border-gray-600/50 transition-all duration-200 relative overflow-hidden ${
                selectedTransportMode === TransportMode.TRANSIT
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500'
              }`}
            >
              {selectedTransportMode === TransportMode.TRANSIT && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
              )}
              <Train className="h-4 w-4 z-10" />
            </Button>
          </div>
        </div>
      </div>

      {/* Transit Time Selector - show when transit mode is selected */}
      {selectedTransportMode === TransportMode.TRANSIT && (
        <div className="absolute bottom-4 right-20 z-20 transition-all duration-300 ease-out">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden transition-all duration-300">
            {!showTimeSelector ? (
              <Button
                onClick={() => setShowTimeSelector(true)}
                variant="ghost"
                className="flex items-center space-x-2 px-4 py-3 text-white hover:bg-gray-700 relative overflow-hidden group border border-gray-600/50 hover:border-gray-500"
              >
                {transitTimeMode === 'leave_now' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-pulse" />
                )}
                <CalendarClock className="h-4 w-4 z-10 text-blue-400" />
                <span className="text-sm font-semibold z-10 text-gray-100">
                  {transitTimeMode === 'leave_now' ? 'Leave now' :
                   transitTimeMode === 'leave_at' ? `Leave at ${formatTime(transitTargetTime)}` :
                   `Arrive by ${formatTime(transitTargetTime)}`}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 z-10 transition-transform group-hover:translate-y-0.5 text-gray-300" />
              </Button>
            ) : (
                             <div className="p-4 space-y-3 w-64">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="text-gray-100 font-semibold text-sm">Schedule Trip</h3>
                   <Button
                     onClick={() => setShowTimeSelector(false)}
                     variant="ghost"
                     size="icon"
                     className="h-6 w-6 text-gray-300 hover:text-white hover:bg-gray-700"
                   >
                     <X className="h-3 w-3" />
                   </Button>
                 </div>
                 
                 {/* Time mode selection */}
                 <div className="space-y-1">
                   <Button
                     variant={transitTimeMode === 'leave_now' ? "default" : "ghost"}
                     onClick={() => {
                       setTransitTimeMode('leave_now');
                       if (currentRoute && userLocation && destination) {
                         getRoute(userLocation, destination, TransportMode.TRANSIT);
                       }
                     }}
                     className={`w-full justify-start text-sm h-9 ${
                       transitTimeMode === 'leave_now' 
                         ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                         : 'text-gray-200 hover:text-white hover:bg-gray-700'
                     }`}
                   >
                     <Clock className="h-4 w-4 mr-2" />
                     Leave now
                   </Button>
                   
                   <Button
                     variant={transitTimeMode === 'leave_at' ? "default" : "ghost"}
                     onClick={() => setTransitTimeMode('leave_at')}
                     className={`w-full justify-start text-sm h-9 ${
                       transitTimeMode === 'leave_at' 
                         ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                         : 'text-gray-200 hover:text-white hover:bg-gray-700'
                     }`}
                   >
                     <Calendar className="h-4 w-4 mr-2" />
                     Leave at
                   </Button>
                   
                   <Button
                     variant={transitTimeMode === 'arrive_by' ? "default" : "ghost"}
                     onClick={() => setTransitTimeMode('arrive_by')}
                     className={`w-full justify-start text-sm h-9 ${
                       transitTimeMode === 'arrive_by' 
                         ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                         : 'text-gray-200 hover:text-white hover:bg-gray-700'
                     }`}
                   >
                     <MapPin className="h-4 w-4 mr-2" />
                     Arrive by
                   </Button>
                 </div>
                
                {/* Time/Date picker for leave_at and arrive_by */}
                {(transitTimeMode === 'leave_at' || transitTimeMode === 'arrive_by') && (
                  <div className="space-y-2 pt-2 border-t border-gray-700">
                                         {/* Quick time options for leave_at */}
                     {transitTimeMode === 'leave_at' && (
                       <div className="grid grid-cols-3 gap-1 mb-2">
                         <Button
                           variant="ghost"
                           onClick={() => {
                             const newTime = new Date();
                             newTime.setMinutes(newTime.getMinutes() + 15);
                             setTransitTargetTime(newTime);
                           }}
                           className="text-xs h-7 px-2 text-gray-200 hover:text-white hover:bg-gray-700 border border-gray-600/50"
                         >
                           +15 min
                         </Button>
                         <Button
                           variant="ghost"
                           onClick={() => {
                             const newTime = new Date();
                             newTime.setMinutes(newTime.getMinutes() + 30);
                             setTransitTargetTime(newTime);
                           }}
                           className="text-xs h-7 px-2 text-gray-200 hover:text-white hover:bg-gray-700 border border-gray-600/50"
                         >
                           +30 min
                         </Button>
                         <Button
                           variant="ghost"
                           onClick={() => {
                             const newTime = new Date();
                             newTime.setHours(newTime.getHours() + 1);
                             setTransitTargetTime(newTime);
                           }}
                           className="text-xs h-7 px-2 text-gray-200 hover:text-white hover:bg-gray-700 border border-gray-600/50"
                         >
                           +1 hour
                         </Button>
                       </div>
                     )}
                    
                    <input
                      type="time"
                      value={transitTargetTime.toTimeString().slice(0, 5)}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newTime = new Date(transitTargetTime);
                        newTime.setHours(parseInt(hours), parseInt(minutes));
                        setTransitTargetTime(newTime);
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-400 focus:bg-gray-600"
                    />
                    
                    <input
                      type="date"
                      value={transitTargetTime.toISOString().slice(0, 10)}
                      onChange={(e) => {
                        const newTime = new Date(e.target.value + 'T' + transitTargetTime.toTimeString().slice(0, 8));
                        setTransitTargetTime(newTime);
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-400 focus:bg-gray-600"
                    />
                    
                    <Button
                      onClick={() => {
                        setShowTimeSelector(false);
                        if (currentRoute && userLocation && destination) {
                          getRoute(userLocation, destination, TransportMode.TRANSIT);
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 font-semibold"
                    >
                      Update route
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Route info component */}
      {currentRoute && (
        <>
          {/* Overlay when expanded */}
          {showDirections && (
            <div className="absolute inset-0 bg-black/30 z-30" onClick={() => setShowDirections(false)} />
          )}
          
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 ${showDirections ? 'w-[480px]' : 'w-80'} z-40 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 transition-all duration-300 ${showDirections ? 'max-h-[75vh]' : 'max-h-32'} overflow-hidden`}>
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
              
              {/* Transit-specific info - only show when directions are expanded */}
              {showDirections && currentRoute.mode === TransportMode.TRANSIT && currentRoute.departureTime && currentRoute.arrivalTime && (
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
                              // Convert Google API format to our RouteStep format
                              const convertedSteps = leg.steps.map((step: any) => ({
                                distance: step.distance,
                                duration: step.duration,
                                instructions: step.html_instructions?.replace(/<[^>]*>/g, '') || 'Continue',
                                travelMode: step.travel_mode,
                                transitDetails: step.transit_details ? {
                                  arrivalStop: step.transit_details.arrival_stop.name,
                                  arrivalTime: step.transit_details.arrival_time.text,
                                  departureStop: step.transit_details.departure_stop.name,
                                  departureTime: step.transit_details.departure_time.text,
                                  headsign: step.transit_details.headsign,
                                  line: {
                                    name: step.transit_details.line.name,
                                    shortName: step.transit_details.line.short_name,
                                    color: step.transit_details.line.color,
                                    textColor: step.transit_details.line.text_color,
                                    vehicle: step.transit_details.line.vehicle ? {
                                      type: step.transit_details.line.vehicle.type,
                                      name: step.transit_details.line.vehicle.name,
                                      icon: step.transit_details.line.vehicle.icon,
                                    } : undefined,
                                    agencies: step.transit_details.line.agencies,
                                  },
                                  numStops: step.transit_details.num_stops,
                                } : undefined,
                                polyline: step.polyline,
                                maneuver: step.maneuver,
                              }));
                              setRouteSteps(convertedSteps);
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
              
              {/* Warnings - only show when directions are expanded */}
              {showDirections && currentRoute.warnings && currentRoute.warnings.length > 0 && (
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
              <div className="p-6 overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                {currentRoute.mode === TransportMode.TRANSIT ? (
                  <div className="space-y-4">
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