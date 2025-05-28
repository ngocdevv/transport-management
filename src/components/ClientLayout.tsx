'use client';

import { useEffect, useState, ReactNode, useLayoutEffect } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
}

/**
 * ClientLayout wraps the entire application to handle hydration mismatches
 * caused by browser extensions and other client-specific attributes
 */
export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isClient, setIsClient] = useState(false);

  // Remove any browser extension attributes when component mounts
  useLayoutEffect(() => {
    try {
      const body = document.body;

      // Get all attributes on the body
      const attributeNames = body.getAttributeNames();

      // Identify and remove browser extension attributes
      attributeNames.forEach(attr => {
        // Common patterns of browser extension attributes
        if (
          attr.startsWith('__') ||
          attr.includes('processed') ||
          attr.includes('register') ||
          attr.includes('bis_') ||
          attr.includes('extension')
        ) {
          body.removeAttribute(attr);
        }
      });

      setIsClient(true);
    } catch (error) {
      console.error('Error cleaning up body attributes:', error);
      setIsClient(true);
    }
  }, []);

  // If we're on the server or during first client render, return children directly
  // but mark the entire output for hydration suppression
  if (!isClient) {
    return (
      <div suppressHydrationWarning={true}>
        {children}
      </div>
    );
  }

  // After client has taken over and attributes cleaned up, render normally
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 