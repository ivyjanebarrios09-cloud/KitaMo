'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

const Logo = () => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <circle
        cx="14"
        cy="14"
        r="12"
        stroke="hsl(var(--primary) / 0.5)"
        strokeWidth="2"
      />
      <circle cx="14" cy="14" r="9" fill="url(#logo-gradient)" />
    </svg>
  );

export function Header() {
  const { user } = useAuth();

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-card/50 backdrop-blur-sm border-b sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
        <Logo />
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
