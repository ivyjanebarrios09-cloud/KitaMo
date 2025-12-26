'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  LogOut,
  User as UserIcon,
  Archive,
  Wallet,
  Calendar,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const navItems = [{ href: '/dashboard', icon: Home, label: 'Home' }];

const roomNavItems = [
  { href: '', label: 'Dashboard', icon: Home, exact: true },
  { href: '/announcement', label: 'Announcement', icon: BookOpen },
  { href: '/expenses', label: 'Expenses', icon: Archive },
  { href: '/fund-deadlines', label: 'Fund Deadlines', icon: Archive },
  { href: '/students', label: 'Students', icon: UserIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';
  const isRoomRoute = pathname.startsWith('/dashboard/rooms/');
  const [isRoomsOpen, setIsRoomsOpen] = React.useState(true);

  const sidebarNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
  ];

  const roomSubNavItems = [
    { href: '', label: 'Room Dashboard', icon: Home },
    { href: '/announcement', label: 'Announcement', icon: BookOpen },
    { href: '/expenses', label: 'Expenses', icon: Wallet },
    { href: '/fund-deadlines', label: 'Fund Deadlines', icon: Calendar },
    { href: '/students', label: 'Students', icon: UserIcon },
    { href: '/statements', label: 'Statements', icon: ClipboardList },
    { href: '/analytics', label: 'Expense Analytics', icon: BarChart3 },
  ];

  return (
    <TooltipProvider>
      <aside className="w-20 flex-shrink-0 bg-card border-r flex flex-col items-center">
        <div className="h-16 flex items-center justify-center px-6 border-b w-full">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <BookOpen className="h-6 w-6 text-primary" />
          </Link>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-2 w-full">
          {sidebarNavItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center h-12 w-12 rounded-lg text-card-foreground/80 transition-all hover:bg-primary/10 hover:text-primary',
                    pathname === item.href &&
                      'bg-primary/20 text-primary font-semibold'
                  )}
                >
                  <item.icon className="h-6 w-6" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <Collapsible open={isRoomsOpen} onOpenChange={setIsRoomsOpen}>
            <CollapsibleTrigger className="w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/rooms"
                    className={cn(
                      'flex items-center justify-center h-12 w-12 mx-auto rounded-lg text-card-foreground/80 transition-all hover:bg-primary/10 hover:text-primary',
                      pathname.startsWith('/dashboard/rooms') &&
                        'bg-primary/20 text-primary font-semibold'
                    )}
                  >
                    <Archive className="h-6 w-6" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Rooms</p>
                </TooltipContent>
              </Tooltip>
            </CollapsibleTrigger>
            <CollapsibleContent className="py-2 space-y-2">
              {isRoomRoute &&
                roomSubNavItems.map((item) => {
                  const roomId = pathname.split('/')[3];
                  const itemPath = `/dashboard/rooms/${roomId}${item.href}`;
                  return (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <Link
                          href={itemPath}
                          className={cn(
                            'flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-card-foreground/70 transition-all hover:bg-primary/10 hover:text-primary text-sm',
                            pathname === itemPath &&
                              'bg-primary/10 text-primary font-medium'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
            </CollapsibleContent>
          </Collapsible>
        </nav>
        <div className="p-2 border-t mt-auto">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 w-12 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${user.email}.png`}
                      alt={user.email!}
                    />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Hello!</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
