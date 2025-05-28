'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { preloadArcGISModules } from '@/utils/arcgisLoader';
import Script from 'next/script';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Preload ArcGIS modules as soon as dashboard mounts
  useEffect(() => {
    preloadArcGISModules();
  }, []);

  // Auth check effect
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else {
        // Set loading to false only after authentication is confirmed
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, loading, router]);

  // Callback for when navigation is complete
  const handleContentLoaded = useCallback(() => {
    // Ensure smooth transitions
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    handleContentLoaded();
  }, [handleContentLoaded, children]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Preload optimization script */}
      <Script id="navigation-optimizer" strategy="afterInteractive">
        {`
          // Preload modules and optimize navigation
          (function() {
            // Add event listeners for navigation links
            document.addEventListener('click', function(e) {
              // Find closest link element
              let target = e.target;
              while (target && target.tagName !== 'A') {
                target = target.parentElement;
              }
              
              // If it's an internal navigation link
              if (target && target.href && target.href.includes(window.location.origin)) {
                // Start preloading ArcGIS modules in background
                if (window.preloadArcGISModules) {
                  window.preloadArcGISModules();
                }
              }
            });
            
            // Store the original pushState function
            const originalPushState = history.pushState;
            
            // Override pushState to detect navigation
            history.pushState = function() {
              // Call the original function
              originalPushState.apply(this, arguments);
              
              // Preload modules on navigation
              if (window.preloadArcGISModules) {
                window.preloadArcGISModules();
              }
            };
          })();
        `}
      </Script>

      {/* Sidebar - memoized to prevent re-renders */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 