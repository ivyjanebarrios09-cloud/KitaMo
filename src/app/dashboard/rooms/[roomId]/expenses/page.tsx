
'use client';

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
import { PlusCircle, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { Loader } from '@/components/loader';
import { useRoomTransactions } from '@/hooks/use-room-transactions';
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
import { addExpense } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useRoom } from '@/hooks/use-room';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Separator } from '@/components/ui/separator';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  recipient: z.string().min(1, 'Recipient is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
});

function NewExpenseModal({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userProfile } = useUserProfile(user?.uid);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      recipient: '',
      amount: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!user || !userProfile) return;
    setFormLoading(true);
    try {
      await addExpense(roomId, user.uid, userProfile.name, { ...values, date: new Date() });
      toast({
        title: 'Expense Posted!',
        description: `${values.description} has been added to the room's expenses.`,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error posting expense',
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
          Post New Expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post a New Expense</DialogTitle>
          <DialogDescription>
            Record a new expense for this room. This will be logged in the activity feed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Materials for event"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., John Doe or Store Name"
                      {...field}
                    />
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
                  <FormLabel>Amount (₱)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <Loader className="h-4 w-4" /> : 'Post Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const ExpenseCard = ({ expense }) => (
    <Card className="mb-4">
        <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-start">
                <p className="font-semibold pr-4 text-sm">{expense.description}</p>
                <p className="font-bold text-base whitespace-nowrap">₱{expense.amount.toFixed(2)}</p>
            </div>
            <Separator />
            <div className="text-muted-foreground text-xs space-y-1">
                <div className="flex justify-between">
                    <span>Recipient:</span>
                    <span>{expense.recipient}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{expense.createdAt ? format(expense.createdAt.toDate(), 'PP') : 'N/A'}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Posted By:</span>
                    <span>{expense.userName}</span>
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function ExpensesPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { transactions: expenses, loading } = useRoomTransactions(roomId, 'debit');
  const { user } = useAuth();
  const { room } = useRoom(roomId);
  const isChairperson = user?.uid === room?.createdBy;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Expenses</h1>
        </div>
        {isChairperson && <NewExpenseModal roomId={roomId} />}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Room Expenses</CardTitle>
          <CardDescription>
            All expenses posted for this room.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center p-8"><Loader /></div>
            ) : expenses.length > 0 ? (
                <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {expenses.map(expense => <ExpenseCard key={expense.id} expense={expense} />)}
                </div>
                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell>
                                {expense.createdAt
                                    ? format(expense.createdAt.toDate(), 'PP')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="font-medium">{expense.description}</TableCell>
                                <TableCell>{expense.recipient}</TableCell>
                                <TableCell className="text-right font-medium">
                                ₱{expense.amount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                </>
            ) : (
                <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                    No expenses posted yet.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
