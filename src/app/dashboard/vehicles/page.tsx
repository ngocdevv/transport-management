'use client';

import { useState } from 'react';
import { Plus, Filter, Search, Truck, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useVehicles, useVehicleTypes, useGPSDevices } from '@/hooks/useVehicles';
import { Vehicle } from '@/lib/types';
import { formatVehicleStatus, getStatusColor, formatDate } from '@/utils/formatting';

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);

  const { vehicles, loading, deleteVehicle } = useVehicles();
  const { vehicleTypes } = useVehicleTypes();
  const { devices } = useGPSDevices();

  // Handle search and filtering
  const filteredVehicles = vehicles.filter(vehicle => {
    // Search term filter
    const matchesSearch = searchTerm === '' ||
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === null || vehicle.status === statusFilter;

    // Type filter
    const matchesType = typeFilter === null || vehicle.vehicle_type_id === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle delete
  const handleDeleteConfirm = async (id: number) => {
    const result = await deleteVehicle(id);
    if (result.success) {
      setShowConfirmDelete(null);
    } else {
      alert('Failed to delete: ' + result.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600">Manage your fleet</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles by plate number or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value === '' ? null : e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select
              value={typeFilter || ''}
              onChange={(e) => setTypeFilter(e.target.value === '' ? null : Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              {vehicleTypes.map(type => (
                <option key={type.id} value={type.id}>{type.type_name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter(null);
                setTypeFilter(null);
                setSearchTerm('');
              }}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading vehicles...</div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-3 rounded-full inline-flex mb-4">
              <Truck className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No vehicles found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || typeFilter ?
                'Try adjusting your filters to see more results' :
                'Add your first vehicle to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GPS Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.license_plate}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vehicle.vehicle_type?.type_name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                        vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {formatVehicleStatus(vehicle.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.gps_device ? (
                        <div>
                          <div>{vehicle.gps_device.device_imei}</div>
                          <div className="text-xs text-gray-400">
                            {vehicle.gps_device.status || 'Unknown status'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No device</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.created_at ? formatDate(new Date(vehicle.created_at)) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {showConfirmDelete === vehicle.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-red-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Confirm?
                          </span>
                          <button
                            onClick={() => handleDeleteConfirm(vehicle.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setShowConfirmDelete(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-3">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowConfirmDelete(vehicle.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 