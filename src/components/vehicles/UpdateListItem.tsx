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
    location: {
      coordinates: [number, number];
    };
  };
}

const UpdateListItem = memo(({ vehicle, position }: UpdateListItemProps) => (
  <div className="flex items-center p-2 border-b border-gray-100">
    <div className="flex-shrink-0 mr-3">
      <div className="bg-blue-100 p-2 rounded-full">
        <MapPin className="h-4 w-4 text-blue-600" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">
        {vehicle.license_plate}
      </p>
      <div className="flex text-xs text-gray-500">
        <p>
          {new Date(position.timestamp).toLocaleTimeString()} •&nbsp;
        </p>
        <p>
          Speed: {position.speed ? `${position.speed.toFixed(1)} km/h` : 'N/A'}
        </p>
      </div>
    </div>
    <div className="text-xs text-gray-500">
      {position.location.coordinates[1].toFixed(5)}, {position.location.coordinates[0].toFixed(5)}
    </div>
  </div>
));

UpdateListItem.displayName = 'UpdateListItem';

export default UpdateListItem; 