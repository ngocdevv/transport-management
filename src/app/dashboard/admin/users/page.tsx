'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Search, User, Shield, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as UserType, UserRole } from '@/lib/types';
import { formatUserRole, formatDate } from '@/utils/formatting';
import { useAuth } from '@/hooks/useAuth';
import { checkPermission } from '@/lib/auth';

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const { user: currentUser } = useAuth();
  const router = useRouter();

  // Check permission
  useEffect(() => {
    if (!checkPermission('canManageUsers')) {
      router.push('/dashboard');
    }
  }, [router]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle search and filtering
  const filteredUsers = users.filter(user => {
    // Search term filter
    const matchesSearch = searchTerm === '' ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === '' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Handle delete
  const handleDeleteConfirm = async (id: string) => {
    try {
      // Don't allow deleting yourself
      if (id === currentUser?.id) {
        alert("You cannot delete your own account");
        return;
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setUsers(users.filter(user => user.id !== id));
      setShowConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users and permissions</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="manager">Managers</option>
              <option value="viewer">Viewers</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setRoleFilter('');
                setSearchTerm('');
              }}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading users...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-3 rounded-full inline-flex mb-4">
              <User className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter ?
                'Try adjusting your filters to see more results' :
                'Add your first user to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 p-2 rounded-full mr-3">
                          <User className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Unnamed User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            @{user.username || 'no-username'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className={`h-4 w-4 mr-1 ${user.role === 'admin' ? 'text-purple-500' :
                          user.role === 'manager' ? 'text-blue-500' :
                            'text-green-500'
                          }`} />
                        <span className="text-sm font-medium">
                          {formatUserRole(user.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? formatDate(new Date(user.created_at)) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {showConfirmDelete === user.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-red-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Confirm?
                          </span>
                          <button
                            onClick={() => handleDeleteConfirm(user.id)}
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
                            onClick={() => setShowConfirmDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={user.id === currentUser?.id}
                            title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 className={`h-4 w-4 ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`} />
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

      {/* Roles & Permissions Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles & Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium text-purple-800">Administrator</h3>
            </div>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Full system access</li>
              <li>• User management</li>
              <li>• Vehicle management</li>
              <li>• GPS device management</li>
              <li>• Reports and data export</li>
            </ul>
          </div>

          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-800">Manager</h3>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Vehicle management</li>
              <li>• Vehicle tracking</li>
              <li>• Reports and data export</li>
              <li>• Cannot manage users</li>
              <li>• Cannot manage GPS devices</li>
            </ul>
          </div>

          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-green-800">Viewer</h3>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• View vehicle locations</li>
              <li>• View journey history</li>
              <li>• Read-only access</li>
              <li>• Cannot modify any data</li>
              <li>• Cannot export data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 