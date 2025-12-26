
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
import { ArrowRight, MoreHorizontal, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useUserRooms } from '@/hooks/use-user-rooms';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import React from 'react';
import { createRoom } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/loader';


const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  description: z.string().optional(),
});

const RoomCard = ({ room }) => (
  <Card className="shadow-sm hover:shadow-lg transition-shadow flex flex-col">
    <CardHeader>
      <CardTitle className="text-xl">{room.name}</CardTitle>
      <CardDescription className="h-10">{room.description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow"></CardContent>
    <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span>{room.studentCount || 0} Students</span>
        <span>₱{(room.totalCollected - room.totalExpenses).toFixed(2) || '0.00'}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/rooms/${room.id}`}>
            Manage Room <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardFooter>
  </Card>
);

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
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
            </div>
        </CardFooter>
    </Card>
)

export default function ManageRoomsPage() {
  const { user } = useAuth();
  const { rooms, loading } = useUserRooms(user?.uid);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof roomSchema>) => {
    if (!user) return;
    setFormLoading(true);
    try {
      const ownerName = user.displayName || user.email?.split('@')[0] || 'Anonymous';
      await createRoom(user.uid, ownerName, values);
      toast({
        title: 'Room Created!',
        description: `${values.name} has been successfully created.`,
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error creating room',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
        setFormLoading(false);
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Rooms</h1>
          <p className="text-muted-foreground">
            Your financial rooms are listed below.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Room
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Room</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new financial tracking room.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Room Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Socrates Fund" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="A brief description of the room's purpose" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading ? <Loader className="h-4 w-4"/> : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </>
        ) : rooms.length > 0 ? (
          rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))
        ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-16">
                <p>No rooms found.</p>
                <p className="text-sm">Click "Create Room" to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
}
