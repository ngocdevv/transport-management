'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      {children}
    </div>
  );
} 