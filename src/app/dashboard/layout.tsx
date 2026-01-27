
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
  const lastScrollY = useRef(0);
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-10">
            {children}
          </main>
           {isMobile && (
              <div
                className={cn(
                  'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out',
                  showNav ? 'translate-y-0' : 'translate-y-full'
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
