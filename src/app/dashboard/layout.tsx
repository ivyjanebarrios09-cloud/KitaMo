
'use client';

import AuthGuard from '@/components/auth-guard';
import { Sidebar, Header, BottomNavBar } from '@/components/sidebar';
import { useAuth } from '@/context/auth-context';
import { Loader } from '@/components/loader';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { userProfile, loading } = useUserProfile(user?.uid);

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
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 lg:pb-8">
            {children}
          </main>
          <BottomNavBar userProfile={userProfile} />
        </div>
      </div>
    </AuthGuard>
  );
}
