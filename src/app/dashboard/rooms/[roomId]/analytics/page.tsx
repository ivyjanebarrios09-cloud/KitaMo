
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { useRoomTransactions } from '@/hooks/use-room-transactions';
import { useRoom } from '@/hooks/use-room';
import { Loader } from '@/components/loader';
import { format } from 'date-fns';
import React from 'react';

const chartConfig = {
  expenses: {
    label: 'Expenses',
    color: 'hsl(var(--primary))',
  },
};

export default function ExpenseAnalyticsPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { room, loading: roomLoading } = useRoom(roomId);
  const { transactions: expenses, loading: expensesLoading } = useRoomTransactions(roomId, 'debit');

  const loading = roomLoading || expensesLoading;

  const { monthlyExpensesData, yearlyExpensesData } = React.useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { monthlyExpensesData: [], yearlyExpensesData: [] };
    }

    const monthly: { [key: string]: number } = {};
    const yearly: { [key: string]: number } = {};

    expenses.forEach((expense) => {
      if (expense.createdAt) {
        const date = expense.createdAt.toDate();
        
        // Monthly aggregation
        const monthKey = format(date, 'MMM yyyy');
        if (!monthly[monthKey]) {
          monthly[monthKey] = 0;
        }
        monthly[monthKey] += expense.amount;

        // Yearly aggregation
        const yearKey = format(date, 'yyyy');
        if (!yearly[yearKey]) {
          yearly[yearKey] = 0;
        }
        yearly[yearKey] += expense.amount;
      }
    });

    const monthlyData = Object.keys(monthly).map(key => ({
        month: key,
        expenses: monthly[key],
        // Add a timestamp for sorting
        timestamp: new Date(key).getTime(),
    })).sort((a,b) => a.timestamp - b.timestamp);


    const yearlyData = Object.keys(yearly).map(key => ({
        year: key,
        expenses: yearly[key],
    })).sort((a,b) => parseInt(a.year) - parseInt(b.year));

    return { monthlyExpensesData: monthlyData, yearlyExpensesData: yearlyData };

  }, [expenses]);


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/rooms/${roomId}`}
          className="p-2 rounded-md hover:bg-muted"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Expense Analytics</h1>
          <p className="text-muted-foreground">
            Visualizing financial data for: {room?.name || '...'}
          </p>
        </div>
      </div>

        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader />
            </div>
        ) : expenses.length === 0 ? (
            <Card>
                <CardHeader>
                    <CardTitle>No Expense Data</CardTitle>
                    <CardDescription>There are no expenses recorded in this room to analyze.</CardDescription>
                </CardHeader>
            </Card>
        ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                <CardHeader>
                    <CardTitle>Monthly Expenses</CardTitle>
                    <CardDescription>
                    Total expenses aggregated by month.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={monthlyExpensesData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.split(' ')[0]} // Show only month abbreviation
                        />
                        <YAxis
                        tickFormatter={(value) => `₱${value}`}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        />
                        <ChartTooltip
                        content={<ChartTooltipContent />}
                        cursor={false}
                        />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>Yearly Expenses</CardTitle>
                    <CardDescription>
                    Total expenses aggregated by year.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={yearlyExpensesData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="year"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        />
                        <YAxis
                        tickFormatter={(value) => `₱${value}`}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        />
                        <ChartTooltip
                        content={<ChartTooltipContent />}
                        cursor={false}
                        />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}
