// Toronto coordinates for search bias
export const TORONTO_COORDS: [number, number] = [-79.3832, 43.6532]; // CN Tower

export interface SearchSuggestion {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted: string;
  feature_type: string;
  poi_category?: string[];
  maki?: string;
}

export enum TransportMode {
  DRIVING = 'driving',
  WALKING = 'walking',
  CYCLING = 'cycling',
  TRANSIT = 'transit'
}

export interface TransitDetails {
  arrivalStop: string;
  arrivalTime: string;
  departureStop: string;
  departureTime: string;
  headsign: string;
  line: {
    name: string;
    shortName?: string;
    color?: string;
    textColor?: string;
    vehicle?: {
      type: string;
      name: string;
      icon?: string;
    };
    agencies?: Array<{
      name: string;
      url?: string;
      phone?: string;
    }>;
  };
  numStops: number;
}

export interface RouteStep {
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
  instructions?: string;
  travelMode?: string;
  transitDetails?: TransitDetails;
  steps?: RouteStep[]; // For sub-steps in transit
  polyline?: {
    points: string;
  };
  maneuver?: string;
}

export interface GoogleRoute {
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  copyrights: string;
  legs: Array<{
    arrival_time?: {
      text: string;
      time_zone: string;
      value: number;
    };
    departure_time?: {
      text: string;
      time_zone: string;
      value: number;
    };
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    end_address: string;
    end_location: { lat: number; lng: number };
    start_address: string;
    start_location: { lat: number; lng: number };
    steps: RouteStep[];
  }>;
  overview_polyline: {
    points: string;
  };
  summary: string;
  warnings?: string[];
  waypoint_order?: number[];
  fare?: {
    currency: string;
    value: number;
    text: string;
  };
}

export interface RouteInfo {
  duration: number;
  distance: number;
  geometry?: GeoJSON.Geometry;
  polyline?: string;
  mode: TransportMode;
  googleRoute?: GoogleRoute;
  departureTime?: Date;
  arrivalTime?: Date;
  fare?: {
    currency: string;
    value: number;
    text: string;
  };
  warnings?: string[];
}

export type TransitTimeMode = 'leave_now' | 'leave_at' | 'arrive_by';

export interface TransitPreferences {
  mode: string;
  routePreference: string;
  transitModes: string[];
}

export interface Place {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  types: string[];
  openNow?: boolean;
  photoReference?: string;
  icon?: string;
  iconBackgroundColor?: string;
  iconMaskBaseUri?: string;
} 