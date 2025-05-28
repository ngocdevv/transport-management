import { supabase } from "./supabase";
import { User, UserRole, rolePermissions } from "./types";

export const authConfig = {
  defaultCredentials: {
    username: process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "admin",
    password: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD || "admin@123",
  },
};

// Authentication using Supabase Auth
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Use Supabase's built-in authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });


    if (error) {
      console.error("Authentication error:", error.message);
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: "User not found" };
    }

    // Fetch additional user data including role from the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError.message);
      return { user: null, error: "Failed to fetch user profile" };
    }

    // Create user object with role information
    const user: User = {
      id: data.user.id,
      username: userData.username || data.user.email?.split('@')[0] || '',
      full_name: userData.full_name || data.user.user_metadata?.full_name || '',
      role: userData.role as UserRole,
      email: data.user.email || '',
      created_at: data.user.created_at || new Date().toISOString(),
      updated_at: userData.updated_at || new Date().toISOString(),
    };

    // Store user in localStorage for easy access
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user));
    }

    return { user, error: null };
  } catch (err) {
    console.error("Authentication error:", err);
    return { user: null, error: "Authentication failed" };
  }
}

export async function signOut(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser");
  }
  await supabase.auth.signOut();
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const userStr = localStorage.getItem("currentUser");
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
    admin: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

export function checkPermission(
  permission: keyof import("./types").Permissions
): boolean {
  const user = getCurrentUser();
  if (!user || !user.role) return false;

  return rolePermissions[user.role][permission];
}
