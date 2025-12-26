

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LogOut,
  User as UserIcon,
  Archive,
  Wallet,
  Calendar,
  ClipboardList,
  BarChart3,
  Menu,
  Settings,
  BookOpen,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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

function NavContent({ isMobile = false }: { isMobile?: boolean }) {
    const pathname = usePathname();
    const isRoomRoute = pathname.startsWith('/dashboard/rooms/');
    const roomId = isRoomRoute ? pathname.split('/')[3] : null;

    const renderLink = (item: any, isSubItem = false) => {
      const href = isSubItem && roomId ? `/dashboard/rooms/${roomId}${item.href}` : item.href;
      const isActive = isSubItem
        ? (item.href === '' ? pathname === href : pathname.startsWith(href))
        : ((item.href === '/dashboard' && pathname === item.href) || (item.href !== '/dashboard' && pathname.startsWith(item.href)));

      const linkContent = (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            isActive && 'bg-muted text-primary',
            isMobile && 'justify-start',
            !isMobile && 'justify-center'
          )}
        >
          <item.icon className="h-5 w-5" />
          {!isMobile ? null : <span className="truncate">{item.label}</span>}
        </div>
      );

      if (isMobile) {
        return <Link key={item.label} href={href}>{linkContent}</Link>;
      }

      return (
        <TooltipProvider key={item.label} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={href}>
                {linkContent}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    };

    return (
        <>
         {sidebarNavItems.map((item) => renderLink(item))}
            {isRoomRoute && roomId && (
                 <div className={cn("mt-2 space-y-1", !isMobile && "border-t pt-2")}>
                 {!isMobile && <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase text-center">Room</p>}
                 {isMobile && <div className="pl-4 mt-2 space-y-1 border-l ml-3"><p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase">Room Menu</p></div>}
                 <div className={cn(isMobile && "pl-4 mt-2 space-y-1 border-l ml-3")}>
                    {roomSubNavItems.map((item) => renderLink(item, true))}
                 </div>
               </div>
            )}
        </>
    )
}


export function Sidebar({isMobileSheet = false}: {isMobileSheet?: boolean}) {
  const { user, logout } = useAuth();
  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';
  const chairpersonName = user?.displayName || user?.email?.split('@')[0] || 'Chairperson';

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-center px-6 border-b">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <Logo />
          {isMobileSheet && <span>KitaMo!</span>}
        </Link>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-2">
        <NavContent isMobile={isMobileSheet}/>
      </nav>
      <div className="p-2 border-t mt-auto">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full justify-center p-0", isMobileSheet ? "h-auto" : "h-12 w-12")}>
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${user.email}.png`}
                    alt={user.email!}
                  />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                {isMobileSheet && (
                    <div className="flex flex-col items-start overflow-hidden ml-2">
                        <span className="text-sm font-medium leading-none truncate">{chairpersonName}</span>
                        <span className="text-xs text-muted-foreground leading-none truncate">{user.email}</span>
                    </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{chairpersonName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
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
    </>
  );

  if (isMobileSheet) {
    return <div className="flex flex-col h-full bg-card">{sidebarContent}</div>
  }

  return (
    <aside className="w-20 bg-card border-r flex-col h-full hidden lg:flex">
      {sidebarContent}
    </aside>
  );
}

export function MobileSidebar({isSidebarOpen, setSidebarOpen}: {isSidebarOpen: boolean, setSidebarOpen: (open: boolean) => void}) {
    return (
        <div className="lg:hidden">
             <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="flex flex-col p-0 w-72">
                    <Sidebar isMobileSheet={true} />
                </SheetContent>
            </Sheet>
        </div>
    )
}

export function Header({onMenuClick}: {onMenuClick: () => void}) {
    const { user, logout } = useAuth();
    const chairpersonName = user?.displayName || user?.email?.split('@')[0] || 'Chairperson';
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
            <div className="flex items-center gap-4">
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
                        <p className="text-sm font-medium leading-none">{chairpersonName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
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
  const chairpersonName = user?.displayName || user?.email?.split('@')[0] || 'Chairperson';

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
            const isActive = item.href === ''
                ? pathname === `/dashboard/rooms/${roomId}`
                : (item.href === '/dashboard' && pathname === item.href) || (item.href !== '/dashboard' && pathname.startsWith(item.href));
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
                  <p className="text-sm font-medium leading-none">{chairpersonName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
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
    </div>
  );
}
