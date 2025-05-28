'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TrackPoint, Journey, DateRange } from '@/lib/types';
import { postgisToGeoJSON } from '@/utils/geometry';

export function useTracking(vehicleId: number | null, dateRange?: DateRange) {
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (dateRange) {
        query = query
          .gte('timestamp', dateRange.start.toISOString())
          .lte('timestamp', dateRange.end.toISOString());
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
  }, [vehicleId, dateRange]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  return { trackPoints, loading, error, refetch: fetchTrackingData };
}

export function useRealTimeTracking(vehicleIds: number[]) {
  const [currentPositions, setCurrentPositions] = useState<Map<number, TrackPoint>>(new Map());
  const [loading, setLoading] = useState(true);

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
        data?.forEach(point => {
          const vehicleId = point.vehicle_id;
          if (!latestPositions.has(vehicleId)) {
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

    // Set up real-time subscription
    const subscription = supabase
      .channel('track_points_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'track_points',
        filter: `vehicle_id=in.(${vehicleIds.join(',')})`
      }, (payload) => {
        const newPoint = payload.new as any;
        setCurrentPositions(prev => {
          const updated = new Map(prev);
          updated.set(newPoint.vehicle_id, {
            ...newPoint,
            location: postgisToGeoJSON(newPoint.location)
          });
          return updated;
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [vehicleIds]);

  return { currentPositions, loading };
}

export function useJourneys(vehicleId?: number, dateRange?: DateRange) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if (dateRange) {
        query = query
          .gte('start_timestamp', dateRange.start.toISOString())
          .lte('start_timestamp', dateRange.end.toISOString());
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
  }, [vehicleId, dateRange]);

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

  const startTime = trackPoints.length > 0 ? new Date(trackPoints[0].timestamp) : null;
  const endTime = trackPoints.length > 0 ? new Date(trackPoints[trackPoints.length - 1].timestamp) : null;

  useEffect(() => {
    if (trackPoints.length > 0 && currentIndex < trackPoints.length) {
      setCurrentTime(new Date(trackPoints[currentIndex].timestamp));
    }
  }, [currentIndex, trackPoints]);

  useEffect(() => {
    if (!isPlaying || currentIndex >= trackPoints.length - 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= trackPoints.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, trackPoints.length, currentIndex]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const reset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const seekTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, trackPoints.length - 1)));
  };

  const seekToTime = (time: Date) => {
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
  };

  const getCurrentPosition = () => {
    return trackPoints[currentIndex] || null;
  };

  return {
    currentIndex,
    currentTime,
    startTime,
    endTime,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    reset,
    seekTo,
    seekToTime,
    setPlaybackSpeed,
    getCurrentPosition,
    progress: trackPoints.length > 0 ? (currentIndex / (trackPoints.length - 1)) * 100 : 0
  };
} 