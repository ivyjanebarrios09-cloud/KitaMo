
'use client';

import AuthGuard from '@/components/auth-guard';
import { Sidebar, MobileSidebar, Header, BottomNavBar } from '@/components/sidebar';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <MobileSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col relative">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 lg:pb-8">
            {children}
          </main>
          <BottomNavBar />
        </div>
      </div>
    </AuthGuard>
  );
}
