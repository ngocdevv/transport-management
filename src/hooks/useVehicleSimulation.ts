import { useState, useEffect } from 'react';

interface SimulatedVehicle {
  id: number;
  license_plate: string;
  coordinates: [number, number];
  heading: number;
  speed: number;
  timestamp: string;
  previousPositions?: [number, number][];
  color?: number[];
  distance?: number;
}

// Ho Chi Minh City area boundaries (approximate)
const HCMC_BOUNDS = {
  north: 11.1271, // Northern latitude limit
  south: 10.3491, // Southern latitude limit
  east: 107.0261, // Eastern longitude limit
  west: 106.3645, // Western longitude limit
  center: [10.8231, 106.6297] // Center coordinates [lat, lng]
};

/**
 * Hook to simulate vehicle movement for demo purposes
 * Moves vehicles 500m every 2 seconds based on their heading
 * Restricted to Ho Chi Minh City area
 */
export function useVehicleSimulation(
  isLiveTracking: boolean,
  vehicles: any[],
  forceHCMCArea = false,
  intervalMs = 2000 // Changed to 2 seconds
) {
  const [simulatedVehicles, setSimulatedVehicles] = useState<SimulatedVehicle[]>([]);
  const [totalDistance, setTotalDistance] = useState<Record<number, number>>({});

  useEffect(() => {
    // Initialize with current vehicle data
    if (vehicles.length > 0 && simulatedVehicles.length === 0) {
      // Assign unique colors to each vehicle
      const getVehicleColor = (index: number) => {
        const colors = [
          [255, 0, 0],    // Red
          [0, 128, 255],  // Blue
          [0, 200, 0],    // Green
          [255, 165, 0],  // Orange
          [128, 0, 128],  // Purple
          [0, 128, 128],  // Teal
          [255, 192, 203], // Pink
          [165, 42, 42]   // Brown
        ];
        return colors[index % colors.length];
      };

      setSimulatedVehicles(
        vehicles.map((vehicle, index) => {
          // First try to use the vehicle's actual position from track_points or live_vehicle_positions
          // Then fallback to forcing HCMC area if specified
          let initialCoordinates: [number, number] = [0, 0];

          // Check if the vehicle has current_position (from live_vehicle_positions)
          if (vehicle.current_position?.coordinates) {
            initialCoordinates = vehicle.current_position.coordinates;
          }
          // Check if the vehicle has a location property (from track_points)
          else if (vehicle.location?.coordinates) {
            initialCoordinates = vehicle.location.coordinates;
          }
          // Or check if the vehicle has last_position property
          else if (vehicle.last_position?.coordinates) {
            initialCoordinates = vehicle.last_position.coordinates;
          }
          // If we still don't have coordinates and forceHCMCArea is set, use HCMC area
          else if (forceHCMCArea) {
            // Place vehicle in Ho Chi Minh City area with some randomness
            const randomOffset = () => (Math.random() - 0.5) * 0.05; // Small random offset
            initialCoordinates = [
              HCMC_BOUNDS.center[0] + randomOffset(),
              HCMC_BOUNDS.center[1] + randomOffset()
            ];
          } else {
            // Default to HCMC center if no coordinates available
            initialCoordinates = [...HCMC_BOUNDS.center] as [number, number];
          }

          // Ensure coordinates are within HCMC bounds if forceHCMCArea is true
          if (forceHCMCArea) {
            initialCoordinates = [
              Math.min(Math.max(initialCoordinates[0], HCMC_BOUNDS.south), HCMC_BOUNDS.north),
              Math.min(Math.max(initialCoordinates[1], HCMC_BOUNDS.west), HCMC_BOUNDS.east)
            ];
          }

          return {
            id: vehicle.id,
            license_plate: vehicle.license_plate,
            coordinates: initialCoordinates,
            heading: vehicle.last_position?.heading || Math.random() * 360, // Random heading if none exists
            speed: vehicle.last_position?.speed || 30 + Math.random() * 20, // Random speed between 30-50 km/h
            timestamp: new Date().toISOString(),
            previousPositions: [],
            color: getVehicleColor(index),
            distance: 0
          };
        })
      );

      // Initialize distance counter
      const distanceMap: Record<number, number> = {};
      vehicles.forEach(vehicle => {
        distanceMap[vehicle.id] = 0;
      });
      setTotalDistance(distanceMap);
    }

    // Only run simulation when live tracking is enabled
    if (!isLiveTracking) return;

    const interval = setInterval(() => {
      setSimulatedVehicles(prevVehicles =>
        prevVehicles.map(vehicle => {
          // Convert 500 meters to latitude/longitude changes
          // This is an approximation and varies based on the Earth's curvature
          // At the equator, 1 degree of latitude ≈ 111km, so 500m ≈ 0.0045 degrees

          // Calculate distance based on heading
          const headingRadians = (vehicle.heading * Math.PI) / 180;

          // 500 meters in degrees of latitude (approximately 0.0045)
          const distanceDegrees = 0.0045;

          // Calculate lat/lng changes based on heading
          // Latitude change (north/south)
          const latChange = Math.cos(headingRadians) * distanceDegrees;

          // Longitude change (east/west) - adjusted for latitude
          // As you move away from the equator, longitude degrees become closer together
          const latitudeRadians = vehicle.coordinates[0] * Math.PI / 180;
          const lngChange = Math.sin(headingRadians) * distanceDegrees / Math.cos(latitudeRadians);

          // Calculate new coordinates
          let newLat = vehicle.coordinates[0] + latChange;
          let newLng = vehicle.coordinates[1] + lngChange;

          // Check if vehicle is going out of HCMC bounds
          const isOutOfBounds =
            newLat > HCMC_BOUNDS.north ||
            newLat < HCMC_BOUNDS.south ||
            newLng > HCMC_BOUNDS.east ||
            newLng < HCMC_BOUNDS.west;

          // If going out of bounds, change direction
          let headingChange = (Math.random() - 0.5) * 20; // Small random change by default

          if (isOutOfBounds) {
            // Turn back toward center of HCMC
            const centerLat = HCMC_BOUNDS.center[0];
            const centerLng = HCMC_BOUNDS.center[1];

            // Calculate angle to center
            const angleToCenter = Math.atan2(
              centerLng - vehicle.coordinates[1],
              centerLat - vehicle.coordinates[0]
            ) * 180 / Math.PI;

            // Set new heading toward center with some randomness
            const newHeading = angleToCenter + (Math.random() - 0.5) * 40; // Add some randomness

            // Adjust heading more drastically to turn back
            headingChange = newHeading - vehicle.heading;

            // Adjust position to stay in bounds
            newLat = Math.min(HCMC_BOUNDS.north - 0.01, Math.max(HCMC_BOUNDS.south + 0.01, newLat));
            newLng = Math.min(HCMC_BOUNDS.east - 0.01, Math.max(HCMC_BOUNDS.west + 0.01, newLng));
          }

          // Update speed with slight variations
          const newSpeed = Math.max(30, vehicle.speed + (Math.random() - 0.5) * 10);

          // Keep track of previous positions (limited to last 10)
          const previousPositions = [
            ...(vehicle.previousPositions || []),
            [...vehicle.coordinates] as [number, number]
          ].slice(-10);

          // Update total distance traveled (500m per update)
          const newDistance = (vehicle.distance || 0) + 0.5; // 500m = 0.5km

          return {
            ...vehicle,
            coordinates: [newLat, newLng] as [number, number],
            heading: (vehicle.heading + headingChange) % 360, // Keep heading in 0-360 range
            speed: newSpeed,
            timestamp: new Date().toISOString(),
            previousPositions,
            distance: newDistance
          };
        })
      );

      // Update total distance traveled
      setTotalDistance(prev => {
        const newDistances = { ...prev };
        simulatedVehicles.forEach(vehicle => {
          newDistances[vehicle.id] = (newDistances[vehicle.id] || 0) + 0.5; // 500m = 0.5km
        });
        return newDistances;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isLiveTracking, vehicles, intervalMs, forceHCMCArea]);

  return { simulatedVehicles, totalDistance };
} 