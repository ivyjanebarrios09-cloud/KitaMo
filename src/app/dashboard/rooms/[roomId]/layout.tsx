'use client';

import {
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useRoom } from '@/hooks/use-room';
import { useAuth } from '@/context/auth-context';


export default function RoomDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const { roomId } = params;
  const { room, loading } = useRoom(roomId as string);
  const { user } = useAuth();

  const isChairperson = user?.uid === room?.ownerId;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
           <Link href="/dashboard/rooms" className="p-2 rounded-md hover:bg-muted -ml-2">
                <ChevronLeft className="h-6 w-6" />
           </Link>
           <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1">
            <h1 className="text-xl sm:text-2xl font-bold truncate max-w-[200px] sm:max-w-none">
                {loading ? 'Loading...' : room?.name || 'Room'}
            </h1>
            {!loading && room?.code && isChairperson && <Badge variant="secondary">CODE: {room.code}</Badge>}
           </div>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
