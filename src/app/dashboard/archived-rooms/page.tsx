
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowRight, Archive, MoreHorizontal, Users, Unarchive } from 'lucide-react';
import Link from 'next/link';
import { useUserRooms } from '@/hooks/use-user-rooms';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { archiveRoom } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog';

const ArchivedRoomCard = ({ room, onUnarchive }) => {
    const memberCount = (room.members?.length || 1) - 1;
    return (
    <Card className="shadow-sm hover:shadow-lg transition-shadow flex flex-col bg-muted/30">
      <CardHeader>
        <CardTitle className="text-xl">{room.name}</CardTitle>
        <CardDescription className="h-10">{room.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground">
            Created by: {room.createdByName}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{memberCount} Members</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onUnarchive(room)}>
            <Unarchive className="mr-2 h-4 w-4" />
            Unarchive
          </Button>
        </div>
      </CardFooter>
    </Card>
)};

const RoomCardSkeleton = () => (
    <Card className="shadow-sm flex flex-col">
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-1" />
        </CardHeader>
        <CardContent className="flex-grow"></CardContent>
        <CardFooter className="flex justify-between items-center">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-24" />
        </CardFooter>
    </Card>
)


export default function ArchivedRoomsPage() {
    const { user } = useAuth();
    const { rooms, loading } = useUserRooms(user?.uid, true, true); // isChairperson = true, archived = true
    const { toast } = useToast();
    const [selectedRoom, setSelectedRoom] = React.useState(null);
    const [unarchiveAlertOpen, setUnarchiveAlertOpen] = React.useState(false);


    const handleUnarchive = (room) => {
        setSelectedRoom(room);
        setUnarchiveAlertOpen(true);
    };

    const confirmUnarchive = async () => {
        if (!selectedRoom) return;
        try {
          await archiveRoom(selectedRoom.id, false);
          toast({
            title: 'Room Restored',
            description: `${selectedRoom.name} has been moved back to your active rooms.`,
          });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error Restoring Room',
                description: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            setUnarchiveAlertOpen(false);
            setSelectedRoom(null);
        }
    };


    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2">
                <Archive className="w-6 h-6" />
                <h1 className="text-3xl font-bold">Archived Rooms</h1>
            </div>
            <p className="text-muted-foreground">
                These rooms are inactive. You can restore them at any time.
            </p>

            <AlertDialog open={unarchiveAlertOpen} onOpenChange={setUnarchiveAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore Room?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore "{selectedRoom?.name}"? It will become active and appear in your main room list again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmUnarchive}>Restore</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                <>
                    <RoomCardSkeleton />
                    <RoomCardSkeleton />
                    <RoomCardSkeleton />
                </>
                ) : rooms.length > 0 ? (
                rooms.map((room) => (
                    <ArchivedRoomCard key={room.id} room={room} onUnarchive={handleUnarchive} />
                ))
                ) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-16">
                        <p>No archived rooms found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
