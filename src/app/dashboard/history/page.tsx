'use client';

import { useState, useEffect, useMemo } from 'react';
import { CalendarIcon, Clock, Truck, Calendar, Filter } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useVehicleHistoryData } from '@/hooks/useVehicleData';
import Map from '@/components/maps/Map';
import { formatDate, formatTime, formatDuration } from '@/utils/formatting';

export default function JourneyHistoryPage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
    start: new Date(new Date().setHours(0, 0, 0, 0)),
    end: new Date()
  });

  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { vehicle, loading: historyLoading } = useVehicleHistoryData(
    selectedVehicleId || 0,
    dateRange
  );

  // Initialize with the first vehicle if none selected
  useEffect(() => {
    if (!selectedVehicleId && !vehiclesLoading && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [selectedVehicleId, vehicles, vehiclesLoading]);

  // Format the date range for display
  const formattedDateRange = useMemo(() => {
    const startStr = formatDate(dateRange.start);
    const endStr = formatDate(dateRange.end);
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  }, [dateRange]);

  // Calculate journey statistics
  const journeyStats = useMemo(() => {
    if (!vehicle || !vehicle.routes || vehicle.routes.length < 2) {
      return { distance: 0, duration: 0, avgSpeed: 0, maxSpeed: 0 };
    }

    const firstPoint = vehicle.routes[0];
    const lastPoint = vehicle.routes[vehicle.routes.length - 1];
    const startTime = new Date(firstPoint.timestamp);
    const endTime = new Date(lastPoint.timestamp);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Calculate total distance and speeds
    let totalDistance = 0;
    let maxSpeed = 0;
    let totalSpeed = 0;
    let pointsWithSpeed = 0;

    for (let i = 1; i < vehicle.routes.length; i++) {
      const prevPoint = vehicle.routes[i - 1];
      const currPoint = vehicle.routes[i];

      // Haversine formula for distance between points
      const R = 6371; // Earth radius in km
      const dLat = (currPoint.latitude - prevPoint.latitude) * Math.PI / 180;
      const dLon = (currPoint.longitude - prevPoint.longitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prevPoint.latitude * Math.PI / 180) * Math.cos(currPoint.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const segmentDistance = R * c;

      totalDistance += segmentDistance;

      // Track speed stats
      if (currPoint.speed > 0) {
        totalSpeed += currPoint.speed;
        pointsWithSpeed++;
        maxSpeed = Math.max(maxSpeed, currPoint.speed);
      }
    }

    const avgSpeed = pointsWithSpeed > 0 ? totalSpeed / pointsWithSpeed : 0;

    return {
      distance: totalDistance, // in km
      duration: durationHours, // in hours
      avgSpeed,
      maxSpeed
    };
  }, [vehicle]);

  const handleDateRangeChange = (newRange: { start: Date, end: Date }) => {
    setDateRange(newRange);
  };

  const handleVehicleChange = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Journey History</h1>
        <p className="text-gray-600">Review past vehicle trips and routes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          {/* Vehicle Selector */}
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedVehicleId || ''}
              onChange={(e) => handleVehicleChange(Number(e.target.value))}
              disabled={vehiclesLoading}
            >
              {vehiclesLoading ? (
                <option>Loading vehicles...</option>
              ) : vehicles.length === 0 ? (
                <option>No vehicles available</option>
              ) : (
                vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} - {vehicle.model || 'Unknown Model'}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Range Picker (simplified for demo) */}
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <span>{formattedDateRange}</span>
            </div>
          </div>

          {/* Filter Button */}
          <div className="flex items-end">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Filter className="h-4 w-4 inline mr-1" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Journey Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Journey Details</h2>
          </div>
          <div className="p-4">
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <div className="text-gray-600">Loading journey data...</div>
              </div>
            ) : !vehicle ? (
              <div className="text-center py-8 text-gray-500">
                No journey data available
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                    <p className="text-xs text-gray-500">{vehicle.license_plate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="text-lg font-semibold">{journeyStats.distance.toFixed(2)} km</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-lg font-semibold">{formatDuration(journeyStats.duration * 60 * 60 * 1000)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Avg. Speed</p>
                    <p className="text-lg font-semibold">{journeyStats.avgSpeed.toFixed(1)} km/h</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Max Speed</p>
                    <p className="text-lg font-semibold">{journeyStats.maxSpeed.toFixed(1)} km/h</p>
                  </div>
                </div>

                {vehicle.routes.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Journey Timeline</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <div>
                        <Clock className="h-3 w-3 inline mr-1" />
                        Start: {formatTime(vehicle.routes[0].timestamp)}
                      </div>
                      <div>
                        <Clock className="h-3 w-3 inline mr-1" />
                        End: {formatTime(vehicle.routes[vehicle.routes.length - 1].timestamp)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Route Map</h2>
              <p className="text-sm text-gray-600">
                {vehicle ? formatDate(vehicle.routes[0]?.timestamp) : 'No data available'}
              </p>
            </div>
            <div className="h-[600px]">
              <Map
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
                mode="history"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 