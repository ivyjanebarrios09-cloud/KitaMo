
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, LogOut } from 'lucide-react';
import { useRoomStudents } from '@/hooks/use-room-students';
import { useParams, useRouter } from 'next/navigation';
import { Loader } from '@/components/loader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StudentDeadlines } from '@/components/student-deadlines';
import { useAuth } from '@/context/auth-context';
import { useRoom } from '@/hooks/use-room';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { leaveRoom } from '@/lib/firebase-actions';

function ChairpersonStudentsPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { students, chairperson, loading } = useRoomStudents(roomId);

  return (
    <>
      {loading && !chairperson ? (
         <div className="flex justify-center p-8"><Loader/></div>
      ) : chairperson && (
        <Card className="shadow-sm bg-muted/30">
            <CardHeader>
                <CardTitle className="text-lg">Financial Chairperson</CardTitle>
                <CardDescription>The user managing this room.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center gap-4">
                    <Avatar className='h-12 w-12'>
                        <AvatarImage src={chairperson.profilePic || `https://avatar.vercel.sh/${chairperson.email}.png`} alt={chairperson.name} />
                        <AvatarFallback>{chairperson.name?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-lg">{chairperson.name}</p>
                        <p className="text-sm text-muted-foreground">
                        {chairperson.email}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}


      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Student Members</CardTitle>
          <CardDescription>
            A list of all students who have joined this room. Click to view and manage their deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto">
            {loading ? (
                 <div className="flex justify-center p-8"><Loader/></div>
            ) : students.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {students.map((student) => (
                        <AccordionItem value={student.id} key={student.id}>
                            <AccordionTrigger className="w-full hover:bg-muted/50 px-4 py-3 rounded-lg">
                                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={student.profilePic || `https://avatar.vercel.sh/${student.email}.png`} alt={student.name} />
                                            <AvatarFallback>{student.name?.charAt(0) || 'S'}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="font-semibold">{student.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                            {student.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 sm:gap-8 text-sm w-full sm:w-auto justify-between sm:justify-end pl-14 sm:pl-0 sm:pr-4">
                                        <div className="text-left sm:text-left">
                                            <p className="text-muted-foreground text-xs">Status</p>
                                            <Badge variant={student.totalOwed <= 0 ? 'default' : 'destructive'} className={student.totalOwed <= 0 ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : ''}>
                                                {student.totalOwed <= 0 ? 'Fully Paid' : 'Has Dues'}
                                            </Badge>
                                        </div>
                                        <div className="text-left sm:text-left">
                                                <p className="text-muted-foreground text-xs">Paid</p>
                                                <p className="font-medium">₱{student.totalPaid.toFixed(2)}</p>
                                        </div>
                                        <div className="text-left sm:text-left">
                                                <p className="text-muted-foreground text-xs">Owed</p>
                                                <p className="font-medium">₱{student.totalOwed.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <StudentDeadlines roomId={roomId} student={student} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <p>No members have joined this room yet.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}

function StudentMembersPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { students, chairperson, loading } = useRoomStudents(roomId);
    const { room } = useRoom(roomId as string);
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLeaving, setIsLeaving] = React.useState(false);

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

    const MemberRow = ({ user, isChairperson = false }) => (
        <div className="flex items-center gap-4 py-4 px-4 sm:px-6 border-b">
             <Avatar className='h-12 w-12'>
                <AvatarImage src={user.profilePic || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className='flex-1'>
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                </p>
            </div>
            {isChairperson && <Badge variant="secondary">Chairperson</Badge>}
        </div>
    )

    return (
        <>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Room Members</CardTitle>
                    <CardDescription>
                        A list of all members in this room.
                    </CardDescription>
                </CardHeader>
                <CardContent className='p-0 max-h-[60vh] overflow-y-auto'>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader /></div>
                    ) : (
                        <div>
                            {chairperson && <MemberRow user={chairperson} isChairperson={true} />}
                            {students.length > 0 ? (
                                students.map(student => <MemberRow key={student.id} user={student} />)
                            ) : (
                            !chairperson && (
                                <div className="text-center text-muted-foreground py-16">
                                    <p>No members found in this room.</p>
                                </div>
                            )
                            )}
                            {students.length === 0 && chairperson && (
                                <div className="text-center text-muted-foreground py-16 px-6">
                                    <p>No other members have joined this room yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            <div className="mt-6 p-4 border-t border-dashed">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
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
            </div>
        </>
    )
}

export default function StudentsPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { room, loading: roomLoading } = useRoom(roomId);

  if (roomLoading) {
    return <div className="flex justify-center p-8"><Loader /></div>;
  }
  
  const isChairperson = user?.uid === room?.createdBy;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Members</h1>
      </div>
      {isChairperson ? <ChairpersonStudentsPage /> : <StudentMembersPage />}
    </div>
  );
}
