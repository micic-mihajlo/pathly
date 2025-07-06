"use client";

import React, { useState } from "react";
import { useMap } from "@/hooks/use-map";
import { useSearch } from "@/hooks/use-search";
import { useRoute } from "@/hooks/use-route";
import { usePlaces } from "@/hooks/use-places";
import { MapView } from "@/components/map/map-view";
import { SearchBar } from "@/components/map/search-bar";
import { TransportToggle } from "@/components/map/transport-toggle";
import { DirectionsPanel } from "@/components/map/directions-panel";
import { Sidebar } from "@/components/map/sidebar";
import { SearchSuggestion, TransportMode, TransitTimeMode, Place } from "@/utils/types";

export function MapContainer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize hooks
  const { mapContainer, map, isLoading, userLocation, markersRef } = useMap();
  const search = useSearch();
  const route = useRoute(map, userLocation, markersRef);
  const places = usePlaces(map, userLocation);

  // Handle search suggestion selection with route calculation
  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    const coordinates = await search.handleSuggestionSelect(suggestion);
    if (coordinates && userLocation) {
      route.setDestination(coordinates);
      route.getRoute(userLocation, coordinates);
    }
  };

  // Handle search input with route clearing
  const handleSearchInput = (value: string) => {
    search.handleSearchInput(value);
    
    // Clear existing route and place markers when starting a new search
    if (value.trim().length >= 2 && route.currentRoute) {
      route.clearRoute();
    }
    // Clear place markers when doing regular search
    if (value.trim().length >= 2) {
      places.clearPlaceMarkers();
    }
  };

  // Handle quick search from sidebar - use places API for "near me" searches
  const handleQuickSearch = (query: string) => {
    if (query.includes('near me')) {
      // Use places API for nearby searches
      places.searchNearbyPlaces(query);
    } else {
      // Use regular text search
      search.handleSearchInput(query);
    }
    setSidebarOpen(false);
  };

  // Set up place selection callback for routing
  React.useEffect(() => {
    places.setOnPlaceSelect((place: Place) => {
      if (userLocation) {
        // Clear any existing route
        route.clearRoute();
        search.clearSearch();
        
        // Set destination and calculate route
        const destination: [number, number] = [place.location.lng, place.location.lat];
        route.setDestination(destination);
        route.getRoute(userLocation, destination);
        
        // Update search bar with selected place
        search.handleSearchInput(place.name);
      }
    });
  }, [userLocation, places, route, search]);

  // Handle transport mode change
  const handleTransportModeChange = (mode: TransportMode) => {
    route.setSelectedTransportMode(mode);
  };

  // Handle transit time mode changes
  const handleTransitTimeMode = (mode: TransitTimeMode) => {
    route.setTransitTimeMode(mode);
  };

  // Handle route update for transit
  const handleUpdateRoute = () => {
    if (userLocation && route.destination) {
      route.getRoute(userLocation, route.destination);
    }
  };

  // Handle route clearing with search query
  const handleClearRoute = () => {
    route.clearRoute();
    search.clearSearch();
  };

  return (
    <div className="relative h-full w-full">
      <MapView 
        mapContainer={mapContainer} 
        isLoading={isLoading} 
      />

      <SearchBar
        searchQuery={search.searchQuery}
        searchSuggestions={search.searchSuggestions}
        showSuggestions={search.showSuggestions}
        isSearching={search.isSearching}
        hasRoute={!!route.currentRoute}
        onSearchInput={handleSearchInput}
        onSuggestionSelect={handleSuggestionSelect}
        onClearRoute={handleClearRoute}
        onFocus={() => search.searchSuggestions.length > 0 && search.setShowSuggestions(true)}
      />

      <TransportToggle
        selectedTransportMode={route.selectedTransportMode}
        transitTimeMode={route.transitTimeMode}
        transitTargetTime={route.transitTargetTime}
        showTimeSelector={route.showTimeSelector}
        onModeChange={handleTransportModeChange}
        onTimeMode={handleTransitTimeMode}
        onTargetTime={route.setTransitTargetTime}
        onShowTimeSelector={route.setShowTimeSelector}
        onUpdateRoute={handleUpdateRoute}
      />

      <DirectionsPanel
        currentRoute={route.currentRoute}
        showDirections={route.showDirections}
        routeSteps={route.routeSteps}
        expandedSteps={route.expandedSteps}
        routeAlternatives={route.routeAlternatives}
        selectedRouteIndex={route.selectedRouteIndex}
        onShowDirections={route.setShowDirections}
        onClearRoute={handleClearRoute}
        onToggleStepExpansion={route.toggleStepExpansion}
        onSelectAlternative={route.selectRouteAlternative}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        selectedTransportMode={route.selectedTransportMode}
        transitPreferences={route.transitPreferences}
        isLoadingPlaces={places.isLoadingPlaces}
        placesCount={places.places.length}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onTransitPreferences={route.setTransitPreferences}
        onQuickSearch={handleQuickSearch}
        onClearPlaces={places.clearPlaceMarkers}
      />
    </div>
  );
}