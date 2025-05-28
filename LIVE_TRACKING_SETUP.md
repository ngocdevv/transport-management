# Live Tracking System Setup Guide

This guide will help you set up the comprehensive live tracking system with real-time geospatial data, PostGIS, and interactive map UIs.

## 🏗️ Architecture Overview

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL + PostGIS + Realtime)
- **Maps**: ArcGIS Maps SDK for JavaScript
- **Real-time**: Supabase Realtime subscriptions
- **Dev Mode**: Random position generation via Edge Functions

## 📋 Prerequisites

- Node.js 18+ and yarn/npm
- Supabase account and project
- Basic understanding of PostgreSQL and PostGIS

## 🚀 Setup Instructions

### 1. Database Setup

#### Apply Database Schema
Run the SQL scripts in order on your Supabase project:

```bash
# 1. Create tables, indexes, and functions
psql -h your-db-host -U postgres -d postgres -f sql/01_schema.sql

# 2. Set up Row-Level Security policies
psql -h your-db-host -U postgres -d postgres -f sql/02_rls_policies.sql

# 3. Insert seed data for testing
psql -h your-db-host -U postgres -d postgres -f sql/03_seed_data.sql
```

Or use the Supabase SQL Editor to run each script manually.

#### Key Database Features
- **PostGIS Extension**: Enabled for geospatial operations
- **Optimized Indexes**: GIST indexes on geography columns for fast spatial queries
- **Materialized Views**: `mv_latest_vehicle_positions` for high-performance live tracking
- **RLS Policies**: Multi-tenant security with role-based access control
- **Helper Functions**: Distance calculations, bounding box queries, latest positions

### 2. Edge Function Deployment

