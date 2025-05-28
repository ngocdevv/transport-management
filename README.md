# Vehicle Journey Management System

A comprehensive web application for tracking and managing vehicle journeys using 2D Geographic Information System (GIS) technology. Built with Next.js, Supabase, and ArcGIS Maps SDK.

## 🚀 Features

### Core Functionality
- **Real-time Vehicle Tracking**: Live GPS tracking with ArcGIS Maps integration
- **Journey History & Playback**: Temporal data visualization with time slider controls
- **Role-based Access Control**: Admin, Manager, and Viewer roles with different permissions
- **Vehicle Management**: CRUD operations for vehicles, GPS devices, and vehicle types
- **Interactive Dashboard**: Statistics, live map, and recent activity overview

### Technical Highlights
- **GIS Integration**: PostGIS database with ArcGIS Maps SDK for JavaScript
- **Temporal Data**: Time-based journey playback with speed controls
- **Real-time Updates**: Supabase real-time subscriptions for live tracking
- **Responsive Design**: Modern UI with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## 🛠 Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **ArcGIS Maps SDK** - Professional mapping and GIS capabilities
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization (ready for reports)

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **PostGIS** - Spatial database extension for geographic data
- **Supabase Auth** - Authentication and authorization
- **Real-time Subscriptions** - Live data updates

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (database is already configured)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd transport-management
npm install
```

### 2. Environment Setup
The environment variables are already configured in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ycxsbhpfxjjoqemfbkux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_DEFAULT_USERNAME=admin
NEXT_PUBLIC_DEFAULT_PASSWORD=admin@123
```

### 3. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## 🔐 Demo Credentials

### Default Admin Account
- **Username**: `admin`
- **Password**: `admin@123`
- **Role**: Administrator (full access)

### Additional Test Users
- **Manager**: `manager1` / `admin@123` (vehicle management, reports)
- **Viewer**: `viewer1` / `admin@123` (read-only access)

## 📊 Database Schema

The system uses a PostgreSQL database with PostGIS extension:

### Core Tables
- **users** - User accounts with role-based permissions
- **vehicles** - Vehicle information and status
- **vehicle_types** - Vehicle classification (Truck, Van, Car, Bus, Motorcycle)
- **gps_devices** - GPS device management
- **track_points** - GPS tracking data with PostGIS geometry
- **journeys** - Trip summaries and analytics

### Sample Data
The database includes sample data:
- 5 vehicles with different types and statuses
- GPS tracking points around Hanoi area
- Real-time position updates

## 🗺 Map Features

### ArcGIS Integration
- **Basemaps**: Streets, Satellite, Hybrid, Topographic
- **Vehicle Markers**: Real-time position indicators
- **Route Visualization**: Journey path display
- **Interactive Popups**: Vehicle information on click

### Temporal Controls
- **Time Slider**: Journey playback with timeline
- **Speed Control**: 0.5x to 10x playback speed
- **Step Controls**: Frame-by-frame navigation
- **Progress Tracking**: Visual progress indicator

## 👥 User Roles & Permissions

### Administrator
- ✅ User management
- ✅ Vehicle CRUD operations
- ✅ GPS device management
- ✅ View all data and reports
- ✅ Export capabilities

### Manager
- ❌ User management
- ✅ Vehicle management
- ✅ View tracking data
- ✅ Generate reports
- ✅ Export data

### Viewer
- ❌ Management functions
- ✅ View vehicles and tracking
- ❌ Reports and exports
- ❌ Data modifications

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/login/        # Authentication pages
│   ├── dashboard/         # Main application
│   └── page.tsx           # Root redirect
├── components/            # React components
│   ├── maps/             # ArcGIS map components
│   ├── dashboard/        # Layout components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication
│   ├── useVehicles.ts    # Vehicle management
│   └── useTracking.ts    # GPS tracking
├── lib/                  # Core utilities
│   ├── supabase.ts       # Database client
│   ├── auth.ts           # Auth helpers
│   └── types.ts          # TypeScript definitions
└── utils/                # Helper functions
    ├── geometry.ts       # GIS calculations
    ├── formatting.ts     # Data formatting
    └── constants.ts      # App constants
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Key Development Notes
- ArcGIS components are dynamically imported to avoid SSR issues
- PostGIS geometry is converted to GeoJSON for frontend use
- Real-time subscriptions handle live vehicle position updates
- Role-based routing protects admin functions

## 🌟 Key Features Walkthrough

### 1. Dashboard Overview
- Vehicle statistics cards
- Live tracking map with real-time positions
- Vehicle status list with last seen times
- Recent activity feed

### 2. Journey History & Playback
- Select vehicle and date range
- Interactive time slider with playback controls
- Route visualization on map
- Speed and progress indicators

### 3. Vehicle Management
- Add/edit/delete vehicles
- Assign GPS devices
- Status management (Active/Maintenance/Inactive)
- Vehicle type classification

### 4. Real-time Tracking
- Live vehicle positions
- Automatic map updates
- Position history trails
- Speed and heading information

## 🔮 Future Enhancements

### Planned Features
- **Geofencing**: Virtual boundaries and alerts
- **Reports Dashboard**: Analytics and insights
- **Mobile App**: React Native companion
- **Advanced Analytics**: Machine learning insights
- **Fleet Optimization**: Route planning and optimization

### Technical Improvements
- **Caching**: Redis for performance
- **Microservices**: API decomposition
- **Testing**: Comprehensive test suite
- **CI/CD**: Automated deployment pipeline

## 📝 License

This project is built for educational and demonstration purposes as part of a Vehicle Journey Management System thesis.

## 🤝 Contributing

This is a thesis project, but feedback and suggestions are welcome!

## 📞 Support

For questions or issues, please refer to the documentation or create an issue in the repository.

---

**Built with ❤️ using Next.js, Supabase, and ArcGIS**
