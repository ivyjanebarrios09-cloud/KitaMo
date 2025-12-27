
'use client';

import { User, Lock, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsNavItems = [
  { href: '/dashboard/settings', label: 'Personal Information', icon: User },
  { href: '/dashboard/settings/security', label: 'Account Security', icon: Lock },
  { href: '/dashboard/settings/statements', label: 'Personal Statements', icon: FileText },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-12">
        <div className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <nav className="flex flex-col gap-1 md:col-span-1">
                {settingsNavItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary',
                    pathname === item.href && 'bg-muted text-primary'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                </Link>
                ))}
            </nav>
            <div className="md:col-span-3">{children}</div>
        </div>
    </div>
  );
}