Deploy the position generator Edge Function:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the Edge Function
supabase functions deploy generate-positions
```

### 3. Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Install Dependencies

```bash
yarn install
# or
npm install
```

### 5. Run the Application

```bash
yarn dev
# or
npm run dev
```

## 🎯 Features

### 1. Live Position Display
- Real-time vehicle tracking with <1 second latency
- Automatic position updates via Supabase Realtime
- Interactive map with vehicle markers and status indicators
- Connection status monitoring

### 2. Movement History
- Complete position history with timestamps
- Journey replay with temporal controls
- Route visualization and statistics
- Historical data analysis

### 3. Development Mode
- Random position generator for testing
- Realistic movement patterns within Singapore bounds
- Configurable update intervals
- Manual position generation controls

### 4. Performance Optimizations
- Materialized views for fast queries
- Optimized PostGIS indexes
- React.memo for component optimization
- RequestAnimationFrame for smooth map updates

## 🗺️ Usage Guide

### Live Tracking Page (`/dashboard/tracking`)

1. **Vehicle Selection**
   - Select vehicles to track from the sidebar
   - Use "Select All", "Deselect All", or "Active Only" buttons
   - Real-time connection status indicator

2. **Map Controls**
   - Start/Pause tracking
   - Change basemap (Streets, Satellite, Hybrid, Topographic)
   - Auto-zoom to fit all vehicles
   - Manual refresh

3. **Development Mode**
   - Enable "Dev Mode" checkbox
   - Click "Generate" to create random positions
   - Automatic position generation every 3 seconds

4. **Recent Updates**
   - View latest position updates
   - Vehicle speed and coordinates
   - Timestamp information

### Journey History Page (`/dashboard/tracking/history`)

1. **Vehicle & Date Selection**
   - Choose vehicle from dropdown
   - Set date/time range for journey data

2. **Journey Visualization**
   - Route displayed on map
   - Journey statistics (distance, duration, average speed)
   - Temporal playback controls

3. **Time Slider**
   - Play/pause journey replay
   - Adjust playback speed
   - Seek to specific time points

## 🔧 Configuration

### Live Tracking Configuration

Modify `src/lib/types.ts` to adjust default settings:

```typescript
export const DEFAULT_LIVE_TRACKING_CONFIG: LiveTrackingConfig = {
  updateInterval: 2000, // 2 seconds
  maxHistoryPoints: 100,
  autoRefresh: true,
  devMode: false,
  singaporeBounds: {
    minLat: 1.2,
    maxLat: 1.5,
    minLon: 103.6,
    maxLon: 104.0
  }
};
```

### Map Configuration

Update `src/utils/constants.ts` for map settings:

```typescript
export const MAP_CONFIG = {
  BASEMAPS: {
    STREETS: 'streets',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TOPO: 'topo'
  },
  DEFAULT_CENTER: [103.8518, 1.2966], // Singapore
  DEFAULT_ZOOM: 11
};
```

## 🔒 Security Features

### Row-Level Security (RLS)
- **Admin**: Full access to all data
- **Manager**: Can manage vehicles and view all tracking data
- **Viewer**: Read-only access to vehicle positions

### Multi-tenant Support
- User-based data isolation
- Role-based permissions
- Secure API endpoints

## 📊 Database Schema

### Core Tables
- `vehicles`: Vehicle information and status
- `track_points`: GPS positions with PostGIS geography
- `journeys`: Trip aggregation data
- `live_tracking_sessions`: Active tracking sessions
- `users`: User accounts with roles

### Optimized Views
- `latest_vehicle_positions`: Real-time position view
- `mv_latest_vehicle_positions`: Materialized view for performance

### Key Functions
- `get_latest_position(vehicle_id)`: Get latest position for a vehicle
- `get_vehicles_in_bounds(bounds)`: Spatial bounding box query
- `calculate_distance(lat1, lon1, lat2, lon2)`: Distance calculation
- `refresh_latest_positions()`: Refresh materialized view

## 🚨 Troubleshooting

### Common Issues

1. **Real-time not working**
   - Check Supabase project settings
   - Verify RLS policies allow real-time access
   - Ensure proper authentication

2. **Map not loading**
   - Verify ArcGIS API key (if required)
   - Check browser console for errors
   - Ensure proper HTTPS setup

3. **Position generation failing**
   - Check Edge Function deployment
   - Verify environment variables
   - Review function logs in Supabase dashboard

4. **Performance issues**
   - Refresh materialized view: `SELECT refresh_latest_positions();`
   - Check database indexes
   - Monitor query performance

### Performance Monitoring

```sql
-- Check materialized view freshness
SELECT schemaname, matviewname, last_refresh 
FROM pg_stat_user_tables 
WHERE relname = 'mv_latest_vehicle_positions';

-- Monitor real-time subscriptions
SELECT * FROM pg_stat_subscription;

-- Check spatial index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM track_points 
WHERE ST_DWithin(geom, ST_MakePoint(103.8518, 1.2966)::geography, 1000);
```

## 🔄 Maintenance

### Regular Tasks
1. **Refresh Materialized View**: Set up a cron job to refresh every minute
2. **Clean Old Data**: Archive old track points to maintain performance
3. **Monitor Disk Usage**: PostGIS data can grow quickly
4. **Update Statistics**: Run `ANALYZE` on tables regularly

### Backup Strategy
- Regular database backups including spatial data
- Export critical configuration data
- Document custom functions and triggers

## 📈 Scaling Considerations

### High Traffic Scenarios
- Consider read replicas for heavy read workloads
- Implement connection pooling
- Use CDN for static map tiles
- Partition large tables by date

### Real-time Performance
- Monitor WebSocket connection limits
- Implement client-side buffering
- Consider message queuing for high-frequency updates

## 🤝 Contributing

1. Follow TypeScript best practices
2. Maintain PostGIS spatial index performance
3. Test real-time functionality thoroughly
4. Document any new database functions
5. Ensure RLS policies are properly configured

## 📚 Additional Resources

- [PostGIS Documentation](https://postgis.net/docs/)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [ArcGIS Maps SDK](https://developers.arcgis.com/javascript/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

For questions or issues, please check the troubleshooting section or create an issue in the repository. 