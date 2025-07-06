import { useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Place } from "@/utils/types";

export function usePlaces(
  map: mapboxgl.Map | null,
  userLocation: [number, number] | null
) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const placeMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const searchNearbyPlaces = async (query: string, radius = 2000) => {
    if (!userLocation) return;

    setIsLoadingPlaces(true);
    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: userLocation[1],
          lng: userLocation[0],
          query,
          radius,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Places API error:', data);
        throw new Error(data.error || 'Failed to fetch places');
      }

      setPlaces(data.places || []);
      addPlaceMarkersToMap(data.places || []);
      
    } catch (error) {
      console.error('Error searching places:', error);
      setPlaces([]);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const addPlaceMarkersToMap = (placesToAdd: Place[]) => {
    if (!map) return;

    // Clear existing place markers
    clearPlaceMarkers();

    placesToAdd.forEach((place) => {
      // Create a custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'place-marker';
      markerElement.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: #ef4444;
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: box-shadow 0.2s, filter 0.2s;
        position: relative;
      `;

      // Add icon based on place type
      const placeIcon = getPlaceIcon(place.types);
      markerElement.innerHTML = placeIcon;
      markerElement.title = place.name;

      // Hover effects - use box-shadow and filter instead of transform
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
        markerElement.style.filter = 'brightness(1.1)';
      });
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        markerElement.style.filter = 'brightness(1)';
      });

      // Click handler for routing
      markerElement.addEventListener('click', () => {
        setSelectedPlace(place);
        onPlaceSelect?.(place);
      });

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([place.location.lng, place.location.lat])
        .addTo(map);

      // Add popup on hover
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div style="font-size: 14px; max-width: 200px;">
          <strong>${place.name}</strong><br/>
          <span style="color: #666;">${place.address}</span>
          ${place.rating ? `<br/>⭐ ${place.rating} (${place.userRatingsTotal || 0} reviews)` : ''}
          ${place.openNow !== undefined ? `<br/><span style="color: ${place.openNow ? 'green' : 'red'};">${place.openNow ? 'Open' : 'Closed'}</span>` : ''}
        </div>
      `);

      markerElement.addEventListener('mouseenter', () => {
        popup.addTo(map);
      });
      markerElement.addEventListener('mouseleave', () => {
        popup.remove();
      });

      placeMarkersRef.current.push(marker);
    });
  };

  const clearPlaceMarkers = () => {
    placeMarkersRef.current.forEach(marker => marker.remove());
    placeMarkersRef.current = [];
    setPlaces([]);
    setSelectedPlace(null);
  };

  const getPlaceIcon = (types: string[]): string => {
    // Return emoji icons based on place types
    if (types.includes('cafe') || types.includes('bakery')) return '☕';
    if (types.includes('restaurant') || types.includes('food')) return '🍽️';
    if (types.includes('gas_station')) return '⛽';
    if (types.includes('hospital')) return '🏥';
    if (types.includes('pharmacy')) return '💊';
    if (types.includes('bank') || types.includes('atm')) return '🏦';
    if (types.includes('grocery_or_supermarket') || types.includes('supermarket')) return '🛒';
    if (types.includes('lodging')) return '🏨';
    if (types.includes('gym')) return '💪';
    if (types.includes('parking')) return '🅿️';
    if (types.includes('shopping_mall') || types.includes('store')) return '🛍️';
    if (types.includes('school') || types.includes('university')) return '🎓';
    if (types.includes('library')) return '📚';
    if (types.includes('church') || types.includes('place_of_worship')) return '⛪';
    return '📍'; // Default marker
  };

  // Function to be called when a place is selected (for routing)
  let onPlaceSelect: ((place: Place) => void) | null = null;

  const setOnPlaceSelect = (callback: (place: Place) => void) => {
    onPlaceSelect = callback;
  };

  return {
    places,
    isLoadingPlaces,
    selectedPlace,
    searchNearbyPlaces,
    clearPlaceMarkers,
    setOnPlaceSelect,
    setSelectedPlace,
  };
} 