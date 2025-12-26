
'use client';

import {
  ArrowLeft,
  ChevronLeft,
  Home,
  Megaphone,
  Users,
  Wallet,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const roomNavItems = [
  { href: '', label: 'Dashboard', icon: Home },
  { href: '/announcement', label: 'Announcement', icon: Megaphone },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/fund-deadlines', label: 'Fund Deadlines', icon: Calendar },
  { href: '/students', label: 'Students', icon: Users },
];

export default function RoomDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const { roomId } = params;

  // A mock function to get room details. 
  // In a real app, you would fetch this from your data source.
  const getRoomDetails = (id: string) => {
    const roomNames: { [key: string]: string } = {
        'socrates-fund-monitoring': 'Socrates Fund Monitoring',
        'rizal-monitoring-funds': 'Rizal Monitoring Funds',
        'bonifacio-fund-monitoring': 'Bonifacio Fund Monitoring'
    }
    return {
      name: roomNames[id as string] || 'Room Not Found',
      code: 'XM6VLF',
    };
  };

  const room = getRoomDetails(roomId as string);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <Link href="/dashboard/rooms" className="p-2 rounded-md hover:bg-muted">
                <ChevronLeft className="h-6 w-6" />
           </Link>
           <div>
            <h1 className="text-2xl font-bold flex items-center gap-4">
                {room.name}
                <Badge variant="secondary">CODE: {room.code}</Badge>
            </h1>
           </div>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
