
'use client';

import React, { useEffect, useRef, useState } from 'react';
import AuthGuard from '@/components/auth-guard';
import { Header, Sidebar } from '@/components/sidebar';
import { Loader } from '@/components/loader';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { BottomNavBar } from '@/components/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { userProfile, loading } = useUserProfile(user?.uid);
  const isMobile = useIsMobile();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);

  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent || !isMobile) return;

    const handleScroll = () => {
      const currentScrollY = mainContent.scrollTop;
      
      // A small threshold to prevent hiding on minor scrolls
      if (Math.abs(currentScrollY - lastScrollY.current) < 20) {
        return;
      }
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        // Scrolling down
        setIsBottomNavVisible(false);
      } else {
        // Scrolling up
        setIsBottomNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    mainContent.addEventListener('scroll', handleScroll);
    return () => {
      mainContent.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar userProfile={userProfile} />
        <div className="flex-1 flex flex-col relative">
          <Header />
          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-28">
            {children}
          </main>
           {isMobile && (
              <div
                className={cn(
                  'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out',
                  isBottomNavVisible ? 'translate-y-0' : 'translate-y-full'
                )}
              >
                <BottomNavBar userProfile={userProfile} />
              </div>
            )}
        </div>
      </div>
    </AuthGuard>
  );
}
