'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { BookOpen } from 'lucide-react';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-card/50 backdrop-blur-sm border-b sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
        <BookOpen className="h-6 w-6 text-primary" />
        <span>KitaMo!</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        {!user && (
          <>
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </>
        )}
         {user && (
          <Button asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
