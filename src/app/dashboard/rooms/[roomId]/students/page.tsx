
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
import { Users, ChevronDown } from 'lucide-react';
import { useRoomStudents } from '@/hooks/use-room-students';
import { useParams } from 'next/navigation';
import { Loader } from '@/components/loader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StudentDeadlines } from '@/components/student-deadlines';

export default function StudentsPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { students, loading } = useRoomStudents(roomId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Students</h1>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Manage Students</CardTitle>
          <CardDescription>
            A list of all students who have joined this room. Click to view and manage their deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="flex justify-center p-8"><Loader/></div>
            ) : students.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {students.map((student) => (
                        <AccordionItem value={student.id} key={student.id}>
                            <AccordionTrigger className="w-full hover:bg-muted/50 px-4 rounded-lg">
                                 <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={`https://avatar.vercel.sh/${student.email}.png`} alt={student.name} />
                                            <AvatarFallback>{student.name?.charAt(0) || 'S'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{student.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                            {student.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 text-sm pr-4">
                                        <div>
                                            <p className="text-muted-foreground">Status</p>
                                            <Badge variant={student.totalOwed === 0 ? 'default' : 'destructive'} className={student.totalOwed === 0 ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : ''}>
                                                {student.totalOwed === 0 ? 'Fully Paid' : 'Has Dues'}
                                            </Badge>
                                        </div>
                                        <div>
                                                <p className="text-muted-foreground">Paid</p>
                                                <p className="font-medium">₱{student.totalPaid.toFixed(2)}</p>
                                        </div>
                                        <div>
                                                <p className="text-muted-foreground">Owed</p>
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
                    <p>No students have joined this room yet.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
