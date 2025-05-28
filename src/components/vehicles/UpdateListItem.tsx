import { MapPin } from 'lucide-react';
import { memo } from 'react';

interface UpdateListItemProps {
  vehicle: {
    license_plate: string;
    id: number;
  };
  position: {
    timestamp: string;
    speed: number | null;
    location?: {
      coordinates: [number, number];
    };
    coordinates?: [number, number]; // Add support for simulated vehicle data
    distance?: number; // Add distance information for simulation
  };
}

const UpdateListItem = memo(({ vehicle, position }: UpdateListItemProps) => {
  // Support both real API data format and simulated data format
  const coordinates = position.coordinates ||
    (position.location ? position.location.coordinates : [0, 0]);

  // Check if this is simulated data with distance information
  const isSimulated = position.distance !== undefined;

  return (
    <div className="flex items-center p-2 border-b border-gray-100">
      <div className="flex-shrink-0 mr-3">
        <div className="bg-blue-100 p-2 rounded-full">
          <MapPin className="h-4 w-4 text-blue-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {vehicle.license_plate}
          {isSimulated && <span className="ml-1 text-xs text-green-600">(Demo)</span>}
        </p>
        <div className="flex text-xs text-gray-500">
          <p>
            {new Date(position.timestamp).toLocaleTimeString()} •&nbsp;
          </p>
          <p>
            Speed: {position.speed ? `${position.speed.toFixed(1)} km/h` : 'N/A'}
            {isSimulated && position.distance !== undefined && (
              <span> • Distance: {position.distance.toFixed(1)} km</span>
            )}
          </p>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)}
      </div>
    </div>
  );
});

UpdateListItem.displayName = 'UpdateListItem';

export default UpdateListItem; 