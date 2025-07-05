"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, Search, Settings, User, Menu, X, Layers, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
export function MapContainer() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    useEffect(() => {
        if (!mapContainer.current)
            return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        // Get user location
        navigator.geolocation.getCurrentPosition((position) => {
            const { longitude, latitude } = position.coords;
            setUserLocation([longitude, latitude]);
            // Initialize map with user location
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
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
                var _a;
                if (!map.current)
                    return;
                const layers = map.current.getStyle().layers;
                const labelLayerId = (_a = layers.find((layer) => { var _a; return layer.type === "symbol" && ((_a = layer.layout) === null || _a === void 0 ? void 0 : _a["text-field"]); })) === null || _a === void 0 ? void 0 : _a.id;
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
        }, (error) => {
            console.error("Error getting location:", error);
            // Fallback to Toronto if geolocation fails
            const torontoCoords = [-79.3832, 43.6532];
            setUserLocation(torontoCoords);
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/dark-v11",
                center: torontoCoords,
                zoom: 12,
                pitch: 45,
                bearing: 0,
                antialias: true,
            });
            map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
            setIsLoading(false);
        });
        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, []);
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || !map.current)
            return;
        // Use Mapbox Geocoding API to search for locations
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`)
            .then(response => response.json())
            .then(data => {
            var _a;
            if (data.features && data.features.length > 0) {
                const [longitude, latitude] = data.features[0].center;
                (_a = map.current) === null || _a === void 0 ? void 0 : _a.flyTo({
                    center: [longitude, latitude],
                    zoom: 15,
                    duration: 2000,
                });
                // Add marker for searched location
                new mapboxgl.Marker({
                    color: "#ef4444",
                    scale: 1.0,
                })
                    .setLngLat([longitude, latitude])
                    .addTo(map.current);
            }
        })
            .catch(error => {
            console.error("Search error:", error);
        });
    };
    return (<div className="relative h-full w-full">
      {/* Loading overlay */}
      {isLoading && (<div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading map...</p>
          </div>
        </div>)}

      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full"/>

      {/* Top navigation bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <Card className="bg-gray-900/90 backdrop-blur-sm border-gray-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-gray-800">
                <Menu className="h-5 w-5"/>
              </Button>
              <div className="flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-blue-400"/>
                <h1 className="text-xl font-bold text-white">Pathly</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <Settings className="h-5 w-5"/>
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <User className="h-5 w-5"/>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Search bar */}
      <div className="absolute top-20 left-4 right-4 z-10 mt-4">
        <Card className="bg-gray-900/90 backdrop-blur-sm border-gray-700">
          <form onSubmit={handleSearch} className="p-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <Input type="text" placeholder="Search locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"/>
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Navigation className="h-4 w-4"/>
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (<div className="absolute left-0 top-0 bottom-0 z-20 w-80">
          <Card className="h-full bg-gray-900/95 backdrop-blur-sm border-gray-700 rounded-none">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Navigation</h2>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-white hover:bg-gray-800">
                  <X className="h-5 w-5"/>
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                <MapPin className="h-4 w-4 mr-2"/>
                Plan Route
              </Button>
              
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                <Compass className="h-4 w-4 mr-2"/>
                Find Nearby
              </Button>
              
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                <Layers className="h-4 w-4 mr-2"/>
                Map Layers
              </Button>
              
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                <User className="h-4 w-4 mr-2"/>
                Find Buddy
              </Button>
            </div>
          </Card>
        </div>)}

      {/* Quick action buttons */}
      <div className="absolute bottom-4 right-4 z-10 space-y-2">
        <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
          <Navigation className="h-5 w-5"/>
        </Button>
        <Button size="icon" className="bg-green-600 hover:bg-green-700 shadow-lg">
          <MapPin className="h-5 w-5"/>
        </Button>
      </div>
    </div>);
}
