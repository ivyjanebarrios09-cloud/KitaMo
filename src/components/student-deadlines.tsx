
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useStudentDeadlines } from '@/hooks/use-student-deadlines';
import { Loader } from './loader';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { addPayment } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';

const DeadlineCard = ({ deadline, onMarkAsPaid, payingDeadlineId }) => (
    <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-start">
                 <p className="font-semibold pr-4">{deadline.description}</p>
                 <Badge variant={deadline.status === 'Paid' ? 'secondary' : 'destructive'} className={`${deadline.status === 'Paid' ? 'bg-green-100 text-green-800' : ''} whitespace-nowrap`}>
                    {deadline.status}
                </Badge>
            </div>
            <Separator/>
            <div className="text-muted-foreground text-sm space-y-2">
                <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span>{deadline.dueDate ? format(deadline.dueDate.toDate(), 'PP') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">₱{deadline.amount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="font-medium">₱{deadline.amountPaid.toFixed(2)}</span>
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <Button
                    size="sm"
                    variant={deadline.status === 'Paid' ? 'ghost' : 'outline'}
                    onClick={() => onMarkAsPaid(deadline)}
                    disabled={deadline.status === 'Paid' || payingDeadlineId === deadline.id}
                >
                    {payingDeadlineId === deadline.id ? <Loader className="h-4 w-4"/> : (deadline.status === 'Paid' ? 'Paid' : 'Mark as Paid')}
                </Button>
            </div>
        </CardContent>
    </Card>
);

export function StudentDeadlines({ roomId, student }) {
  const { deadlines, loading } = useStudentDeadlines(roomId, student.id);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userProfile } = useUserProfile(user?.uid);
  const [payingDeadline, setPayingDeadline] = useState<string | null>(null);

  const handleMarkAsPaid = async (deadline: any) => {
    if (deadline.status === 'Paid' || !userProfile) return;
    
    setPayingDeadline(deadline.id);
    try {
      // For chairpersons marking as paid, they should pay the full required amount for that deadline
      const amountToPay = deadline.amount - deadline.amountPaid;
      if (amountToPay <= 0) {
        toast({ title: "Already Paid", description: "This deadline has already been fully paid."});
        setPayingDeadline(null);
        return;
      }
      await addPayment(roomId, student.id, userProfile.name, deadline.id, amountToPay, deadline.description);
      toast({
        title: 'Payment Recorded',
        description: `Marked '${deadline.description}' as paid for ${student.name}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record payment.',
      });
    } finally {
        setPayingDeadline(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader /></div>;
  }

  return (
    <div className="px-4 py-2 bg-muted/50 rounded-b-lg">
      <h4 className="font-semibold mb-2 text-sm text-muted-foreground px-4 pt-2">Deadline Status for {student.name}</h4>
      
      {/* Mobile View */}
      <div className="md:hidden">
        {deadlines.length > 0 ? (
            deadlines.map(d => (
                <DeadlineCard 
                    key={d.id} 
                    deadline={d} 
                    onMarkAsPaid={handleMarkAsPaid}
                    payingDeadlineId={payingDeadline}
                />
            ))
        ) : (
             <div className="text-center text-muted-foreground py-10">
                No deadlines have been posted for this room yet.
            </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Deadline</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {deadlines.length > 0 ? (
                deadlines.map((d) => (
                <TableRow key={d.id}>
                    <TableCell>{d.description}</TableCell>
                    <TableCell>{d.dueDate ? format(d.dueDate.toDate(), 'PP') : 'N/A'}</TableCell>
                    <TableCell>₱{d.amount.toFixed(2)}</TableCell>
                    <TableCell>₱{d.amountPaid.toFixed(2)}</TableCell>
                    <TableCell>
                    <Badge variant={d.status === 'Paid' ? 'secondary' : 'destructive'} className={d.status === 'Paid' ? 'bg-green-100 text-green-800' : ''}>
                        {d.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <Button
                        size="sm"
                        variant={d.status === 'Paid' ? 'ghost' : 'outline'}
                        onClick={() => handleMarkAsPaid(d)}
                        disabled={d.status === 'Paid' || payingDeadline === d.id}
                    >
                        {payingDeadline === d.id ? <Loader className="h-4 w-4"/> : (d.status === 'Paid' ? 'Paid' : 'Mark as Paid')}
                    </Button>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                    No deadlines have been posted for this room yet.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
