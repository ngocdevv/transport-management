import { supabase } from './supabase';
import { User, UserRole } from './types';

export const authConfig = {
  defaultCredentials: {
    username: process.env.NEXT_PUBLIC_DEFAULT_USERNAME || 'admin',
    password: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD || 'admin@123'
  }
};

// Simple authentication for demo purposes
// In production, use proper password hashing and JWT tokens
export async function signIn(username: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // For demo purposes, we'll use simple username/password check
    if (username === authConfig.defaultCredentials.username && password === authConfig.defaultCredentials.password) {
      // Get user from database
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        return { user: null, error: 'User not found' };
      }

      // Store user session in localStorage for demo
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(users));
      }

      return { user: users, error: null };
    } else {
      return { user: null, error: 'Invalid credentials' };
    }
  } catch (error) {
    return { user: null, error: 'Authentication failed' };
  }
}

export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function hasRole(requiredRole: UserRole): boolean {
  const user = getCurrentUser();
  if (!user || !user.role) return false;

  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    manager: 2,
    admin: 3
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

export function checkPermission(permission: keyof import('./types').Permissions): boolean {
  const user = getCurrentUser();
  if (!user || !user.role) return false;

  const { rolePermissions } = require('./types');
  return rolePermissions[user.role][permission];
} 