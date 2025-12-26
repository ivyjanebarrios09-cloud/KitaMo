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
import { ChevronDown, Users } from 'lucide-react';

const students = [
  {
    id: 1,
    name: 'Student 1',
    email: 'student1@gmail.com',
    status: 'Fully Paid',
    paid: 650.0,
    owed: 0.0,
  },
];

export default function StudentsPage() {
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
            A list of all students who have joined this room. Click on a
            student to view and manage their payment status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${student.email}.png`} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm">
                   <div>
                     <p className="text-muted-foreground">Status</p>
                     <Badge variant={student.status === 'Fully Paid' ? 'default' : 'destructive'} className={student.status === 'Fully Paid' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : ''}>{student.status}</Badge>
                   </div>
                   <div>
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-medium">₱{student.paid.toFixed(2)}</p>
                   </div>
                   <div>
                        <p className="text-muted-foreground">Owed</p>
                        <p className="font-medium">₱{student.owed.toFixed(2)}</p>
                   </div>
                   <ChevronDown className="h-5 w-5 text-muted-foreground cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
