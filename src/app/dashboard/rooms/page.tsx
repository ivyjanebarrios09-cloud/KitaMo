
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
import { createRoom, deleteRoom, updateRoom } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/loader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  description: z.string().optional(),
});


const RoomCard = ({ room, onEdit, onDelete }) => (
    <Card className="shadow-sm hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{room.name}</CardTitle>
        <CardDescription className="h-10">{room.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground">
            Created by: {room.ownerName}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{room.studentCount || 0} Students</span>
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
              <DropdownMenuItem onClick={() => onEdit(room)}>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(room)}>
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

const RoomFormModal = ({ open, onOpenChange, room, onSubmit, formLoading }) => {
    const isEditing = !!room;
    const form = useForm({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    React.useEffect(() => {
        if (isEditing) {
            form.reset({
                name: room.name,
                description: room.description
            });
        } else {
            form.reset({
                name: '',
                description: ''
            });
        }
    }, [isEditing, room, form]);


    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Room" : "Create New Room"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update the details for your room." : "Fill in the details to create a new financial tracking room."}
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
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading ? <Loader className="h-4 w-4"/> : (isEditing ? "Save Changes" : "Create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function ManageRoomsPage() {
  const { user } = useAuth();
  const { rooms, loading } = useUserRooms(user?.uid);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const { toast } = useToast();

  const handleCreate = () => {
    setSelectedRoom(null);
    setModalOpen(true);
  }

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setModalOpen(true);
  }
  
  const handleDelete = (room) => {
    setSelectedRoom(room);
    setDeleteAlertOpen(true);
  }

  const confirmDelete = async () => {
    if (!selectedRoom) return;
    try {
      await deleteRoom(selectedRoom.id);
      toast({
        title: 'Room Deleted',
        description: `${selectedRoom.name} has been permanently deleted.`,
      });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error deleting room',
            description: 'An unexpected error occurred. Please try again.',
        });
    } finally {
        setDeleteAlertOpen(false);
        setSelectedRoom(null);
    }
  }


  const onSubmit = async (values: z.infer<typeof roomSchema>) => {
    if (!user) return;
    setFormLoading(true);

    const isEditing = !!selectedRoom;
    
    try {
        if (isEditing) {
            await updateRoom(selectedRoom.id, values);
            toast({
                title: 'Room Updated!',
                description: `${values.name} has been successfully updated.`,
            });
        } else {
            const ownerName = user.displayName || user.email?.split('@')[0] || 'Anonymous';
            await createRoom(user.uid, ownerName, values);
            toast({
                title: 'Room Created!',
                description: `${values.name} has been successfully created.`,
            });
        }
      setModalOpen(false);
      setSelectedRoom(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isEditing ? 'Error updating room' : 'Error creating room',
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
        <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Room
        </Button>
      </div>

       <RoomFormModal
         open={modalOpen}
         onOpenChange={setModalOpen}
         room={selectedRoom}
         onSubmit={onSubmit}
         formLoading={formLoading}
       />

        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the room "{selectedRoom?.name}" and all of its associated data, including students, expenses, and deadlines.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
            <RoomCard key={room.id} room={room} onEdit={handleEdit} onDelete={handleDelete} />
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
