const fs = require('fs');
const turf = require('@turf/turf');

// Load the crime data
console.log('Loading crime data...');
const crimeData = JSON.parse(fs.readFileSync('public/data/crime_data_optimized.geojson', 'utf8'));

// Define Toronto area bounds (slightly larger to ensure full coverage)
const torontoBounds = [
  -79.6, 43.5,  // southwest
  -79.1, 43.9   // northeast
];

// Create hexagonal grid
// Cell size in kilometers - 0.2km gives better granularity for route planning
const cellSize = 0.2;
const options = { units: 'kilometers' };

console.log('Generating hexagonal grid...');
const hexGrid = turf.hexGrid(torontoBounds, cellSize, options);

console.log(`Created ${hexGrid.features.length} hexagons`);

// Aggregate crime data into hexagons
console.log('Aggregating crime data into hexagons...');
const processedHexagons = hexGrid.features.map((hex, index) => {
  // Count crimes within this hexagon
  const crimesInHex = turf.pointsWithinPolygon(crimeData, hex);
  const crimeCount = crimesInHex.features.length;
  
  // Analyze crime types
  const crimeTypes = {};
  let highSeverityCrimes = 0;
  
  crimesInHex.features.forEach(crime => {
    const category = crime.properties.MCI_CATEGORY;
    crimeTypes[category] = (crimeTypes[category] || 0) + 1;
    
    // Count high severity crimes (Robbery, Assault)
    if (category === 'Robbery' || category === 'Assault') {
      highSeverityCrimes++;
    }
  });
  
  // Find dominant crime type
  const dominantCrimeType = Object.keys(crimeTypes).reduce((a, b) => 
    crimeTypes[a] > crimeTypes[b] ? a : b, null);
  
  // Calculate risk score based on total crimes and severity
  let riskScore = 0;
  
  if (crimeCount > 0) {
    // Base score from crime count
    riskScore = crimeCount;
    
    // Add weight for high severity crimes
    riskScore += highSeverityCrimes * 1.5;
  }
  
  // Only include hexagons with crimes to reduce file size
  if (crimeCount === 0) {
    return null;
  }
  
  return {
    type: 'Feature',
    geometry: hex.geometry,
    properties: {
      id: index,
      crime_count: crimeCount,
      risk_score: riskScore,
      dominant_crime: dominantCrimeType,
      high_severity_count: highSeverityCrimes
    }
  };
}).filter(hex => hex !== null); // Remove empty hexagons

// Calculate risk levels based on percentiles for more realistic distribution
const riskScores = processedHexagons.map(hex => hex.properties.risk_score).sort((a, b) => a - b);
const p25 = riskScores[Math.floor(riskScores.length * 0.25)];
const p50 = riskScores[Math.floor(riskScores.length * 0.50)];
const p75 = riskScores[Math.floor(riskScores.length * 0.75)];
const p90 = riskScores[Math.floor(riskScores.length * 0.90)];
const p95 = riskScores[Math.floor(riskScores.length * 0.95)];

console.log(`Risk score distribution:
25th percentile: ${p25}
50th percentile (median): ${p50}  
75th percentile: ${p75}
90th percentile: ${p90}
95th percentile: ${p95}`);

// Assign risk levels based on percentiles
processedHexagons.forEach(hex => {
  const score = hex.properties.risk_score;
  if (score <= p25) {
    hex.properties.risk_level = 'low';
  } else if (score <= p75) {
    hex.properties.risk_level = 'medium';
  } else if (score <= p95) {
    hex.properties.risk_level = 'high';
  } else {
    hex.properties.risk_level = 'very_high';
  }
});

// Create final GeoJSON
const hexGridGeoJSON = {
  type: 'FeatureCollection',
  features: processedHexagons
};

// Save the processed hex grid
fs.writeFileSync('public/data/crime_hex_grid.geojson', JSON.stringify(hexGridGeoJSON));

// Print statistics
console.log('\nHex Grid Statistics:');
console.log(`Total hexagons with crimes: ${processedHexagons.length}`);
console.log(`Original crime points: ${crimeData.features.length}`);

const riskCounts = {
  low: 0,
  medium: 0,
  high: 0,
  very_high: 0
};

processedHexagons.forEach(hex => {
  riskCounts[hex.properties.risk_level]++;
});

console.log('\nRisk Level Distribution:');
console.log(`Low risk: ${riskCounts.low}`);
console.log(`Medium risk: ${riskCounts.medium}`);
console.log(`High risk: ${riskCounts.high}`);
console.log(`Very high risk: ${riskCounts.very_high}`);

const fileSize = fs.statSync('public/data/crime_hex_grid.geojson').size / 1024;
console.log(`\nHex grid file size: ${fileSize.toFixed(2)} KB`);

console.log('\nHexagonal tessellation grid generated successfully!'); 