"use client";

import { Search, X, MapPinIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchSuggestion } from "@/utils/types";

interface SearchBarProps {
  searchQuery: string;
  searchSuggestions: SearchSuggestion[];
  showSuggestions: boolean;
  isSearching: boolean;
  hasRoute: boolean;
  onSearchInput: (value: string) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onClearRoute: () => void;
  onFocus: () => void;
}

export function SearchBar({
  searchQuery,
  searchSuggestions,
  showSuggestions,
  isSearching,
  hasRoute,
  onSearchInput,
  onSuggestionSelect,
  onClearRoute,
  onFocus,
}: SearchBarProps) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-80 z-20">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700">
        <div className="relative search-container">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search destinations"
            value={searchQuery}
            onChange={(e) => onSearchInput(e.target.value)}
            onFocus={onFocus}
            className="w-full pl-10 pr-10 py-3 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-400"></div>
            </div>
          )}
          {hasRoute && (
            <Button 
              onClick={onClearRoute}
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
                  onClick={() => onSuggestionSelect(suggestion)}
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
  );
} 