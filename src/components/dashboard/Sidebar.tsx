"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Route,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { checkPermission } from "@/lib/auth";
import React from "react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    name: "Vehicles",
    href: "/dashboard/vehicles",
    icon: Truck,
    permission: "canViewAllVehicles",
  },
  {
    name: "Live Tracking",
    href: "/dashboard/tracking",
    icon: MapPin,
    permission: "canViewAllVehicles",
  },
  {
    name: "Journey History",
    href: "/dashboard/history",
    icon: Route,
    permission: "canViewAllVehicles",
  },
  {
    name: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
    permission: "canManageUsers",
  },
  {
    name: "GPS Devices",
    href: "/dashboard/admin/devices",
    icon: Settings,
    permission: "canManageDevices",
  },
];

// Memoized NavLink component to prevent unnecessary re-renders
const NavLink = React.memo(
  ({
    item,
    isActive,
    isCollapsed,
  }: {
    item: (typeof navigationItems)[0];
    isActive: boolean;
    isCollapsed: boolean;
  }) => (
    <Link
      href={item.href}
      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
      title={isCollapsed ? item.name : undefined}
      prefetch={true}
    >
      <item.icon
        className={`h-5 w-5 ${isActive ? "text-blue-700" : "text-gray-400"}`}
      />
      {!isCollapsed && <span>{item.name}</span>}
    </Link>
  )
);

NavLink.displayName = "NavLink";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Memoize filtered navigation to prevent recalculation on every render
  const filteredNavigation = useMemo(
    () =>
      navigationItems.filter(
        (item) => !item.permission || checkPermission(item.permission as any)
      ),
    [
      /* depends only on user permissions which don't change during session */
    ]
  );

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  VJM System
                </h1>
                <p className="text-xs text-gray-500">
                  Vehicle Journey Management
                </p>
              </div>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <NavLink
              key={item.name}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
            />
          );
        })}
      </nav>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-300 rounded-full p-2">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.full_name || user.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Sidebar);
