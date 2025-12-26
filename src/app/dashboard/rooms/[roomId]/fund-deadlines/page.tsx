
'use client';
import 'react-day-picker/dist/style.css';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { addDeadline } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import { Loader } from '@/components/loader';
import { useAuth } from '@/context/auth-context';
import { useRoom } from '@/hooks/use-room';
import { Badge } from '@/components/ui/badge';
import { useRoomDeadlines } from '@/hooks/use-room-deadlines';
import { useStudentDeadlines } from '@/hooks/use-student-deadlines';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

const deadlineSchema = z.object({
  title: z.string().min(1, 'Deadline title is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  dueDate: z.coerce.date({ required_error: 'Please select a due date' }),
  category: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

function NewDeadlineModal({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof deadlineSchema>>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: {
      title: '',
      amount: 0,
      category: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof deadlineSchema>) => {
    setFormLoading(true);
    try {
      await addDeadline(roomId, values);
      toast({
        title: 'Deadline Posted!',
        description: `${values.title} has been posted for all students.`,
      });
      form.reset({ title: '', amount: 0, dueDate: undefined, category: '', description: '' });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error posting deadline',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Post New Deadline
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post a New Fund Deadline</DialogTitle>
          <DialogDescription>
            Create a deadline and notify students in the activity feed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Spring Formal Tickets" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount per Student (₱)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => {
                  const dateValue = field.value ? format(new Date(field.value), 'yyyy-MM-dd') : '';
                  return (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={dateValue}
                          onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              // Adjust for timezone offset
                              if (date) {
                                const timezoneOffset = date.getTimezoneOffset() * 60000;
                                const adjustedDate = new Date(date.getTime() + timezoneOffset);
                                field.onChange(adjustedDate);
                              } else {
                                field.onChange(null);
                              }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Announcement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your announcement here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <Loader className="h-4 w-4" /> : 'Post Deadline'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ChairpersonFundDeadlines({ roomId }: { roomId: string }) {
  const { deadlines, loading } = useRoomDeadlines(roomId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Fund Deadlines</h1>
        </div>
        <NewDeadlineModal roomId={roomId} />
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Posted Deadlines</CardTitle>
          <CardDescription>
            All fund deadlines created for this room.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deadline</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount Required</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    <div className="flex justify-center p-8">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : deadlines.length > 0 ? (
                deadlines.map((deadline) => (
                  <TableRow key={deadline.id}>
                    <TableCell className="font-medium">{deadline.name}</TableCell>
                    <TableCell>
                      {deadline.date
                        ? format(deadline.date.toDate(), 'PP')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₱{deadline.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No deadlines posted yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentFundDeadlines({ roomId, studentId }: { roomId: string, studentId: string }) {
    const { deadlines, loading } = useStudentDeadlines(roomId, studentId);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Deadlines</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Fund Deadlines</CardTitle>
                    <CardDescription>Upcoming and past due payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Amount Required</TableHead>
                                <TableHead>Amount Paid</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    <div className="flex justify-center p-8"><Loader/></div>
                                </TableCell>
                            </TableRow>
                        ) : deadlines.length > 0 ? (
                            deadlines.map((deadline) => (
                            <TableRow key={deadline.id}>
                                <TableCell className="font-medium">{deadline.name}</TableCell>
                                <TableCell>{deadline.date ? format(deadline.date.toDate(), 'PP') : 'N/A'}</TableCell>
                                <TableCell>₱{deadline.amount.toFixed(2)}</TableCell>
                                <TableCell>₱{deadline.amountPaid.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={deadline.status === 'Paid' ? 'secondary' : 'destructive'} className={deadline.status === 'Paid' ? 'bg-green-100 text-green-800' : ''}>
                                        {deadline.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                No deadlines found.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default function FundDeadlinesPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { room, loading } = useRoom(roomId);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader /></div>
  }

  const isChairperson = user?.uid === room?.ownerId;

  if (isChairperson) {
    return <ChairpersonFundDeadlines roomId={roomId} />;
  }

  return <StudentFundDeadlines roomId={roomId} studentId={user!.uid} />;
}
