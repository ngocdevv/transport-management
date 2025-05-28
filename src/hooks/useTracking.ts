'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { TrackPoint, Journey, DateRange } from '@/lib/types';
import { postgisToGeoJSON } from '@/utils/geometry';

export function useTracking(vehicleId: number | null, dateRange?: DateRange) {
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize dateRange to prevent unnecessary refetches
  const memoizedDateRange = useMemo(() => {
    if (!dateRange) return undefined;
    return {
      start: dateRange.start,
      end: dateRange.end
    };
  }, [dateRange?.start.toISOString(), dateRange?.end.toISOString()]);

  const fetchTrackingData = useCallback(async () => {
    if (!vehicleId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('track_points')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: true });

      if (memoizedDateRange) {
        query = query
          .gte('timestamp', memoizedDateRange.start.toISOString())
          .lte('timestamp', memoizedDateRange.end.toISOString());
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw supabaseError;
      }

      // Convert PostGIS geometry to GeoJSON format
      const formattedData = (data || []).map(point => ({
        ...point,
        location: postgisToGeoJSON(point.location)
      }));

      setTrackPoints(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, memoizedDateRange]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  return { trackPoints, loading, error, refetch: fetchTrackingData };
}

export function useRealTimeTracking(vehicleIds: number[]) {
  const [currentPositions, setCurrentPositions] = useState<Map<number, TrackPoint>>(new Map());
  const [loading, setLoading] = useState(true);

  // Store subscription in a ref to avoid recreating on every render
  const subscriptionRef = useRef<any>(null);

  // Memoize vehicleIds to prevent unnecessary subscription changes
  const memoizedVehicleIds = useMemo(() =>
    // Only update when the actual IDs change, not just the array reference
    vehicleIds.slice().sort().join(','),
    [vehicleIds]
  );

  useEffect(() => {
    if (vehicleIds.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch initial positions
    const fetchInitialPositions = async () => {
      try {
        const { data, error } = await supabase
          .from('track_points')
          .select('*')
          .in('vehicle_id', vehicleIds)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        // Get the latest position for each vehicle
        const latestPositions = new Map<number, TrackPoint>();

        // Process data only once and store in map
        const processedVehicles = new Set<number>();

        data?.forEach(point => {
          const vehicleId = point.vehicle_id;

          // Only process the first (most recent) point for each vehicle
          if (!processedVehicles.has(vehicleId)) {
            processedVehicles.add(vehicleId);
            latestPositions.set(vehicleId, {
              ...point,
              location: postgisToGeoJSON(point.location)
            });
          }
        });

        setCurrentPositions(latestPositions);
      } catch (err) {
        console.error('Failed to fetch initial positions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPositions();

    // Clean up existing subscription if it exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Set up real-time subscription
    subscriptionRef.current = supabase
      .channel('track_points_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'track_points',
        filter: `vehicle_id=in.(${vehicleIds.join(',')})`
      }, (payload) => {
        const newPoint = payload.new as any;

        // Avoid unnecessary state updates by checking if the position is newer
        setCurrentPositions(prev => {
          const existingPoint = prev.get(newPoint.vehicle_id);

          // If we have no existing point or the new point is more recent
          if (!existingPoint || new Date(newPoint.timestamp) > new Date(existingPoint.timestamp)) {
            const updated = new Map(prev);
            updated.set(newPoint.vehicle_id, {
              ...newPoint,
              location: postgisToGeoJSON(newPoint.location)
            });
            return updated;
          }

          // No update needed
          return prev;
        });
      })
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [memoizedVehicleIds]); // Only recreate subscription when vehicleIds actually change

  return { currentPositions, loading };
}

export function useJourneys(vehicleId?: number, dateRange?: DateRange) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize dateRange to prevent unnecessary refetches
  const memoizedDateRange = useMemo(() => {
    if (!dateRange) return undefined;
    return {
      start: dateRange.start,
      end: dateRange.end
    };
  }, [dateRange?.start.toISOString(), dateRange?.end.toISOString()]);

  const fetchJourneys = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('journeys')
        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .order('start_timestamp', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      if (memoizedDateRange) {
        query = query
          .gte('start_timestamp', memoizedDateRange.start.toISOString())
          .lte('start_timestamp', memoizedDateRange.end.toISOString());
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw supabaseError;
      }

      // Convert PostGIS geometry to GeoJSON format
      const formattedData = (data || []).map(journey => ({
        ...journey,
        start_location: journey.start_location ? postgisToGeoJSON(journey.start_location) : null,
        end_location: journey.end_location ? postgisToGeoJSON(journey.end_location) : null
      }));

      setJourneys(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch journeys');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, memoizedDateRange]);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  return { journeys, loading, error, refetch: fetchJourneys };
}

export function useJourneyPlayback(trackPoints: TrackPoint[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Memoize these values to prevent unnecessary rerenders
  const startTime = useMemo(() =>
    trackPoints.length > 0 ? new Date(trackPoints[0].timestamp) : null,
    [trackPoints.length > 0 ? trackPoints[0].timestamp : null]
  );

  const endTime = useMemo(() =>
    trackPoints.length > 0 ? new Date(trackPoints[trackPoints.length - 1].timestamp) : null,
    [trackPoints.length > 0 ? trackPoints[trackPoints.length - 1].timestamp : null]
  );

  // Store interval ID in a ref
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (trackPoints.length > 0 && currentIndex < trackPoints.length) {
      setCurrentTime(new Date(trackPoints[currentIndex].timestamp));
    }
  }, [currentIndex, trackPoints]);

  useEffect(() => {
    // Clean up existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPlaying || currentIndex >= trackPoints.length - 1) return;

    // Store interval ID in ref
    intervalRef.current = window.setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= trackPoints.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, trackPoints.length, currentIndex]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const reset = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, trackPoints.length - 1)));
  }, [trackPoints.length]);

  const seekToTime = useCallback((time: Date) => {
    const targetTime = time.getTime();
    let closestIndex = 0;
    let closestDiff = Math.abs(new Date(trackPoints[0]?.timestamp || 0).getTime() - targetTime);

    trackPoints.forEach((point, index) => {
      const diff = Math.abs(new Date(point.timestamp).getTime() - targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = index;
      }
    });

    seekTo(closestIndex);
  }, [trackPoints, seekTo]);

  const getCurrentPosition = useCallback(() => {
    return trackPoints[currentIndex] || null;
  }, [trackPoints, currentIndex]);

  return {
    currentIndex,
    currentTime,
    isPlaying,
    playbackSpeed,
    startTime,
    endTime,
    play,
    pause,
    reset,
    seekTo,
    seekToTime,
    setPlaybackSpeed,
    getCurrentPosition
  };
} 