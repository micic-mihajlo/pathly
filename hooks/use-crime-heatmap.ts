import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

export function useCrimeHeatmap(map: mapboxgl.Map | null) {
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [heatmapLoaded, setHeatmapLoaded] = useState(false);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const heatmapIntensity = useRef(0.6);

  useEffect(() => {
    if (!map) {
      console.log('No map available yet');
      return;
    }

    // Follow Mapbox tutorial pattern - wait for map load event
    const handleMapLoad = async () => {
      try {
        console.log('Loading optimized crime heatmap data...');
        
        // Load optimized crime data (3.7MB vs 14.8MB)
        const response = await fetch('/data/crime_data_optimized.geojson');
        
        if (!response.ok) {
          throw new Error(`Failed to load crime data: ${response.status}`);
        }
        
        const crimeData = await response.json();
        
        if (!crimeData.features || crimeData.features.length === 0) {
          throw new Error('No crime data features found');
        }
        
        console.log(`Loaded ${crimeData.features.length} crime data points`);

        // Add source
        map.addSource('crime-data', {
          type: 'geojson',
          data: crimeData
        });

        // Add heatmap layer that stays visible at all zoom levels
        map.addLayer({
          id: 'crime-heatmap',
          type: 'heatmap',
          source: 'crime-data',
          paint: {
            // Weight based on crime severity
            'heatmap-weight': [
              'case',
              ['==', ['get', 'MCI_CATEGORY'], 'Robbery'], 1.0,
              ['==', ['get', 'MCI_CATEGORY'], 'Assault'], 0.8,
              ['==', ['get', 'MCI_CATEGORY'], 'Break and Enter'], 0.7,
              ['==', ['get', 'MCI_CATEGORY'], 'Auto Theft'], 0.6,
              ['==', ['get', 'MCI_CATEGORY'], 'Theft Over'], 0.5,
              0.3
            ],
            
            // Intensity increases with zoom to maintain visibility
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 1,
              15, 2,
              20, 3
            ],
            
            // Color gradient
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.2, 'rgba(255, 255, 0, 0.1)',
              0.4, 'rgba(255, 165, 0, 0.2)',
              0.6, 'rgba(255, 69, 0, 0.3)',
              0.8, 'rgba(255, 0, 0, 0.4)',
              1, 'rgba(139, 0, 0, 0.5)'
            ],
            
            // Radius scales with zoom to maintain smooth appearance
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 10,
              15, 15,
              20, 25
            ],
            
            // Keep heatmap visible at all zoom levels
            'heatmap-opacity': heatmapIntensity.current
          }
        }, 'waterway-label');

        // Optional: Add very subtle circle layer for extreme zoom levels (18+)
        map.addLayer({
          id: 'crime-points',
          type: 'circle',
          source: 'crime-data',
          minzoom: 18,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              18, 2,
              22, 4
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'MCI_CATEGORY'], 'Robbery'], '#ff4757',
              ['==', ['get', 'MCI_CATEGORY'], 'Assault'], '#ff6b6b',
              ['==', ['get', 'MCI_CATEGORY'], 'Break and Enter'], '#ff7043',
              ['==', ['get', 'MCI_CATEGORY'], 'Auto Theft'], '#ffa726',
              ['==', ['get', 'MCI_CATEGORY'], 'Theft Over'], '#ffab40',
              '#ffcc02'
            ],
            'circle-stroke-color': 'white',
            'circle-stroke-width': 0.5,
            'circle-opacity': 0.3
          }
        }, 'waterway-label');

        // Add popup for crime points
        map.on('click', 'crime-points', (e) => {
          const feature = e.features?.[0];
          if (feature && feature.geometry.type === 'Point') {
            const coordinates = feature.geometry.coordinates.slice();
            const properties = feature.properties;
            
            if (coordinates && properties) {
              new mapboxgl.Popup()
                .setLngLat(coordinates as [number, number])
                .setHTML(`
                  <div class="p-3 max-w-sm">
                    <h3 class="font-semibold text-sm mb-2">${properties.OFFENCE}</h3>
                    <p class="text-xs text-gray-600 mb-1"><strong>Date:</strong> ${new Date(properties.OCC_DATE).toLocaleDateString()}</p>
                    <p class="text-xs text-gray-600 mb-1"><strong>Time:</strong> ${properties.OCC_HOUR}:00</p>
                    <p class="text-xs text-gray-600 mb-1"><strong>Location:</strong> ${properties.LOCATION_TYPE}</p>
                    <p class="text-xs text-gray-600"><strong>Area:</strong> ${properties.NEIGHBOURHOOD_158}</p>
                  </div>
                `)
                .addTo(map);
            }
          }
        });

        // Change cursor on hover
        map.on('mouseenter', 'crime-points', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'crime-points', () => {
          map.getCanvas().style.cursor = '';
        });

        console.log('Crime heatmap layers added successfully');
        setHeatmapLoaded(true);
        
      } catch (error) {
        console.error('Error loading crime data:', error);
        setHeatmapError(error instanceof Error ? error.message : 'Failed to load crime data');
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

  // Toggle heatmap visibility
  useEffect(() => {
    if (!map || !heatmapLoaded) return;

    const visibility = heatmapVisible ? 'visible' : 'none';
    
    if (map.getLayer('crime-heatmap')) {
      map.setLayoutProperty('crime-heatmap', 'visibility', visibility);
    }
    if (map.getLayer('crime-points')) {
      map.setLayoutProperty('crime-points', 'visibility', visibility);
    }
  }, [map, heatmapVisible, heatmapLoaded]);

  const toggleHeatmap = () => setHeatmapVisible(!heatmapVisible);

  const setHeatmapIntensity = (intensity: number) => {
    heatmapIntensity.current = intensity;
    if (map && heatmapLoaded && map.getLayer('crime-heatmap')) {
      map.setPaintProperty('crime-heatmap', 'heatmap-opacity', intensity);
    }
  };

  return {
    heatmapVisible,
    heatmapLoaded,
    heatmapError,
    toggleHeatmap,
    setHeatmapIntensity
  };
} 