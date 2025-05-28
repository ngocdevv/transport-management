'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { formatTime, formatDate } from '@/utils/formatting';
import { TIME_SLIDER_CONFIG } from '@/utils/constants';

interface TimeSliderProps {
  startTime: Date;
  endTime: Date;
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  progress: number;
  onSeek: (progress: number) => void;
  className?: string;
}

export default function TimeSlider({
  startTime,
  endTime,
  currentTime,
  onTimeChange,
  isPlaying,
  onPlayPause,
  onReset,
  playbackSpeed,
  onSpeedChange,
  progress,
  onSeek,
  className = ""
}: TimeSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setLocalProgress(newProgress);

    if (!isDragging) {
      onSeek(newProgress);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    onSeek(localProgress);
  };

  const handleStepBackward = () => {
    const newProgress = Math.max(0, progress - 1);
    onSeek(newProgress);
  };

  const handleStepForward = () => {
    const newProgress = Math.min(100, progress + 1);
    onSeek(newProgress);
  };

  const totalDuration = endTime.getTime() - startTime.getTime();
  const currentDuration = currentTime.getTime() - startTime.getTime();
  const remainingDuration = totalDuration - currentDuration;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      {/* Time Display */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{formatTime(currentTime)}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(currentTime)}</span>
        </div>
        <div className="text-sm text-gray-500">
          {formatTime(startTime)} - {formatTime(endTime)}
        </div>
      </div>

      {/* Progress Slider */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={localProgress}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${localProgress}%, #E5E7EB ${localProgress}%, #E5E7EB 100%)`
            }}
          />
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md pointer-events-none"
            style={{ left: `calc(${localProgress}% - 8px)` }}
          />
        </div>

        {/* Time markers */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(startTime)}</span>
          <span>{formatTime(endTime)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Reset Button */}
          <button
            onClick={onReset}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Reset to start"
          >
            <RotateCcw size={18} />
          </button>

          {/* Step Backward */}
          <button
            onClick={handleStepBackward}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Step backward"
          >
            <SkipBack size={18} />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Step Forward */}
          <button
            onClick={handleStepForward}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Step forward"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIME_SLIDER_CONFIG.SPEED_OPTIONS.map(speed => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Info */}
      <div className="flex justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
        <span>
          Progress: {progress !== undefined && progress !== null ? progress.toFixed(1) : '0.0'}%
        </span>
        <span>
          Remaining: {Math.ceil(remainingDuration / (1000 * 60))} min
        </span>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          border: none;
        }

        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: transparent;
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
} 