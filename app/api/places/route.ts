import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, query, radius = 2000 } = body;

    if (!lat || !lng || !query) {
      return NextResponse.json(
        { error: 'Latitude, longitude, and query are required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    // Map common search terms to Google Places types
    const queryTypeMap: Record<string, string> = {
      'coffee': 'cafe',
      'restaurant': 'restaurant',
      'gas station': 'gas_station',
      'hospital': 'hospital',
      'pharmacy': 'pharmacy',
      'bank': 'bank',
      'grocery': 'grocery_or_supermarket',
      'hotel': 'lodging',
      'gym': 'gym',
      'parking': 'parking'
    };

    // Extract the main keyword from query (e.g., "coffee near me" -> "coffee")
    const mainKeyword = query.toLowerCase().split(' ')[0];
    const placeType = queryTypeMap[mainKeyword] || mainKeyword;

    // Build Google Places Nearby Search API URL
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: radius.toString(),
      type: placeType,
      key: GOOGLE_MAPS_API_KEY,
      language: 'en',
      region: 'CA'
    });

    // If no specific type found, use text search instead
    const apiUrl = queryTypeMap[mainKeyword] 
      ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?${new URLSearchParams({
          query: `${query} near ${lat},${lng}`,
          location: `${lat},${lng}`,
          radius: radius.toString(),
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
          region: 'CA'
        })}`;

    console.log('Making request to Google Places API:', {
      lat, lng, query, placeType, url: apiUrl
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Google Places API response:', parseError);
      return NextResponse.json(
        { 
          error: 'Google Places API returned invalid response', 
          details: responseText.substring(0, 500)
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `Google Places API error: ${response.status}`, 
          details: data.error_message || data 
        },
        { status: response.status }
      );
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { 
          error: `Google Places API error: ${data.status}`, 
          details: data.error_message 
        },
        { status: 400 }
      );
    }

    // Transform the response to our format
    const places = data.results?.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      types: place.types,
      openNow: place.opening_hours?.open_now,
      photoReference: place.photos?.[0]?.photo_reference,
      icon: place.icon,
      iconBackgroundColor: place.icon_background_color,
      iconMaskBaseUri: place.icon_mask_base_uri
    })) || [];

    console.log(`Found ${places.length} places for query: ${query}`);

    return NextResponse.json({
      places,
      status: data.status,
      query,
      location: { lat, lng }
    });

  } catch (error) {
    console.error('Places API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 