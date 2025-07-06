import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, mode, alternatives, transitOptions } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    // Build Google Maps Directions API URL
    const params = new URLSearchParams({
      origin,
      destination,
      mode: mode || 'transit',
      key: GOOGLE_MAPS_API_KEY,
      alternatives: alternatives ? 'true' : 'false',
      language: 'en',
      region: 'CA', // Canada
      units: 'metric',
    });

    // Log the request for debugging
    console.log('Making request to Google Maps API:', {
      origin,
      destination,
      mode,
      url: `https://maps.googleapis.com/maps/api/directions/json?${params}`
    });

    // Add transit-specific options
    if (mode === 'transit' && transitOptions) {
      if (transitOptions.departureTime) {
        const departureTime = Math.floor(new Date(transitOptions.departureTime).getTime() / 1000);
        params.append('departure_time', departureTime.toString());
      }
      
      if (transitOptions.arrivalTime) {
        const arrivalTime = Math.floor(new Date(transitOptions.arrivalTime).getTime() / 1000);
        params.append('arrival_time', arrivalTime.toString());
      }
      
      if (transitOptions.modes && transitOptions.modes.length > 0) {
        params.append('transit_mode', transitOptions.modes.join('|'));
      }
      
      if (transitOptions.routingPreference && transitOptions.routingPreference !== 'best_route') {
        // Google only accepts 'less_walking' and 'fewer_transfers'
        if (transitOptions.routingPreference === 'fewer_transfers' || transitOptions.routingPreference === 'less_walking') {
          params.append('transit_routing_preference', transitOptions.routingPreference);
        }
      }
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Get response text first to handle non-JSON responses
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Google Maps API response as JSON:', parseError);
      console.error('Raw response:', responseText);
      console.error('Response status:', response.status);
      console.error('Response headers:', response.headers);
      
      return NextResponse.json(
        { 
          error: 'Google Maps API returned invalid response', 
          details: responseText.substring(0, 500),
          status: response.status
        },
        { status: 502 }
      );
    }
    
    // Log the full response for debugging
    console.log('Google Maps API Response:', {
      status: response.status,
      data: data
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `Google Maps API error: ${response.status}`, 
          details: data.error_message || data,
          url: `https://maps.googleapis.com/maps/api/directions/json?${params}`
        },
        { status: response.status }
      );
    }

    if (data.status !== 'OK') {
      return NextResponse.json(
        { 
          error: `Google Maps API error: ${data.status}`, 
          details: data.error_message,
          availableRoutes: data.available_travel_modes 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Directions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 