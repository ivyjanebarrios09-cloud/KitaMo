
'use client';

import {
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useRoom } from '@/hooks/use-room';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { leaveRoom } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Loader } from '@/components/loader';


export default function RoomDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { roomId } = params;
  const { room, loading } = useRoom(roomId as string);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLeaving, setIsLeaving] = React.useState(false);

  const isChairperson = user?.uid === room?.createdBy;

  const handleLeaveRoom = async () => {
    if (!user) return;
    setIsLeaving(true);
    try {
      await leaveRoom(roomId as string, user.uid);
      toast({
        title: 'Successfully Left Room',
        description: `You have left ${room?.name}.`,
      });
      router.push('/dashboard/rooms');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Leave Room',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
           <Link href="/dashboard/rooms" className="p-2 rounded-md hover:bg-muted -ml-2">
                <ChevronLeft className="h-6 w-6" />
           </Link>
           <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1">
            <h1 className="text-xl sm:text-2xl font-bold">
                {loading ? 'Loading...' : room?.name || 'Room'}
            </h1>
            {!loading && room?.code && isChairperson && <Badge variant="secondary">CODE: {room.code}</Badge>}
           </div>
        </div>
        {!loading && !isChairperson && (
           <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Room
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to leave this room?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. You will lose access to this room and all its data. You can only rejoin if you have a new invite code.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeaveRoom} disabled={isLeaving} className="bg-destructive hover:bg-destructive/90">
                        {isLeaving ? <Loader className="h-4 w-4"/> : 'Leave'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
           </AlertDialog>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
