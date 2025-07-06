import { useEffect, useRef, useState } from "react";
import { SearchSuggestion, TORONTO_COORDS } from "@/utils/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionToken = useRef(Math.random().toString(36).substring(2, 15));

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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

  const handleSuggestionSelect = async (suggestion: SearchSuggestion): Promise<[number, number] | null> => {
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
        return coordinates;
      }
    } catch (error) {
      console.error("Error retrieving coordinates:", error);
    }
    
    return null;
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  return {
    searchQuery,
    searchSuggestions,
    showSuggestions,
    isSearching,
    handleSearchInput,
    handleSuggestionSelect,
    clearSearch,
    setShowSuggestions,
  };
} 