'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Settings, AlertTriangle, Edit, Trash2, Wifi, WifiOff, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GPSDevice, Vehicle } from '@/lib/types';
import { formatDate } from '@/utils/formatting';
import { useAuth } from '@/hooks/useAuth';
import { checkPermission } from '@/lib/auth';

export default function DevicesPage() {
  const [devices, setDevices] = useState<(GPSDevice & { vehicle?: Vehicle | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);

  const { user: currentUser } = useAuth();
  const router = useRouter();

  // Check permission
  useEffect(() => {
    if (!checkPermission('canManageDevices')) {
      router.push('/dashboard');
    }
  }, [router]);

  // Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        // Get devices with their associated vehicles
        const { data, error } = await supabase
          .from('gps_devices')
          .select(`
            *,
            vehicle:vehicles(*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setDevices(data || []);
      } catch (err) {
        console.error('Error fetching GPS devices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Handle search and filtering
  const filteredDevices = devices.filter(device => {
    // Search term filter
    const matchesSearch = searchTerm === '' ||
      device.device_imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.sim_number && device.sim_number.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === null || device.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle delete
  const handleDeleteConfirm = async (id: number) => {
    try {
      // Check if device is assigned to a vehicle
      const deviceToDelete = devices.find(d => d.id === id);
      if (deviceToDelete?.vehicle) {
        alert("Cannot delete device that is assigned to a vehicle. Please unassign the device first.");
        setShowConfirmDelete(null);
        return;
      }

      const { error } = await supabase
        .from('gps_devices')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setDevices(devices.filter(device => device.id !== id));
      setShowConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting device:', err);
      alert('Failed to delete GPS device');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GPS Devices</h1>
          <p className="text-gray-600">Manage tracking devices</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by IMEI or SIM number..."
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
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter(null);
                setSearchTerm('');
              }}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading GPS devices...</div>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-3 rounded-full inline-flex mb-4">
              <Settings className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No devices found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter ?
                'Try adjusting your filters to see more results' :
                'Add your first GPS device to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SIM Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Install Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevices.map(device => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${device.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {device.status === 'active' || device.status === 'maintenance' ? (
                            <Wifi className="h-5 w-5 text-green-600" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {device.device_imei}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {device.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${device.status === 'active' ? 'bg-green-100 text-green-800' :
                        device.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          device.status === 'offline' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {device.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.sim_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {device.vehicle ? (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {device.vehicle.license_plate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.install_date ? formatDate(new Date(device.install_date)) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {showConfirmDelete === device.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-red-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Confirm?
                          </span>
                          <button
                            onClick={() => handleDeleteConfirm(device.id)}
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
                            onClick={() => setShowConfirmDelete(device.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={!!device.vehicle}
                            title={device.vehicle ? "Unassign from vehicle first" : "Delete device"}
                          >
                            <Trash2 className={`h-4 w-4 ${device.vehicle ? 'opacity-50 cursor-not-allowed' : ''}`} />
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

      {/* Device Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Status Definitions</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm"><strong>Active:</strong> Device is online and transmitting data</span>
              </li>
              <li className="flex items-center">
                <span className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span>
                <span className="text-sm"><strong>Maintenance:</strong> Device is being serviced or repaired</span>
              </li>
              <li className="flex items-center">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                <span className="text-sm"><strong>Offline:</strong> Device is not communicating with the system</span>
              </li>
              <li className="flex items-center">
                <span className="h-2 w-2 bg-gray-500 rounded-full mr-2"></span>
                <span className="text-sm"><strong>Inactive:</strong> Device is not currently assigned or in use</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Device Management Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Devices must be unassigned from vehicles before deletion</li>
              <li>• Regular maintenance ensures accurate GPS data</li>
              <li>• Check SIM card balance to maintain connectivity</li>
              <li>• Offline devices may require physical inspection</li>
              <li>• Each device has a unique IMEI number for identification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 