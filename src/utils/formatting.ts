// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(2)}km`;
}

// Format speed for display
export function formatSpeed(speedKmh: number | null): string {
  if (speedKmh === null) return 'N/A';
  return `${speedKmh.toFixed(1)} km/h`;
}

// Format duration in minutes to human readable format
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return `${days}d ${remainingHours}h`;
}

// Format timestamp for display
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Format time for display
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Format coordinates for display
export function formatCoordinates(coordinates: [number, number]): string {
  const [lon, lat] = coordinates;
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

// Format vehicle status for display
export function formatVehicleStatus(status: string | null): string {
  if (!status) return 'Unknown';

  const statusMap: Record<string, string> = {
    active: 'Active',
    maintenance: 'Maintenance',
    inactive: 'Inactive'
  };

  return statusMap[status] || status;
}

// Format vehicle status with color class
export function getStatusColor(status: string | null): string {
  if (!status) return 'text-gray-500';

  const colorMap: Record<string, string> = {
    active: 'text-green-600',
    maintenance: 'text-yellow-600',
    inactive: 'text-red-600'
  };

  return colorMap[status] || 'text-gray-500';
}

// Format user role for display
export function formatUserRole(role: string | null): string {
  if (!role) return 'Unknown';

  const roleMap: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    viewer: 'Viewer'
  };

  return roleMap[role] || role;
}

// Format number with thousands separator
export function formatNumber(num: number): string {
  return num.toLocaleString('vi-VN');
}

// Format percentage
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Format file size
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(date);
} 