'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useVehicles } from '@/hooks/useVehicles';
import { Calendar, Download, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { CHART_COLORS } from '@/utils/constants';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week');
  const { vehicles, loading } = useVehicles();

  // Calculate vehicle status distribution for pie chart
  const vehicleStatusData = [
    { name: 'Active', value: vehicles.filter(v => v.status === 'active').length, color: CHART_COLORS.SUCCESS },
    { name: 'Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length, color: CHART_COLORS.WARNING },
    { name: 'Inactive', value: vehicles.filter(v => v.status === 'inactive').length, color: CHART_COLORS.DANGER }
  ];

  // Mock data for vehicle type distribution
  const vehicleTypeData = Array.from(
    vehicles.reduce((acc, vehicle) => {
      const typeName = vehicle.vehicle_type?.type_name || 'Unknown';
      acc.set(typeName, (acc.get(typeName) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }));

  // Mock data for daily distance
  const mockDailyDistanceData = [
    { day: 'Mon', distance: 120 },
    { day: 'Tue', distance: 180 },
    { day: 'Wed', distance: 150 },
    { day: 'Thu', distance: 210 },
    { day: 'Fri', distance: 190 },
    { day: 'Sat', distance: 95 },
    { day: 'Sun', distance: 60 }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and vehicle statistics</p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading reports...</div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Vehicles</h3>
              <p className="text-3xl font-bold text-blue-600">{vehicles.length}</p>
              <p className="text-sm text-gray-500 mt-2">In your fleet</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Active Rate</h3>
              <p className="text-3xl font-bold text-green-600">
                {vehicles.length > 0 ?
                  `${Math.round((vehicles.filter(v => v.status === 'active').length / vehicles.length) * 100)}%` :
                  '0%'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Operational vehicles</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Distance</h3>
              <p className="text-3xl font-bold text-purple-600">1,248 km</p>
              <p className="text-sm text-gray-500 mt-2">In the last {dateRange}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Journeys</h3>
              <p className="text-3xl font-bold text-yellow-600">36</p>
              <p className="text-sm text-gray-500 mt-2">In the last {dateRange}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Chart */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Status</h2>
                  <p className="text-sm text-gray-600">Current fleet status distribution</p>
                </div>
                <PieChartIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {vehicleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} vehicles`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vehicle Type Distribution */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Types</h2>
                  <p className="text-sm text-gray-600">Distribution by vehicle type</p>
                </div>
                <PieChartIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {vehicleTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} vehicles`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Distance Chart */}
            <div className="bg-white rounded-lg shadow lg:col-span-2">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Daily Distance</h2>
                  <p className="text-sm text-gray-600">Total kilometers traveled per day</p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDailyDistanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis unit=" km" />
                    <Tooltip formatter={(value) => [`${value} km`, 'Distance']} />
                    <Legend />
                    <Bar dataKey="distance" name="Distance" fill={CHART_COLORS.PRIMARY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Report Generation Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Custom Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option>Vehicle Usage</option>
                  <option>Distance Summary</option>
                  <option>Maintenance Report</option>
                  <option>Fuel Consumption</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 