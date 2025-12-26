
'use client';

import AuthGuard from '@/components/auth-guard';
import { Sidebar, MobileSidebar, Header } from '@/components/sidebar';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <MobileSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
