
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
  Menu,
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
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';


const sidebarNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/rooms', icon: Archive, label: 'Rooms' },
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

function NavContent() {
    const pathname = usePathname();
    const isRoomRoute = pathname.startsWith('/dashboard/rooms/');
    const roomId = isRoomRoute ? pathname.split('/')[3] : null;

    return (
        <>
         {sidebarNavItems.map((item) => (
            <Link
                key={item.label}
                href={item.href}
                className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                ((item.href === '/dashboard' && pathname === item.href) || (item.href !== '/dashboard' && pathname.startsWith(item.href))) && 'bg-muted text-primary'
                )}
            >
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
            </Link>
            ))}
            {isRoomRoute && roomId && (
                 <div className="pl-4 mt-2 space-y-1 border-l ml-3">
                 <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase">Room Menu</p>
                 {roomSubNavItems.map((item) => {
                   const itemPath = `/dashboard/rooms/${roomId}${item.href}`;
                   const isActive = item.href === '' ? pathname === itemPath : pathname.startsWith(itemPath);
                   return (
                     <Link
                       key={item.label}
                       href={itemPath}
                       className={cn(
                         'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm',
                         isActive && 'bg-muted text-primary'
                       )}
                     >
                       <item.icon className="h-4 w-4" />
                       <span className="truncate">{item.label}</span>
                     </Link>
                   );
                 })}
               </div>
            )}
        </>
    )
}


export function Sidebar() {
  const { user, logout } = useAuth();
  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <aside className="w-64 bg-card border-r flex flex-col h-full">
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <BookOpen className="h-6 w-6 text-primary" />
          <span>KitaMo!</span>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-4 space-y-2">
        <NavContent />
      </nav>
      <div className="p-4 border-t mt-auto">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${user.email}.png`}
                    alt={user.email!}
                  />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-medium leading-none truncate">Hello!</span>
                    <span className="text-xs text-muted-foreground leading-none truncate">{user.email}</span>
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

export function MobileSidebar({isSidebarOpen, setSidebarOpen}: {isSidebarOpen: boolean, setSidebarOpen: (open: boolean) => void}) {
    return (
        <div className="lg:hidden">
             <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="flex flex-col p-0 w-72">
                    <Sidebar />
                </SheetContent>
            </Sheet>
        </div>
    )
}

export function Header({onMenuClick}: {onMenuClick: () => void}) {
    const { user, logout } = useAuth();
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-16 lg:px-6 sticky top-0 z-30">
            <div className="lg:hidden">
                <Button variant="outline" size="icon" onClick={onMenuClick}>
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </div>
            <div className="w-full flex-1">
                {/* Optional: Add search or other header elements here */}
            </div>
            <div className="hidden lg:block">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${user.email}.png`}
                          alt={user.email!}
                        />
                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
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
        </header>
    )
}

export function BottomNavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';

  const isRoomRoute = pathname.startsWith('/dashboard/rooms/');
  const roomId = isRoomRoute ? pathname.split('/')[3] : null;

  let navItems = sidebarNavItems;

  if (isRoomRoute && roomId) {
    // In a room, we show room-specific nav, plus a back button
    navItems = roomSubNavItems.map(item => ({
        ...item,
        href: `/dashboard/rooms/${roomId}${item.href}`
    })).slice(0, 4); // Limit to 4 for bottom nav
  }


  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
            const isActive = (item.href === '/dashboard' && pathname === item.href) || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
                <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                    'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-all w-full h-full',
                    isActive && 'text-primary bg-muted/50'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs truncate">{item.label}</span>
                </Link>
            )
        })}
         {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-full h-full cursor-pointer">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${user.email}.png`}
                      alt={user.email!}
                    />
                    <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">Profile</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Hello!</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}