import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

export function useCrimeHexGrid(map: mapboxgl.Map | null) {
  const [hexGridVisible, setHexGridVisible] = useState(true);
  const [hexGridLoaded, setHexGridLoaded] = useState(false);
  const [hexGridError, setHexGridError] = useState<string | null>(null);
  const hexGridOpacity = useRef(0.7);

  useEffect(() => {
    if (!map) {
      console.log('No map available yet');
      return;
    }

    const handleMapLoad = async () => {
      try {
        console.log('Loading hexagonal crime grid...');
        
        // Load hex grid data
        const response = await fetch('/data/crime_hex_grid.geojson');
        
        if (!response.ok) {
          throw new Error(`Failed to load hex grid data: ${response.status}`);
        }
        
        const hexGridData = await response.json();
        
        if (!hexGridData.features || hexGridData.features.length === 0) {
          throw new Error('No hex grid features found');
        }
        
        console.log(`Loaded ${hexGridData.features.length} hexagons`);

        // Add source
        map.addSource('crime-hex-grid', {
          type: 'geojson',
          data: hexGridData
        });

        // Add hexagon fill layer
        map.addLayer({
          id: 'crime-hex-fill',
          type: 'fill',
          source: 'crime-hex-grid',
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'risk_level'], 'low'], '#22c55e',      // Green
              ['==', ['get', 'risk_level'], 'medium'], '#f59e0b',   // Orange  
              ['==', ['get', 'risk_level'], 'high'], '#ef4444',     // Red
              ['==', ['get', 'risk_level'], 'very_high'], '#991b1b', // Dark red
              '#6b7280' // Default gray
            ],
            'fill-opacity': hexGridOpacity.current
          }
        }, 'waterway-label');

        // Add hexagon border layer for definition
        map.addLayer({
          id: 'crime-hex-stroke',
          type: 'line',
          source: 'crime-hex-grid',
          paint: {
            'line-color': '#ffffff',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 0.3,
              15, 0.8,
              20, 1.2
            ],
            'line-opacity': 0.4
          }
        }, 'waterway-label');

        // Add popup for hex details
        map.on('click', 'crime-hex-fill', (e) => {
          const feature = e.features?.[0];
          if (feature) {
            const properties = feature.properties;
            
            if (properties) {
                             const riskLevelLabels: Record<string, string> = {
                 'low': 'Low Risk',
                 'medium': 'Medium Risk', 
                 'high': 'High Risk',
                 'very_high': 'Very High Risk'
               };

               const riskLevel = properties.risk_level as string;

               new mapboxgl.Popup()
                 .setLngLat(e.lngLat)
                 .setHTML(`
                   <div class="p-3 max-w-sm">
                     <h3 class="font-semibold text-sm mb-2">Safety Zone</h3>
                     <div class="space-y-1">
                       <p class="text-xs"><strong>Risk Level:</strong> 
                         <span class="px-2 py-1 rounded text-xs font-medium ml-1
                           ${riskLevel === 'low' ? 'bg-green-100 text-green-800' : 
                             riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                             riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                             'bg-red-200 text-red-900'}">
                           ${riskLevelLabels[riskLevel] || 'Unknown'}
                         </span>
                       </p>
                      <p class="text-xs text-gray-600"><strong>Total Crimes:</strong> ${properties.crime_count}</p>
                      <p class="text-xs text-gray-600"><strong>High Severity:</strong> ${properties.high_severity_count}</p>
                      ${properties.dominant_crime ? `<p class="text-xs text-gray-600"><strong>Most Common:</strong> ${properties.dominant_crime}</p>` : ''}
                    </div>
                                         <div class="mt-2 pt-2 border-t border-gray-200">
                       <p class="text-xs text-gray-500">
                         ${riskLevel === 'low' ? '✅ Generally safe area' :
                           riskLevel === 'medium' ? '⚠️ Exercise normal caution' :
                           riskLevel === 'high' ? '🚨 Consider public transit' :
                           '🔴 Strongly recommend public transit'}
                       </p>
                     </div>
                  </div>
                `)
                .addTo(map);
            }
          }
        });

        // Change cursor on hover
        map.on('mouseenter', 'crime-hex-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'crime-hex-fill', () => {
          map.getCanvas().style.cursor = '';
        });

        console.log('Crime hex grid layers added successfully');
        setHexGridLoaded(true);
        
      } catch (error) {
        console.error('Error loading hex grid data:', error);
        setHexGridError(error instanceof Error ? error.message : 'Failed to load hex grid data');
      }
    };

    // Wait for map to be fully loaded before adding layers
    if (map.isStyleLoaded()) {
      handleMapLoad();
    } else {
      map.on('load', handleMapLoad);
    }

    // Cleanup function
    return () => {
      if (map.isStyleLoaded()) {
        map.off('load', handleMapLoad);
      }
    };
  }, [map]);

  // Toggle hex grid visibility
  useEffect(() => {
    if (!map || !hexGridLoaded) return;

    const visibility = hexGridVisible ? 'visible' : 'none';
    
    if (map.getLayer('crime-hex-fill')) {
      map.setLayoutProperty('crime-hex-fill', 'visibility', visibility);
    }
    if (map.getLayer('crime-hex-stroke')) {
      map.setLayoutProperty('crime-hex-stroke', 'visibility', visibility);
    }
  }, [map, hexGridVisible, hexGridLoaded]);

  const toggleHexGrid = () => setHexGridVisible(!hexGridVisible);

  const setHexGridOpacity = (opacity: number) => {
    hexGridOpacity.current = opacity;
    if (map && hexGridLoaded && map.getLayer('crime-hex-fill')) {
      map.setPaintProperty('crime-hex-fill', 'fill-opacity', opacity);
    }
  };

  return {
    hexGridVisible,
    hexGridLoaded,
    hexGridError,
    toggleHexGrid,
    setHexGridOpacity
  };
} 