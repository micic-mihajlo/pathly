"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  MapPin, 
  Navigation, 
  Search, 
  Settings, 
  User, 
  Menu,
  X,
  Layers,
  Compass,
  Clock,
  Route,
  Car,
  MapPinIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

// Toronto/GTA coordinates and bounds for Canadian search focus
const TORONTO_COORDS: [number, number] = [-79.3832, 43.6532]; // CN Tower
const GTA_BOUNDS = "-79.6392,43.5890,-79.1168,43.8554"; // Greater Toronto Area

interface SearchSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
}

interface RouteInfo {
  duration: number;
  distance: number;
  geometry: any;
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
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

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
        new mapboxgl.Marker({
          color: "#3b82f6",
          scale: 1.2,
        })
          .setLngLat([longitude, latitude])
          .addTo(map.current);

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
          zoom: 13, // Slightly closer zoom for Toronto
          pitch: 45,
          bearing: 0,
          antialias: true,
        });

        // Add user location marker for Toronto fallback
        new mapboxgl.Marker({
          color: "#3b82f6",
          scale: 1.2,
        })
          .setLngLat(TORONTO_COORDS)
          .addTo(map.current);

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

  // Real-time search with debouncing
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
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

  const fetchSearchSuggestions = async (query: string) => {
    try {
      // Bias search towards Toronto/GTA area and Canada
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `limit=5&` +
        `types=poi,address,place&` +
        `country=CA&` +
        `proximity=${TORONTO_COORDS[0]},${TORONTO_COORDS[1]}&` + // Toronto coordinates for proximity bias
        `bbox=${GTA_BOUNDS}` // Bounding box for Greater Toronto Area
      );
      const data = await response.json();
      
      if (data.features) {
        setSearchSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.place_name);
    setShowSuggestions(false);
    setDestination(suggestion.center);
    
    if (userLocation) {
      getRoute(userLocation, suggestion.center);
    }
  };

  const getRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setCurrentRoute({
          duration: route.duration,
          distance: route.distance,
          geometry: route.geometry,
        });
        
        // Store step-by-step directions
        setRouteSteps(route.legs[0].steps || []);
        
        // Add route to map
        addRouteToMap(route.geometry, start, end);
        
        // Fit map to route bounds
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        map.current?.fitBounds(bounds, {
          padding: 50,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Route error:", error);
    }
  };

  const addRouteToMap = (geometry: any, start: [number, number], end: [number, number]) => {
    if (!map.current) return;

    // Remove existing route and markers
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
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add start marker (user location)
    new mapboxgl.Marker({
      color: "#22c55e",
      scale: 1.2,
    })
      .setLngLat(start)
      .addTo(map.current);

    // Add end marker (destination)
    new mapboxgl.Marker({
      color: "#ef4444",
      scale: 1.2,
    })
      .setLngLat(end)
      .addTo(map.current);
  };

  const clearRoute = () => {
    if (!map.current) return;
    
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    setCurrentRoute(null);
    setDestination(null);
    setSearchQuery("");
    
    // Clear markers except user location
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());
    
    if (userLocation) {
      new mapboxgl.Marker({
        color: "#3b82f6",
        scale: 1.2,
      })
        .setLngLat(userLocation)
        .addTo(map.current);
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
                onClick={clearRoute}
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
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-b-0 flex items-center space-x-3"
                  >
                    <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {suggestion.place_name.split(',')[0]}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {suggestion.place_name.split(',').slice(1).join(',')}
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

      {/* Single expandable route info */}
      {currentRoute && (
        <>
          {/* Overlay when expanded */}
          {showDirections && (
            <div className="absolute inset-0 bg-black/30 z-30" onClick={() => setShowDirections(false)} />
          )}
          
          {/* Route info component */}
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 w-80 z-40 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 transition-all duration-300 ${showDirections ? 'max-h-[60vh]' : 'max-h-20'} overflow-hidden`}>
            {/* Compact header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-green-400" />
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
                    {showDirections ? 'Hide' : 'Directions'}
                  </Button>
                  <Button
                    onClick={clearRoute}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-8 h-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Expandable directions */}
            {showDirections && (
              <div className="p-4">
                {routeSteps.length > 0 ? (
                  <>
                    {/* First 5 steps - no scroll */}
                    <div className="space-y-3 mb-4">
                      {routeSteps.slice(0, 5).map((step, index) => (
                        <div key={index} className="flex space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm">{step.maneuver?.instruction || 'Continue'}</p>
                            {step.distance && (
                              <p className="text-gray-400 text-xs mt-1">{formatDistance(step.distance)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Remaining steps - scrollable */}
                    {routeSteps.length > 5 && (
                      <div className="border-t border-gray-700 pt-4">
                        <div className="max-h-32 overflow-y-auto space-y-3">
                          {routeSteps.slice(5).map((step, index) => (
                            <div key={index + 5} className="flex space-x-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {index + 6}
                              </div>
                              <div className="flex-1">
                                <p className="text-white text-sm">{step.maneuver?.instruction || 'Continue'}</p>
                                {step.distance && (
                                  <p className="text-gray-400 text-xs mt-1">{formatDistance(step.distance)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No detailed directions available</p>
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
            </div>
          </div>
        </div>
      )}




    </div>
  );
} 