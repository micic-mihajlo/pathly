"use client";

import { 
  Car, 
  PersonStanding, 
  Bike, 
  Train, 
  Navigation, 
  X,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteInfo, RouteStep, TransportMode, GoogleRoute } from "@/utils/types";
import { formatDuration, formatDistance, formatTime, getTransitIcon, getTTCLineColor } from "@/utils/transit";

interface DirectionsPanelProps {
  currentRoute: RouteInfo | null;
  showDirections: boolean;
  routeSteps: RouteStep[];
  expandedSteps: Set<number>;
  routeAlternatives: GoogleRoute[];
  selectedRouteIndex: number;
  onShowDirections: (show: boolean) => void;
  onClearRoute: () => void;
  onToggleStepExpansion: (index: number) => void;
  onSelectAlternative: (index: number) => void;
}

export function DirectionsPanel({
  currentRoute,
  showDirections,
  routeSteps,
  expandedSteps,
  routeAlternatives,
  selectedRouteIndex,
  onShowDirections,
  onClearRoute,
  onToggleStepExpansion,
  onSelectAlternative,
}: DirectionsPanelProps) {
  if (!currentRoute) return null;

  const renderTransitStep = (step: RouteStep, index: number) => {
    const isExpanded = expandedSteps.has(index);
    
    if (step.transitDetails) {
      const colors = getTTCLineColor(step.transitDetails.line.name);
      const vehicleIcon = getTransitIcon(step.transitDetails.line.vehicle?.type as any);
      
      return (
        <div key={index} className="relative">
          {/* Connection line to previous step */}
          {index > 0 && (
            <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-600"></div>
          )}
          
          <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
            <button
              onClick={() => onToggleStepExpansion(index)}
              className="w-full text-left hover:bg-gray-700/30 transition-colors p-4"
            >
              <div className="flex items-center space-x-4">
                {/* Vehicle icon with line color */}
                <div 
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {vehicleIcon}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Line name and direction */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-white text-base">
                      {step.transitDetails.line.shortName || step.transitDetails.line.name}
                    </span>
                    <span className="text-gray-400 text-sm">→</span>
                    <span className="text-gray-300 text-sm font-medium truncate">
                      {step.transitDetails.headsign}
                    </span>
                  </div>
                  
                  {/* Time and stops info */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-medium">
                        {step.transitDetails.departureTime}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-white font-medium">
                        {step.transitDetails.arrivalTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        {step.transitDetails.numStops} stops
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-gray-300 font-medium">
                        {step.duration?.text}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Expand/collapse indicator */}
                <div className="flex-shrink-0">
                  {isExpanded ? 
                    <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  }
                </div>
              </div>
            </button>
            
            {/* Expanded details */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-700/50">
                <div className="ml-16 space-y-4">
                  {/* Journey timeline */}
                  <div className="relative">
                    {/* Departure */}
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mt-2 shadow-lg"></div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          Board at {step.transitDetails.departureStop}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          Platform • {step.transitDetails.departureTime}
                        </div>
                      </div>
                    </div>
                    
                    {/* Journey line */}
                    <div className="absolute left-1.5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500 to-red-500"></div>
                    
                    {/* Journey info */}
                    <div className="flex items-center space-x-3 mb-4 ml-6">
                      <div className="flex-1 py-3 px-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {step.transitDetails.line.shortName?.substring(0, 2) || 
                               step.transitDetails.line.name.substring(0, 2)}
                            </div>
                            <span className="text-gray-300 text-sm">
                              {step.transitDetails.numStops} stops
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm font-medium">
                              {step.duration?.text}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {step.distance?.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrival */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-3 h-3 bg-red-500 rounded-full mt-2 shadow-lg"></div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          Exit at {step.transitDetails.arrivalStop}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          Platform • {step.transitDetails.arrivalTime}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional transit info */}
                  {step.transitDetails.line.agencies?.[0] && (
                    <div className="mt-4 pt-3 border-t border-gray-700/50">
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-400">
                          Operated by {step.transitDetails.line.agencies[0].name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Walking/Transfer steps
    return (
      <div key={index} className="relative">
        {/* Connection line */}
        {index > 0 && (
          <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-600"></div>
        )}
        
        <div className="flex items-start space-x-4 p-4 bg-gray-800/20 rounded-xl border border-gray-700/30">
          {/* Walking icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <PersonStanding className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Instruction */}
            <div className="text-white font-medium text-sm mb-1">
              {step.instructions || 'Walk to next stop'}
            </div>
            
            {/* Duration and distance */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">{step.duration?.text || '2 min'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Navigation className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">{step.distance?.text || '150m'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Connection line to next step */}
        {index < routeSteps.length - 1 && (
          <div className="absolute left-6 bottom-0 w-0.5 h-3 bg-gray-600"></div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay when expanded */}
      {showDirections && (
        <div className="absolute inset-0 bg-black/30 z-30" onClick={() => onShowDirections(false)} />
      )}
      
      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 ${showDirections ? 'w-[480px]' : 'w-80'} z-40 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 transition-all duration-300 ${showDirections ? 'max-h-[75vh]' : 'max-h-32'} overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {currentRoute.mode === TransportMode.DRIVING && <Car className="h-4 w-4 text-blue-400" />}
                {currentRoute.mode === TransportMode.WALKING && <PersonStanding className="h-4 w-4 text-green-400" />}
                {currentRoute.mode === TransportMode.CYCLING && <Bike className="h-4 w-4 text-orange-400" />}
                {currentRoute.mode === TransportMode.TRANSIT && <Train className="h-4 w-4 text-purple-400" />}
                <span className="text-white font-medium">{formatDuration(currentRoute.duration)}</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center space-x-1">
                <Navigation className="h-4 w-4 text-blue-400" />
                <span className="text-white font-medium">{formatDistance(currentRoute.distance)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onShowDirections(!showDirections)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                {showDirections ? 'Hide' : 'Details'}
              </Button>
              <Button
                onClick={onClearRoute}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-8 h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Transit-specific info */}
          {showDirections && currentRoute.mode === TransportMode.TRANSIT && currentRoute.departureTime && currentRoute.arrivalTime && (
            <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">Depart</span>
                  <span className="text-white font-medium">{formatTime(currentRoute.departureTime)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Arrive</span>
                  <span className="text-white font-medium">{formatTime(currentRoute.arrivalTime)}</span>
                </div>
              </div>
              
              {currentRoute.fare && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-white">{currentRoute.fare.text}</span>
                  <span className="text-gray-400">• Presto fare</span>
                </div>
              )}
              
              {/* Route alternatives for transit */}
              {routeAlternatives.length > 1 && (
                <div className="flex items-center space-x-2 pt-2">
                  <span className="text-gray-400 text-sm">Routes:</span>
                  <div className="flex space-x-1">
                    {routeAlternatives.slice(0, 3).map((_, index) => (
                      <Button
                        key={index}
                        variant={selectedRouteIndex === index ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onSelectAlternative(index)}
                        className="h-6 px-2 text-xs"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Warnings */}
          {showDirections && currentRoute.warnings && currentRoute.warnings.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-200">
                  {currentRoute.warnings.join(' ')}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Expandable directions */}
        {showDirections && (
          <div className="p-6 overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
            {currentRoute.mode === TransportMode.TRANSIT ? (
              <div className="space-y-4">
                {routeSteps.map((step, index) => renderTransitStep(step, index))}
              </div>
            ) : (
              <div className="space-y-2">
                {routeSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{step.instructions}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {step.distance?.text} • {step.duration?.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
} 