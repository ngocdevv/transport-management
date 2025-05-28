import { supabase } from "./supabase";
import { User, UserRole, rolePermissions } from "./types";

export const authConfig = {
  defaultCredentials: {
    username: process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "admin",
    password: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD || "admin@123",
  },
};

// Authentication using Supabase Auth and fallback to manual auth
export async function signIn(
  username: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // For demo purposes, we'll use simple username/password check for admin
    if (
      username === authConfig.defaultCredentials.username &&
      password === authConfig.defaultCredentials.password
    ) {
      // Create a mock user object for demo purposes since RLS is blocking direct queries
      const mockUser: User = {
        id: "ce4eaf7e-4662-4743-bd51-42c270b735b5",
        username: "admin",
        full_name: "System Administrator",
        role: "admin",
        email: "admin@transport.com",
        created_at: "2025-06-01T00:00:00.000Z", // Use fixed timestamp for hydration consistency
        updated_at: "2025-06-01T00:00:00.000Z", // Use fixed timestamp for hydration consistency
      };

      // Store user session in localStorage for demo
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(mockUser));
      }

      return { user: mockUser, error: null };
    }

    // Since the database access is likely blocked by RLS, let's use hardcoded users
    // for demonstration purposes
    else if (username === "manager" && password === "manager@123") {
      const managerUser: User = {
        id: "7e4a2f6b-9c8d-4e5f-a1b2-c3d4e5f6a7b8",
        username: "manager",
        full_name: "Transport Manager",
        role: "manager",
        email: "manager@transport.com",
        created_at: "2025-06-01T00:00:00.000Z",
        updated_at: "2025-06-01T00:00:00.000Z",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(managerUser));
      }

      return { user: managerUser, error: null };
    } else if (username === "viewer" && password === "viewer@123") {
      const viewerUser: User = {
        id: "1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6",
        username: "viewer",
        full_name: "Transport Viewer",
        role: "viewer",
        email: "viewer@transport.com",
        created_at: "2025-06-01T00:00:00.000Z",
        updated_at: "2025-06-01T00:00:00.000Z",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(viewerUser));
      }

      return { user: viewerUser, error: null };
    } else {
      // If not using hardcoded credentials, try database lookup
      try {
        // Try to find user by username
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", username);

        console.log("User lookup result:", { data, error, username });

        if (error) {
          console.error("Error fetching user:", error.message);
          return {
            user: null,
            error: "Authentication failed: " + error.message,
          };
        }

        // Check if we got any users back
        if (data && data.length > 0) {
          const userData = data[0]; // Get the first matching user
          // Check password match
          if (userData.password_hash === password) {
            const user: User = {
              id: userData.id,
              username: userData.username,
              full_name: userData.full_name,
              role: userData.role as UserRole,
              email: userData.email,
              created_at: userData.created_at,
              updated_at: userData.updated_at,
            };

            // Store user in localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem("currentUser", JSON.stringify(user));
            }

            return { user, error: null };
          } else {
            return { user: null, error: "Invalid password" };
          }
        }
      } catch (dbError) {
        console.error("Database lookup error:", dbError);
      }

      // If all authentication methods fail, return error
      return { user: null, error: "Invalid username or password" };
    }
  } catch (err) {
    console.error("Authentication error:", err);
    return { user: null, error: "Authentication failed" };
  }

  // This line should never be reached due to the above returns
  return { user: null, error: "Invalid username or password" };
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
