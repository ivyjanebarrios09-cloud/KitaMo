
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

export function StudentDeadlines({ roomId, student }) {
  const { deadlines, loading } = useStudentDeadlines(roomId, student.id);
  const { toast } = useToast();
  const [payingDeadline, setPayingDeadline] = useState<string | null>(null);

  const handleMarkAsPaid = async (deadline: any) => {
    if (deadline.status === 'Paid') return;
    
    setPayingDeadline(deadline.id);
    try {
      await addPayment(roomId, student.id, student.name, deadline);
      toast({
        title: 'Payment Recorded',
        description: `Marked '${deadline.name}' as paid for ${student.name}.`,
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deadline</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deadlines.length > 0 ? (
            deadlines.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.date ? format(d.date.toDate(), 'PP') : 'N/A'}</TableCell>
                <TableCell>₱{d.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={d.status === 'Paid' ? 'secondary' : 'destructive'}>
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
              <TableCell colSpan={5} className="text-center h-24">
                No deadlines have been posted for this room yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
