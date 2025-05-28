'use client';

import { memo, useMemo } from 'react';
import { Truck } from 'lucide-react';
import { formatVehicleStatus, getStatusColor, formatTime } from '@/utils/formatting';

interface VehicleSelectorProps {
  vehicles: any[];
  currentPositions: Map<number, any>;
  selectedVehicleId: number | null;
  onSelectVehicle: (vehicleId: number) => void;
  loading?: boolean;
  simulatedVehicles?: any[];
  isLiveTracking?: boolean;
  liveTrackingVehicles?: Set<number>;
}

const VehicleSelector = memo(({
  vehicles,
  currentPositions,
  selectedVehicleId,
  onSelectVehicle,
  loading = false,
  simulatedVehicles = [],
  isLiveTracking = false,
  liveTrackingVehicles = new Set()
}: VehicleSelectorProps) => {
  // Create a combined map of positions including simulated data
  const positionsMap = useMemo(() => {
    const combinedMap = new Map(currentPositions);

    // Add simulated data if in demo mode
    if (simulatedVehicles.length > 0) {
      simulatedVehicles.forEach(vehicle => {
        combinedMap.set(vehicle.id, {
          timestamp: vehicle.timestamp,
          speed: vehicle.speed,
          coordinates: vehicle.coordinates
        });
      });
    }

    return combinedMap;
  }, [currentPositions, simulatedVehicles]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-gray-600">Loading vehicles...</div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No vehicles found
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {vehicles.map((vehicle) => {
        const position = positionsMap.get(vehicle.id);
        const isSelected = selectedVehicleId === vehicle.id;
        const vehicleHasLiveTracking = liveTrackingVehicles.has(vehicle.id);
        const isSimulated = vehicleHasLiveTracking && simulatedVehicles.some(v => v.id === vehicle.id);

        return (
          <div
            key={vehicle.id}
            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${isSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
              }`}
            onClick={() => onSelectVehicle(vehicle.id)}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Truck className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {vehicle.license_plate}
                  {isSimulated && <span className="ml-1 text-xs text-green-600">(Demo)</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {vehicle.model || 'Unknown Model'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                {formatVehicleStatus(vehicle.status)}
              </span>
              {position && (
                <p className="text-xs text-gray-400 mt-1">
                  Last update: {formatTime(position.timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

VehicleSelector.displayName = 'VehicleSelector';

export default VehicleSelector; 