'use client';

import { useState, useEffect, useLayoutEffect, ReactNode, memo } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly component ensures that children are only rendered on the client side.
 * This helps avoid hydration mismatches by not rendering during SSR.
 * Optimized with useLayoutEffect for earlier execution and memoization.
 */
const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
  const [mounted, setMounted] = useState(false);

  // Use useLayoutEffect for earlier execution to minimize flicker
  // Falls back to useEffect on the server
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    setMounted(true);

    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <div className="w-full h-full">{children}</div>;
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ClientOnly); 