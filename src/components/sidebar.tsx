

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
  Settings,
  Megaphone,
  FileText,
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
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserProfile } from '@/hooks/use-user-profile';


const sidebarNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/rooms', icon: Archive, label: 'Rooms' },
  ];

const roomSubNavItems = [
    { href: '', label: 'Room Dashboard', icon: Home, chairpersonOnly: false },
    { href: '/announcement', label: 'Announcement', icon: Megaphone, chairpersonOnly: false },
    { href: '/expenses', label: 'Expenses', icon: Wallet, chairpersonOnly: false },
    { href: '/fund-deadlines', label: 'Fund Deadlines', icon: Calendar, chairpersonOnly: false },
    { href: '/statements', label: 'Statements', icon: ClipboardList, chairpersonOnly: false },
    { href: '/students', label: 'Members', icon: UserIcon, chairpersonOnly: true },
    { href: '/analytics', label: 'Expense Analytics', icon: BarChart3, chairpersonOnly: true },
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
      <circle cx="14" cy="14" r="12" fill="url(#logo-gradient)" />
    </svg>
  );

function NavContent({ isMobile = false, userProfile }) {
    const pathname = usePathname();
    const isRoomRoute = pathname.startsWith('/dashboard/rooms/');
    const roomId = isRoomRoute ? pathname.split('/')[3] : null;

    const isChairperson = userProfile?.role === 'chairperson';

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

    const roomNavs = isChairperson 
      ? roomSubNavItems
      : roomSubNavItems.filter(item => !item.chairpersonOnly);

    return (
        <>
         {sidebarNavItems.map((item) => renderLink(item))}
            {isRoomRoute && roomId && (
                 <div className={cn("mt-2 space-y-1", !isMobile && "border-t pt-2")}>
                 {!isMobile && <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase text-center">Room</p>}
                 {isMobile && <div className="pl-4 mt-2 space-y-1 border-l ml-3"><p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase">Room Menu</p></div>}
                 <div className={cn(isMobile && "pl-4 mt-2 space-y-1 border-l ml-3")}>
                    {roomNavs.map((item) => renderLink(item, true))}
                 </div>
               </div>
            )}
        </>
    )
}


export function Sidebar({isMobileSheet = false, userProfile}: {isMobileSheet?: boolean, userProfile: any}) {

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="h-16 flex items-center justify-center px-6 border-b">
            <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-lg"
            >
            <Logo />
            </Link>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-2">
            <NavContent isMobile={isMobileSheet} userProfile={userProfile}/>
        </nav>
      </div>

       {!isMobileSheet && (
         <div className="mt-auto p-2 border-t">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="#">
                  <div className="flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                    <Settings className="h-5 w-5" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  );

  if (isMobileSheet) {
    return <div className="flex flex-col h-full bg-card">{sidebarContent}</div>
  }

  return (
    <aside className="w-20 bg-card border-r flex-col h-screen hidden lg:flex">
      {sidebarContent}
    </aside>
  );
}

export function MobileSidebar({isSidebarOpen, setSidebarOpen, userProfile}: {isSidebarOpen: boolean, setSidebarOpen: (open: boolean) => void, userProfile: any}) {
    const { user, logout } = useAuth();
    const userInitial = userProfile?.name?.charAt(0).toUpperCase() || '?';

    return (
        <div className="lg:hidden">
             <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="flex flex-col p-0 w-72">
                    <SheetHeader className="p-4">
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <Sidebar isMobileSheet={true} userProfile={userProfile}/>
                    <div className="p-2 border-t mt-auto">
                    {user && userProfile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start h-auto p-2">
                            <Avatar className="h-9 w-9">
                            <AvatarImage
                                src={userProfile.profilePic || `https://avatar.vercel.sh/${user.email}.png`}
                                alt={userProfile.name}
                            />
                            <AvatarFallback>{userInitial}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start overflow-hidden ml-2">
                                <span className="text-sm font-medium leading-none truncate">{userProfile.name}</span>
                                <span className="text-xs text-muted-foreground leading-none truncate">{user.email}</span>
                            </div>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/personal-statements">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Personal Statements</span>
                          </Link>
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
                </SheetContent>
            </Sheet>
        </div>
    )
}

export function Header({onMenuClick, showMenuButton}: {onMenuClick?: () => void, showMenuButton?: boolean}) {
    const { user, logout } = useAuth();
    const { userProfile } = useUserProfile(user?.uid);
    const userInitial = userProfile?.name?.charAt(0).toUpperCase() || '?';

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-16 lg:px-6 sticky top-0 z-30">
            {showMenuButton && onMenuClick && <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              <span className="sr-only">Toggle Menu</span>
            </Button>}
            <div className="w-full flex-1">
                {/* Optional: Add search or other header elements here */}
            </div>
            <div className="flex items-center gap-4">
              {user && userProfile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={userProfile.profilePic || `https://avatar.vercel.sh/${user.email}.png`}
                          alt={userProfile.name}
                        />
                        <AvatarFallback>{userInitial}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/personal-statements">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Personal Statements</span>
                      </Link>
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

export function BottomNavBar({userProfile}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userInitial = userProfile?.name?.charAt(0).toUpperCase() || '?';
  const isChairperson = userProfile?.role === 'chairperson';
  
  const isRoomRoute = pathname.startsWith('/dashboard/rooms/');
  const roomId = isRoomRoute ? pathname.split('/')[3] : null;

  let navItems = sidebarNavItems;

  if (isRoomRoute && roomId) {
    const roomNavs = isChairperson 
      ? roomSubNavItems
      : roomSubNavItems.filter(item => !item.chairpersonOnly);

    navItems = roomNavs.map(item => ({
        ...item,
        href: `/dashboard/rooms/${roomId}${item.href}`
    })).slice(0, 4); // Limit to 4 for bottom nav
  }


  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
            const href = item.href || `/dashboard/rooms/${roomId}`;
            const isActive = href === `/dashboard/rooms/${roomId}`
              ? pathname === href
              : (item.href === '/dashboard' && pathname === item.href) || (item.href !== '/dashboard' && pathname.startsWith(href));

            return (
                <Link
                    key={item.label}
                    href={href}
                    className={cn(
                    'flex flex-col items-center justify-center text-muted-foreground transition-all w-full h-full',
                    isActive && 'text-primary bg-muted/50'
                    )}
                >
                    <item.icon className="h-6 w-6" />
                </Link>
            )
        })}
         {user && userProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-col items-center justify-center text-muted-foreground w-full h-full cursor-pointer">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={userProfile.profilePic || `https://avatar.vercel.sh/${user.email}.png`}
                      alt={userProfile.name}
                    />
                    <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
                  </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/personal-statements">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Personal Statements</span>
                </Link>
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
