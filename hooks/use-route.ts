import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { 
  RouteInfo, 
  RouteStep, 
  GoogleRoute, 
  TransportMode, 
  TransitTimeMode, 
  TransitPreferences 
} from "@/utils/types";
import { decodePolyline } from "@/utils/polyline";
import { getRouteSegmentColor } from "@/utils/transit";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export function useRoute(
  map: mapboxgl.Map | null,
  userLocation: [number, number] | null,
  markersRef: React.MutableRefObject<mapboxgl.Marker[]>
) {
  const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [selectedTransportMode, setSelectedTransportMode] = useState<TransportMode>(TransportMode.DRIVING);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [routeAlternatives, setRouteAlternatives] = useState<GoogleRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [transitPreferences, setTransitPreferences] = useState<TransitPreferences>({
    mode: 'best',
    routePreference: 'best_route',
    transitModes: ['bus', 'subway', 'train', 'tram']
  });
  const [transitTimeMode, setTransitTimeMode] = useState<TransitTimeMode>('leave_now');
  const [transitTargetTime, setTransitTargetTime] = useState<Date>(new Date());
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  // Recalculate route when transport mode or transit parameters change
  useEffect(() => {
    if (currentRoute && userLocation && destination) {
      getRoute(userLocation, destination, selectedTransportMode);
    }
  }, [selectedTransportMode, transitTimeMode, transitTargetTime, transitPreferences]);

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
      const timeParams: Record<string, string> = {};
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

      // Get response text first, then try to parse as JSON
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Raw response:', responseText);
        throw new Error(`API returned invalid JSON. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
      }
      
      if (!response.ok) {
        console.error('Response not ok:', data);
        throw new Error(`API error: ${response.status} - ${data.error || 'Unknown error'}`);
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
        const convertedSteps = leg.steps.map((step: Record<string, any>) => ({
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
    if (!map) return;

    // Remove existing route layers
    ['route', 'route-walking', 'route-transit'].forEach(layerId => {
      if (map.getSource(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
      }
    });

    // Remove all numbered route segments from previous routes
    for (let i = 0; i < 50; i++) {
      const sourceId = `route-segment-${i}`;
      if (map.getSource(sourceId)) {
        map.removeLayer(sourceId);
        map.removeSource(sourceId);
      }
    }

    if (mode === TransportMode.TRANSIT) {
      // Add color-coded segments for transit routes
      const leg = route.legs[0];
      leg.steps.forEach((step: RouteStep & { travel_mode?: string }, index) => {
        if (step.polyline?.points) {
          const coordinates = decodePolyline(step.polyline.points);
          const travelMode = step.travel_mode || step.travelMode;
          const isTransit = travelMode === 'TRANSIT';
          const sourceId = `route-segment-${index}`;
          const layerId = `route-segment-${index}`;

          // Get proper color for this segment
          const segmentColor = getRouteSegmentColor(step as any, isTransit);

          map.addSource(sourceId, {
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

          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': segmentColor,
              'line-width': isTransit ? 8 : 5,
              'line-opacity': 0.9,
            },
          });
        }
      });
    } else {
      // Single color for non-transit routes
      const coordinates = decodePolyline(route.overview_polyline.points);
      map.addSource('route', {
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

      // Choose color based on transport mode
      let routeColor = '#3b82f6'; // Default blue
      switch (mode) {
        case TransportMode.DRIVING:
          routeColor = '#3b82f6'; // Blue
          break;
        case TransportMode.WALKING:
          routeColor = '#22c55e'; // Green
          break;
        case TransportMode.CYCLING:
          routeColor = '#f59e0b'; // Orange/amber
          break;
        default:
          routeColor = '#3b82f6';
      }

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': routeColor,
          'line-width': 6,
          'line-opacity': 0.9,
        },
      });
    }

    // Clear existing markers and add new ones
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.splice(0);

    // Add start marker (user location)
    const startMarker = new mapboxgl.Marker({
      color: "#22c55e",
      scale: 1.2,
    })
      .setLngLat(start)
      .addTo(map);
    markersRef.current.push(startMarker);

    // Add end marker (destination)
    const endMarker = new mapboxgl.Marker({
      color: "#ef4444",
      scale: 1.2,
    })
      .setLngLat(end)
      .addTo(map);
    markersRef.current.push(endMarker);

    // Fit map to route bounds
    const routeBounds = new mapboxgl.LngLatBounds();
    routeBounds.extend(start);
    routeBounds.extend(end);

    map.fitBounds(routeBounds, {
      padding: 80,
      duration: 1500,
    });
  };

  const addRouteToMap = (geometry: GeoJSON.Geometry, start: [number, number], end: [number, number]) => {
    if (!map) return;

    // Remove existing route
    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }

    // Also remove any leftover transit layers/segments
    ['route-walking', 'route-transit'].forEach(id => {
      if (map.getSource(id)) {
        map.removeLayer(id);
        map.removeSource(id);
      }
    });
    for (let i = 0; i < 20; i++) {
      const segId = `route-segment-${i}`;
      if (map.getSource(segId)) {
        map.removeLayer(segId);
        map.removeSource(segId);
      }
    }

    // Add route line
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: geometry,
      },
    });

    map.addLayer({
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
    markersRef.current.splice(0);

    // Add start marker (user location)
    const startMarker = new mapboxgl.Marker({
      color: "#22c55e",
      scale: 1.2,
    })
      .setLngLat(start)
      .addTo(map);
    markersRef.current.push(startMarker);

    // Add end marker (destination)
    const endMarker = new mapboxgl.Marker({
      color: "#ef4444",
      scale: 1.2,
    })
      .setLngLat(end)
      .addTo(map);
    markersRef.current.push(endMarker);

    // Fit map to the full route bounds with a smooth animation
    const bounds = new mapboxgl.LngLatBounds();
    if (geometry.type === 'LineString') {
      (geometry.coordinates as number[][]).forEach(coord => bounds.extend(coord as [number, number]));
    } else if (geometry.type === 'MultiLineString') {
      (geometry.coordinates as number[][][]).forEach(line => {
        line.forEach(coord => bounds.extend(coord as [number, number]));
      });
    }
    bounds.extend(start);
    bounds.extend(end);

    map.fitBounds(bounds, {
      padding: 80,
      duration: 1500,
    });
  };

  const clearRoute = () => {
    if (!map) return;
    
    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }
    
    // Clear transit route segments
    ['route-walking', 'route-transit'].forEach(layerId => {
      if (map.getSource(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
      }
    });
    
    // Clear numbered route segments
    for (let i = 0; i < 50; i++) {
      const sourceId = `route-segment-${i}`;
      if (map.getSource(sourceId)) {
        map.removeLayer(sourceId);
        map.removeSource(sourceId);
      }
    }
    
    setCurrentRoute(null);
    setDestination(null);
    setRouteSteps([]);
    setRouteAlternatives([]);
    setExpandedSteps(new Set());
    setShowDirections(false);
    setShowTimeSelector(false);
    
    // Clear all markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.splice(0);
    
    // Re-add user location marker
    if (userLocation) {
      const userMarker = new mapboxgl.Marker({
        color: "#3b82f6",
        scale: 1.2,
      })
        .setLngLat(userLocation)
        .addTo(map);
      markersRef.current.push(userMarker);
    }
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

  const selectRouteAlternative = (index: number) => {
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
    const convertedSteps = leg.steps.map((step: Record<string, any>) => ({
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
  };

  return {
    currentRoute,
    destination,
    showDirections,
    routeSteps,
    selectedTransportMode,
    expandedSteps,
    routeAlternatives,
    selectedRouteIndex,
    transitPreferences,
    transitTimeMode,
    transitTargetTime,
    showTimeSelector,
    setDestination,
    setShowDirections,
    setSelectedTransportMode,
    setTransitPreferences,
    setTransitTimeMode,
    setTransitTargetTime,
    setShowTimeSelector,
    getRoute,
    clearRoute,
    toggleStepExpansion,
    selectRouteAlternative,
  };
} 