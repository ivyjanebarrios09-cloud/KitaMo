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
import React from 'react';

const StatCard = ({ title, value, icon: Icon, subtext }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">₱{value}</div>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </CardContent>
  </Card>
);

const recentPayments = [
  {
    student: 'Student 1',
    date: 'Dec 24, 2025',
    note: 'Payment for Food Expenses',
    amount: 150.0,
  },
  {
    student: 'Student 1',
    date: 'Dec 24, 2025',
    note: 'Payment for Year End Party',
    amount: 500.0,
  },
];

export default function ExpensesPage() {
  const [date, setDate] = React.useState<Date>();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Wallet className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Expenses</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Collected Funds"
          value="650.00"
          subtext="Updated in real-time"
          icon={PiggyBank}
        />
        <StatCard
          title="Total Expenses"
          value="300.00"
          subtext="Updated in real-time"
          icon={Receipt}
        />
        <StatCard
          title="Remaining Balance"
          value="350.00"
          subtext="Updated in real-time"
          icon={DollarSign}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Post New Expense</CardTitle>
            <CardDescription>
              Record a new expense for this room.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expense Name</label>
                <Input placeholder="e.g., Venue Rental" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Category / Description
              </label>
              <Textarea placeholder="e.g., Event Logistics" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" placeholder="0" />
            </div>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
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
                  <TableHead>Date</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{payment.student}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.note}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₱{payment.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
