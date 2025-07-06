"use client";

import { 
  Car, 
  PersonStanding, 
  Bike, 
  Train, 
  Clock, 
  Calendar, 
  MapPin, 
  X,
  ChevronDown,
  CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransportMode, TransitTimeMode } from "@/utils/types";
import { formatTime } from "@/utils/transit";

interface TransportToggleProps {
  selectedTransportMode: TransportMode;
  transitTimeMode: TransitTimeMode;
  transitTargetTime: Date;
  showTimeSelector: boolean;
  onModeChange: (mode: TransportMode) => void;
  onTimeMode: (mode: TransitTimeMode) => void;
  onTargetTime: (time: Date) => void;
  onShowTimeSelector: (show: boolean) => void;
  onUpdateRoute: () => void;
}

export function TransportToggle({
  selectedTransportMode,
  transitTimeMode,
  transitTargetTime,
  showTimeSelector,
  onModeChange,
  onTimeMode,
  onTargetTime,
  onShowTimeSelector,
  onUpdateRoute,
}: TransportToggleProps) {
  const modes = [
    { mode: TransportMode.DRIVING, icon: Car, label: "Driving" },
    { mode: TransportMode.WALKING, icon: PersonStanding, label: "Walking" },
    { mode: TransportMode.CYCLING, icon: Bike, label: "Cycling" },
    { mode: TransportMode.TRANSIT, icon: Train, label: "Transit" },
  ];

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col space-y-2">
      {/* Transport Mode Selection */}
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/50 p-2">
        <div className="flex flex-col space-y-2">
          {modes.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant="ghost"
              size="icon"
              onClick={() => onModeChange(mode)}
              className={`w-10 h-10 rounded-lg border border-gray-600/50 transition-all duration-200 ${
                selectedTransportMode === mode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500'
              } ${mode === TransportMode.TRANSIT ? 'relative overflow-hidden' : ''}`}
              title={label}
            >
              {selectedTransportMode === mode && mode === TransportMode.TRANSIT && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
              )}
              <Icon className="h-4 w-4 z-10" />
            </Button>
          ))}
        </div>
      </div>

      {/* Transit Time Selector */}
      {selectedTransportMode === TransportMode.TRANSIT && (
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden transition-all duration-300">
          {!showTimeSelector ? (
            <div className="p-2">
              <Button
                onClick={() => onShowTimeSelector(true)}
                variant="ghost"
                className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 relative overflow-hidden group border-0 hover:border-gray-500 w-full h-9"
              >
                {transitTimeMode === 'leave_now' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-pulse" />
                )}
                <CalendarClock className="h-4 w-4 z-10 text-blue-400" />
                <span className="text-sm font-semibold z-10 text-gray-100">
                  {transitTimeMode === 'leave_now' ? 'Leave now' :
                   transitTimeMode === 'leave_at' ? `Leave at ${formatTime(transitTargetTime)}` :
                   `Arrive by ${formatTime(transitTargetTime)}`}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 z-10 transition-transform group-hover:translate-y-0.5 text-gray-300" />
              </Button>
            </div>
          ) : (
            <div className={`p-4 space-y-3 ${transitTimeMode === 'leave_now' ? 'w-48' : 'w-64'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-100 font-semibold text-sm">Schedule Trip</h3>
                <Button
                  onClick={() => onShowTimeSelector(false)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Time mode selection */}
              <div className="space-y-1">
                <Button
                  variant={transitTimeMode === 'leave_now' ? "default" : "ghost"}
                  onClick={() => {
                    onTimeMode('leave_now');
                    onShowTimeSelector(false);
                  }}
                  className={`w-full justify-start text-sm h-9 ${
                    transitTimeMode === 'leave_now' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'text-gray-200 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Leave now
                </Button>
                
                <Button
                  variant={transitTimeMode === 'leave_at' ? "default" : "ghost"}
                  onClick={() => onTimeMode('leave_at')}
                  className={`w-full justify-start text-sm h-9 ${
                    transitTimeMode === 'leave_at' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'text-gray-200 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Leave at
                </Button>
                
                <Button
                  variant={transitTimeMode === 'arrive_by' ? "default" : "ghost"}
                  onClick={() => onTimeMode('arrive_by')}
                  className={`w-full justify-start text-sm h-9 ${
                    transitTimeMode === 'arrive_by' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'text-gray-200 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Arrive by
                </Button>
              </div>
             
              {/* Time/Date picker for leave_at and arrive_by */}
              {(transitTimeMode === 'leave_at' || transitTimeMode === 'arrive_by') && (
                <div className="space-y-2 pt-2 border-t border-gray-700">
                  {/* Quick time options for leave_at */}
                  {transitTimeMode === 'leave_at' && (
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const newTime = new Date();
                          newTime.setMinutes(newTime.getMinutes() + 15);
                          onTargetTime(newTime);
                        }}
                        className="text-xs h-7 px-2 text-gray-200 hover:text-white hover:bg-gray-700 border border-gray-600/50"
                      >
                        +15 min
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const newTime = new Date();
                          newTime.setMinutes(newTime.getMinutes() + 30);
                          onTargetTime(newTime);
                        }}
                        className="text-xs h-7 px-2 text-gray-200 hover:text-white hover:bg-gray-700 border border-gray-600/50"
                      >
                        +30 min
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const newTime = new Date();
                          newTime.setHours(newTime.getHours() + 1);
                          onTargetTime(newTime);
                        }}
                        className="text-xs h-7 px-2 text-gray-200 hover:text-white hover:bg-gray-700 border border-gray-600/50"
                      >
                        +1 hour
                      </Button>
                    </div>
                  )}
                 
                  <input
                    type="time"
                    value={isNaN(transitTargetTime.getTime()) ? '09:00' : transitTargetTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      if (hours && minutes && !isNaN(parseInt(hours)) && !isNaN(parseInt(minutes))) {
                        const newTime = new Date(transitTargetTime);
                        newTime.setHours(parseInt(hours), parseInt(minutes));
                        onTargetTime(newTime);
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-400 focus:bg-gray-600"
                  />
                  
                  <input
                    type="date"
                    value={isNaN(transitTargetTime.getTime()) ? new Date().toISOString().slice(0, 10) : transitTargetTime.toISOString().slice(0, 10)}
                    onChange={(e) => {
                      const newTime = new Date(e.target.value + 'T' + transitTargetTime.toTimeString().slice(0, 8));
                      if (!isNaN(newTime.getTime())) {
                        onTargetTime(newTime);
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-400 focus:bg-gray-600"
                  />
                  
                  <Button
                    onClick={() => {
                      onShowTimeSelector(false);
                      onUpdateRoute();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 font-semibold"
                  >
                    Update route
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 