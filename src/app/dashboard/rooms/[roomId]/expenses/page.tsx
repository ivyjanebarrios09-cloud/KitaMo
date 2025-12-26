'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Wallet,
  PiggyBank,
  Receipt,
  DollarSign,
  Calendar as CalendarIcon,
  PlusCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { useRoom } from '@/hooks/use-room';
import { useParams } from 'next/navigation';
import { Loader } from '@/components/loader';
import { useForm, Controller } from 'react-hook-form';
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
import { addExpense } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { useRoomTransactions } from '@/hooks/use-room-transactions';

const expenseSchema = z.object({
    name: z.string().min(1, "Expense name is required"),
    description: z.string().optional(),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    date: z.date({ required_error: "Please select a date" }),
});


const StatCard = ({ title, value, icon: Icon, subtext, loading }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
        {loading ? <Loader className="h-6 w-6"/> : (
            <>
                <div className="text-2xl font-bold">₱{value}</div>
                {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </>
        )}
    </CardContent>
  </Card>
);

export default function ExpensesPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const { room, loading: roomLoading } = useRoom(roomId);
    const { transactions, loading: transactionsLoading } = useRoomTransactions(roomId, 'payment');
    const [formLoading, setFormLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof expenseSchema>>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            name: '',
            description: '',
            amount: 0,
        }
    });

    const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
        setFormLoading(true);
        try {
            await addExpense(roomId, values);
            toast({
                title: 'Expense Added!',
                description: `${values.name} has been recorded.`,
            });
            form.reset({ name: '', description: '', amount: 0, date: undefined });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error adding expense',
                description: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            setFormLoading(false);
        }
    };


    const balance = (room?.totalCollected || 0) - (room?.totalExpenses || 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Wallet className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Expenses</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Collected Funds"
          value={(room?.totalCollected || 0).toFixed(2)}
          subtext="Updated in real-time"
          icon={PiggyBank}
          loading={roomLoading}
        />
        <StatCard
          title="Total Expenses"
          value={(room?.totalExpenses || 0).toFixed(2)}
          subtext="Updated in real-time"
          icon={Receipt}
          loading={roomLoading}
        />
        <StatCard
          title="Remaining Balance"
          value={balance.toFixed(2)}
          subtext="Updated in real-time"
          icon={DollarSign}
          loading={roomLoading}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>Post New Expense</CardTitle>
            <CardDescription>
              Record a new expense for this room.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Expense Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Venue Rental" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="space-y-2 flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={'outline'}
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Category / Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Event Logistics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" type="submit" disabled={formLoading}>
                  {formLoading ? <Loader className="h-4 w-4" /> : (
                    <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Expense
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              A log of all payments received from students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsLoading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                            <div className="flex justify-center p-8"><Loader/></div>
                        </TableCell>
                    </TableRow>
                ) : transactions.length > 0 ? (
                    transactions.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.studentName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{payment.date ? format(payment.date.toDate(), 'PP') : 'N/A'}</TableCell>
                        <TableCell>{payment.name}</TableCell>
                        <TableCell className="text-right font-medium">
                        ₱{payment.amount.toFixed(2)}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No recent payments found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
