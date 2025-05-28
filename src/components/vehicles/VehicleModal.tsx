'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Vehicle, VehicleType, GPSDevice } from '@/lib/types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => void;
  vehicleTypes: VehicleType[];
  devices: (GPSDevice & { vehicle_id?: number | null })[];
  vehicle?: Vehicle | null;
  isLoading: boolean;
}

export default function VehicleModal({
  isOpen,
  onClose,
  onSave,
  vehicleTypes,
  devices,
  vehicle = null,
  isLoading
}: VehicleModalProps) {
  const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>({
    license_plate: '',
    model: '',
    year: new Date().getFullYear(),
    status: 'active',
    vehicle_type_id: vehicleTypes.length > 0 ? vehicleTypes[0].id : null,
    device_id: null
  });

  // Reset form when modal opens/closes or vehicle changes
  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        // Edit mode: populate form with vehicle data
        setFormData({
          license_plate: vehicle.license_plate,
          model: vehicle.model || '',
          year: vehicle.year || new Date().getFullYear(),
          status: vehicle.status || 'active',
          vehicle_type_id: vehicle.vehicle_type_id,
          device_id: vehicle.device_id
        });
      } else {
        // Add mode: reset form
        setFormData({
          license_plate: '',
          model: '',
          year: new Date().getFullYear(),
          status: 'active',
          vehicle_type_id: vehicleTypes.length > 0 ? vehicleTypes[0].id : null,
          device_id: null
        });
      }
    }
  }, [isOpen, vehicle, vehicleTypes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === 'year') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value) : null
      });
    } else if (name === 'vehicle_type_id' || name === 'device_id') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value) : null
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* License Plate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Plate <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. ABC-123"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Toyota Camry"
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status || 'active'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <select
              name="vehicle_type_id"
              value={formData.vehicle_type_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a type</option>
              {vehicleTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.type_name}
                </option>
              ))}
            </select>
          </div>

          {/* GPS Device */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GPS Device
            </label>
            <select
              name="device_id"
              value={formData.device_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No device</option>
              {devices
                .filter(device =>
                  // Show devices that are not assigned to any vehicle or are assigned to this vehicle
                  !device.vehicle_id || (vehicle && device.vehicle_id === vehicle.id)
                )
                .map(device => (
                  <option key={device.id} value={device.id}>
                    {device.device_imei} - {device.status || 'Unknown status'}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (vehicle ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 