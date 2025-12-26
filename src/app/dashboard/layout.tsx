import AuthGuard from '@/components/auth-guard';
import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-secondary/20 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
