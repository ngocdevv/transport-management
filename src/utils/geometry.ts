import { TrackPoint } from '@/lib/types';

// Haversine formula for calculating distances between GPS coordinates
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Calculate bearing between two points
export function calculateBearing(point1: [number, number], point2: [number, number]): number {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360 degrees
}

// Convert track points to ArcGIS polyline geometry
export function createRoutePolyline(trackPoints: TrackPoint[]): number[][] {
  return trackPoints.map(point => point.location.coordinates);
}

// Calculate total distance of a route
export function calculateRouteDistance(trackPoints: TrackPoint[]): number {
  if (trackPoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    const point1 = trackPoints[i - 1].location.coordinates;
    const point2 = trackPoints[i].location.coordinates;
    totalDistance += calculateDistance(point1, point2);
  }

  return totalDistance;
}

// Calculate average speed from track points
export function calculateAverageSpeed(trackPoints: TrackPoint[]): number {
  if (trackPoints.length === 0) return 0;

  const validSpeeds = trackPoints
    .map(point => point.speed)
    .filter((speed): speed is number => speed !== null && speed >= 0);

  if (validSpeeds.length === 0) return 0;

  return validSpeeds.reduce((sum, speed) => sum + speed, 0) / validSpeeds.length;
}

// Calculate journey duration in minutes
export function calculateJourneyDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
}

// Get bounding box for a set of coordinates
export function getBoundingBox(coordinates: [number, number][]): {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
} {
  if (coordinates.length === 0) {
    return { minLon: 0, maxLon: 0, minLat: 0, maxLat: 0 };
  }

  let minLon = coordinates[0][0];
  let maxLon = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];

  coordinates.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return { minLon, maxLon, minLat, maxLat };
}

// Check if a point is within a bounding box
export function isPointInBounds(
  point: [number, number],
  bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }
): boolean {
  const [lon, lat] = point;
  return lon >= bounds.minLon && lon <= bounds.maxLon &&
    lat >= bounds.minLat && lat <= bounds.maxLat;
}

// Interpolate position between two points based on time
export function interpolatePosition(
  point1: TrackPoint,
  point2: TrackPoint,
  targetTime: Date
): [number, number] {
  const time1 = new Date(point1.timestamp).getTime();
  const time2 = new Date(point2.timestamp).getTime();
  const targetTimeMs = targetTime.getTime();

  if (targetTimeMs <= time1) return point1.location.coordinates;
  if (targetTimeMs >= time2) return point2.location.coordinates;

  const ratio = (targetTimeMs - time1) / (time2 - time1);

  const [lon1, lat1] = point1.location.coordinates;
  const [lon2, lat2] = point2.location.coordinates;

  const interpolatedLon = lon1 + (lon2 - lon1) * ratio;
  const interpolatedLat = lat1 + (lat2 - lat1) * ratio;

  return [interpolatedLon, interpolatedLat];
}

// Convert PostGIS geometry to GeoJSON format
export function postgisToGeoJSON(postgisGeometry: any): {
  type: 'Point';
  coordinates: [number, number];
} {
  // Handle different PostGIS geometry formats
  if (typeof postgisGeometry === 'string') {
    // Parse WKT format: "POINT(105.8342 21.0278)"
    const match = postgisGeometry.match(/POINT\(([^)]+)\)/);
    if (match) {
      const [lon, lat] = match[1].split(' ').map(Number);
      return { type: 'Point', coordinates: [lon, lat] };
    }
  }

  // If already in GeoJSON format
  if (postgisGeometry && postgisGeometry.coordinates) {
    return postgisGeometry;
  }

  // Default fallback
  return { type: 'Point', coordinates: [0, 0] };
} 