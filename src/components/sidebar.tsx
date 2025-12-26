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
  ClipboardList
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


const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
];

const roomNavItems = [
    { href: '', label: 'Dashboard', icon: Home, exact: true},
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
  ];


  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r flex flex-col">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <BookOpen className="h-6 w-6 text-primary" />
          <span>KitaMo!</span>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-4 space-y-1">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-card-foreground/80 transition-all hover:bg-primary/10 hover:text-primary',
              pathname === item.href &&
                'bg-primary/20 text-primary font-semibold'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}

        <Collapsible open={isRoomsOpen} onOpenChange={setIsRoomsOpen}>
            <CollapsibleTrigger className="w-full">
                 <Link
                    href="/dashboard/rooms"
                    className={cn(
                        'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-card-foreground/80 transition-all hover:bg-primary/10 hover:text-primary',
                        pathname.startsWith('/dashboard/rooms') && 'bg-primary/20 text-primary font-semibold'
                    )}
                    >
                    <div className="flex items-center gap-3">
                        <Archive className="h-5 w-5" />
                        <span>Rooms</span>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 transition-transform", isRoomsOpen && "rotate-180")} />
                </Link>
            </CollapsibleTrigger>
            <CollapsibleContent className="py-1 pl-6">
                {isRoomRoute && roomSubNavItems.map((item) => {
                    const roomId = pathname.split('/')[3];
                    const itemPath = `/dashboard/rooms/${roomId}${item.href}`
                    return (
                        <Link
                            key={item.label}
                            href={itemPath}
                            className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-card-foreground/70 transition-all hover:bg-primary/10 hover:text-primary text-sm',
                            pathname === itemPath && 'bg-primary/10 text-primary font-medium'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </CollapsibleContent>
        </Collapsible>

      </nav>
      <div className="p-4 border-t mt-auto">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto px-2 py-2 text-left">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${user.email}.png`}
                      alt={user.email!}
                    />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 overflow-hidden">
                    <p className="text-sm font-medium leading-none truncate">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Chairperson
                    </p>
                  </div>
                </div>
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
  );
}
