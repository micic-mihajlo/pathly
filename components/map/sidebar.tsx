"use client";

import { 
  MapPin, 
  Compass, 
  Layers, 
  User, 
  X,
  PersonStanding,
  AlertCircle,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransportMode, TransitPreferences } from "@/utils/types";

interface SidebarProps {
  sidebarOpen: boolean;
  selectedTransportMode: TransportMode;
  transitPreferences: TransitPreferences;
  isLoadingPlaces?: boolean;
  placesCount?: number;
  onToggleSidebar: () => void;
  onTransitPreferences: (prefs: TransitPreferences) => void;
  onQuickSearch: (query: string) => void;
  onClearPlaces?: () => void;
}

export function Sidebar({
  sidebarOpen,
  selectedTransportMode,
  transitPreferences,
  isLoadingPlaces,
  placesCount,
  onToggleSidebar,
  onTransitPreferences,
  onQuickSearch,
  onClearPlaces,
}: SidebarProps) {
  return (
    <>
      {/* Menu button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="bg-gray-900/95 backdrop-blur-sm shadow-xl text-white hover:bg-gray-800 rounded-full w-10 h-10 border border-gray-700"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* User button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="bg-gray-900/95 backdrop-blur-sm shadow-xl text-white hover:bg-gray-800 rounded-full w-10 h-10 border border-gray-700"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-15"
          onClick={onToggleSidebar}
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
                  onClick={onToggleSidebar}
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

              {/* Divider */}
              <div className="border-t border-gray-700 my-4"></div>
              
              {/* Transit preferences (when transit is selected) */}
              {selectedTransportMode === TransportMode.TRANSIT && (
                <>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs uppercase tracking-wide px-3 mb-2">Transit Preferences</p>
                    
                    <Button
                      variant={transitPreferences.routePreference === 'best_route' ? 'default' : 'ghost'}
                      onClick={() => onTransitPreferences({...transitPreferences, routePreference: 'best_route'})}
                      className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto text-sm"
                    >
                      <Compass className="h-4 w-4 mr-3" />
                      Best Route
                    </Button>
                    
                    <Button
                      variant={transitPreferences.routePreference === 'fewer_transfers' ? 'default' : 'ghost'}
                      onClick={() => onTransitPreferences({...transitPreferences, routePreference: 'fewer_transfers'})}
                      className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto text-sm"
                    >
                      <AlertCircle className="h-4 w-4 mr-3" />
                      Fewer Transfers
                    </Button>
                    
                    <Button
                      variant={transitPreferences.routePreference === 'less_walking' ? 'default' : 'ghost'}
                      onClick={() => onTransitPreferences({...transitPreferences, routePreference: 'less_walking'})}
                      className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto text-sm"
                    >
                      <PersonStanding className="h-4 w-4 mr-3" />
                      Less Walking
                    </Button>
                  </div>
                  
                  <div className="border-t border-gray-700 my-4"></div>
                </>
              )}
              
              {/* Places Status */}
              {(isLoadingPlaces || (placesCount && placesCount > 0)) && (
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between px-3">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Nearby Places</p>
                    {placesCount && placesCount > 0 && onClearPlaces && (
                      <Button
                        variant="ghost"
                        onClick={onClearPlaces}
                        className="text-xs h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  {isLoadingPlaces ? (
                    <div className="flex items-center space-x-2 px-3 py-2 text-gray-300">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-400"></div>
                      <span className="text-sm">Searching...</span>
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-gray-300">
                      <span className="text-sm">Found {placesCount} places nearby</span>
                      <p className="text-xs text-gray-400 mt-1">Click any marker to get directions</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick POI Categories */}
              <div className="space-y-1">
                <p className="text-gray-400 text-xs uppercase tracking-wide px-3 mb-2">Quick Search</p>
                
                <Button
                  variant="ghost"
                  onClick={() => onQuickSearch("coffee near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">☕</span>
                  Coffee Shops
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => onQuickSearch("restaurant near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">🍽️</span>
                  Restaurants
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => onQuickSearch("gas station near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">⛽</span>
                  Gas Stations
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => onQuickSearch("hospital near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">🏥</span>
                  Hospitals
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => onQuickSearch("pharmacy near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">💊</span>
                  Pharmacies
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => onQuickSearch("bank near me")}
                  className="w-full justify-start text-white hover:bg-gray-800 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3">🏦</span>
                  Banks
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 