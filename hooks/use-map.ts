import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { TORONTO_COORDS } from "@/utils/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export function useMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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
    };
  }, []);

  return {
    mapContainer,
    map: map.current,
    isLoading,
    userLocation,
    markersRef,
  };
} 