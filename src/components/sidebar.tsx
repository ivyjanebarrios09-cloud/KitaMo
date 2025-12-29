

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
  ArchiveRestore,
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
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useIsMobile } from '@/hooks/use-mobile';


const baseSidebarNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/rooms', icon: Archive, label: 'Rooms' },
  ];

const chairpersonExtraNav = [
    { href: '/dashboard/archived-rooms', icon: ArchiveRestore, label: 'Archived Rooms' },
];

const roomSubNavItems = [
    { href: '', label: 'Room Dashboard', icon: Home, chairpersonOnly: false },
    { href: '/announcement', label: 'Announcement', icon: Megaphone, chairpersonOnly: false },
    { href: '/expenses', label: 'Expenses', icon: Wallet, chairpersonOnly: false },
    { href: '/fund-deadlines', label: 'Fund Deadlines', icon: Calendar, chairpersonOnly: false },
    { href: '/statements', label: 'Statements', icon: ClipboardList, chairpersonOnly: false },
    { href: '/students', label: 'Members', icon: UserIcon, chairpersonOnly: false },
    { href: '/analytics', label: 'Expense Analytics', icon: BarChart3, chairpersonOnly: true },
];

const Logo = () => (
    <div className="flex items-center gap-2">
        <img src="/image/logoooo.png" alt="KitaMo! Logo" className="h-7 w-7" />
    </div>
  );

  const LogoWithTitle = () => (
    <div className="flex items-center gap-2">
        <img src="/image/logoooo.png" alt="KitaMo! Logo" className="h-7 w-7" />
        <span className="font-bold text-xl text-primary">KitaMo!</span>
    </div>
  );

function NavContent({ isMobile = false, userProfile }) {
    const pathname = usePathname();
    const isRoomRoute = pathname.startsWith('/dashboard/rooms/');
    const roomId = isRoomRoute ? pathname.split('/')[3] : null;

    const isChairperson = userProfile?.role === 'chairperson';
    
    let sidebarNavItems = isChairperson
        ? [...baseSidebarNavItems, ...chairpersonExtraNav]
        : baseSidebarNavItems;


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

export function Header() {
    const { user, logout } = useAuth();
    const { userProfile } = useUserProfile(user?.uid);


    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-16 lg:px-6 sticky top-0 z-30">
            <Link href="/dashboard" className="lg:hidden">
              <LogoWithTitle />
            </Link>
            <div className="w-full flex-1">
                {/* Optional: Add search or other header elements here */}
            </div>
            <div className="flex items-center gap-4">
              {user && userProfile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                      <UserIcon className="h-5 w-5" />
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
                        <Link href="/dashboard/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Profile Settings</span>
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

export function BottomNavBar({userProfile}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isChairperson = userProfile?.role === 'chairperson';
  
  let mainNavItems = isChairperson
  ? [...baseSidebarNavItems, ...chairpersonExtraNav]
  : baseSidebarNavItems;


  const isRoomRoute = pathname.startsWith('/dashboard/rooms/');
  const roomId = isRoomRoute ? pathname.split('/')[3] : null;

  let navItemsToShow = mainNavItems;

  if (isRoomRoute && roomId) {
    const roomNavs = isChairperson 
      ? roomSubNavItems
      : roomSubNavItems.filter(item => !item.chairpersonOnly);

    navItemsToShow = roomNavs.map(item => ({
        ...item,
        href: `/dashboard/rooms/${roomId}${item.href}`
    }));
  }

  if (!isMobile) return null;


  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t z-40">
      <div className="flex justify-around items-center h-16">
        {navItemsToShow.map((item) => {
            const href = item.href;

            let newIsActive = (pathname === href);
            if(isRoomRoute && item.label === "Rooms") newIsActive = true;
            
            if (roomId) {
                 if (href.endsWith(roomId) && pathname === href) newIsActive = true; // Room dashboard
                 if (!href.endsWith(roomId) && pathname.startsWith(href) && href.length > `/dashboard/rooms/${roomId}`.length) newIsActive = true;
            } else {
                 if (item.href !== '/dashboard' && pathname.startsWith(item.href)) newIsActive = true;
                 if (item.href === '/dashboard' && pathname === '/dashboard') newIsActive = true;
            }


            return (
                <Link
                    key={item.label}
                    href={href}
                    className={cn(
                    'flex flex-col items-center justify-center text-muted-foreground transition-all w-full h-full gap-1 p-1 text-xs',
                    newIsActive && 'text-primary bg-muted/50'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                </Link>
            )
        })}
      </div>
    </div>
  );
}
