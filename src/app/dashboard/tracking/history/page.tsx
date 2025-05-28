'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Calendar, Clock, MapPin, Play } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useTracking, useJourneyPlayback } from '@/hooks/useTracking';
import { MapUtils } from '@/components/maps/ArcGISMap';
import { formatDistance, formatSpeed, formatDuration } from '@/utils/formatting';
import { calculateRouteDistance, calculateAverageSpeed } from '@/utils/geometry';

// Dynamic imports
const ArcGISMap = dynamic(() => import('@/components/maps/ArcGISMap'), { ssr: false });
const TimeSlider = dynamic(() => import('@/components/maps/TimeSlider'), { ssr: false });

export default function JourneyHistoryPage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    end: new Date()
  });
  const [mapView, setMapView] = useState<any>(null);

  const { vehicles } = useVehicles();
  const { trackPoints, loading } = useTracking(selectedVehicleId, dateRange);

  const playback = useJourneyPlayback(trackPoints);

  // Update map with route and current position
  useEffect(() => {
    if (!mapView || trackPoints.length === 0) return;

    // Clear existing graphics
    MapUtils.clearLayer(mapView, 'routes');
    MapUtils.clearLayer(mapView, 'vehicles');

    // Add route
    const coordinates = trackPoints.map(point => point.location.coordinates);
    if (selectedVehicleId) {
      MapUtils.addRoute(mapView, coordinates, selectedVehicleId);
    }

    // Add current position marker
    const currentPosition = playback.getCurrentPosition();
    if (currentPosition && selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        MapUtils.addVehicleMarker(mapView, vehicle, currentPosition.location.coordinates);
      }
    }

    // Zoom to route
    if (coordinates.length > 0) {
      MapUtils.zoomToLayer(mapView, 'routes');
    }
  }, [mapView, trackPoints, playback.currentIndex, selectedVehicleId, vehicles]);

  const handleMapLoad = (view: any) => {
    setMapView(view);
  };

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId ? parseInt(vehicleId) : null);
    playback.reset();
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: new Date(value)
    }));
    playback.reset();
  };

  // Calculate journey statistics
  const journeyStats = trackPoints.length > 0 ? {
    distance: calculateRouteDistance(trackPoints),
    averageSpeed: calculateAverageSpeed(trackPoints),
    duration: trackPoints.length > 1 ?
      (new Date(trackPoints[trackPoints.length - 1].timestamp).getTime() -
        new Date(trackPoints[0].timestamp).getTime()) / (1000 * 60) : 0,
    points: trackPoints.length
  } : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Journey History</h1>
        <p className="text-gray-600">View and replay vehicle journey data with temporal controls</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vehicle
            </label>
            <select
              value={selectedVehicleId || ''}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a vehicle...</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} - {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={dateRange.start.toISOString().slice(0, 16)}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={dateRange.end.toISOString().slice(0, 16)}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Journey Statistics */}
      {journeyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Distance</p>
                <p className="text-lg font-semibold">{formatDistance(journeyStats.distance)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-lg font-semibold">{formatDuration(journeyStats.duration)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Play className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Avg Speed</p>
                <p className="text-lg font-semibold">{formatSpeed(journeyStats.averageSpeed)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Data Points</p>
                <p className="text-lg font-semibold">{journeyStats.points}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map and Timeline */}
      <div className="space-y-4">
        {/* Map */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Journey Visualization</h2>
            <p className="text-sm text-gray-600">
              {selectedVehicleId ?
                `Showing route for ${vehicles.find(v => v.id === selectedVehicleId)?.license_plate}` :
                'Select a vehicle to view journey data'
              }
            </p>
          </div>
          <div className="h-96">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <div className="text-gray-600">Loading journey data...</div>
                </div>
              </div>
            ) : (
              <ArcGISMap onMapLoad={handleMapLoad} />
            )}
          </div>
        </div>

        {/* Time Slider */}
        {trackPoints.length > 0 && playback.startTime && playback.endTime && playback.currentTime && (
          <TimeSlider
            startTime={playback.startTime}
            endTime={playback.endTime}
            currentTime={playback.currentTime}
            onTimeChange={playback.seekToTime}
            isPlaying={playback.isPlaying}
            onPlayPause={playback.isPlaying ? playback.pause : playback.play}
            onReset={playback.reset}
            playbackSpeed={playback.playbackSpeed}
            onSpeedChange={playback.setPlaybackSpeed}
            progress={playback.progress}
            onSeek={(progress) => {
              const index = Math.round((progress / 100) * (trackPoints.length - 1));
              playback.seekTo(index);
            }}
          />
        )}
      </div>

      {/* No Data State */}
      {!loading && selectedVehicleId && trackPoints.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Journey Data Found</h3>
          <p className="text-gray-600">
            No tracking data available for the selected vehicle and time range.
            Try adjusting the date range or selecting a different vehicle.
          </p>
        </div>
      )}

      {/* Instructions */}
      {!selectedVehicleId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How to Use Journey History</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Select a vehicle from the dropdown above</li>
            <li>• Choose a date and time range for the journey</li>
            <li>• Use the time slider to replay the journey</li>
            <li>• Adjust playback speed and step through the timeline</li>
            <li>• View journey statistics and route visualization</li>
          </ul>
        </div>
      )}
    </div>
  );
} 