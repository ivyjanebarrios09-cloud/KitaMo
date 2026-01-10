
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
        
        const monthKey = format(date, 'MMM yyyy');
        if (!monthly[monthKey]) {
          monthly[monthKey] = 0;
        }
        monthly[monthKey] += expense.amount;

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
        timestamp: new Date(key).getTime(),
    })).sort((a,b) => b.timestamp - a.timestamp);


    const yearlyData = Object.keys(yearly).map(key => ({
        year: key,
        expenses: yearly[key],
    })).sort((a,b) => parseInt(b.year) - parseInt(a.year));

    return { monthlyExpensesData: monthlyData, yearlyExpensesData: yearlyData };

  }, [expenses]);


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href={`/dashboard/rooms/${roomId}`}
          className="p-2 rounded-md hover:bg-muted -ml-2"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Expense Analytics</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-[250px] sm:max-w-full truncate">
            Visualizing data for: {room?.name || '...'}
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
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={monthlyExpensesData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis
                            dataKey="month"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value}
                            width={80}
                        />
                        <XAxis
                            dataKey="expenses"
                            type="number"
                            tickFormatter={(value) => `₱${value}`}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                            cursor={false}
                        />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} layout="vertical" />
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
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={yearlyExpensesData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid horizontal={false} />
                         <YAxis
                            dataKey="year"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={50}
                        />
                        <XAxis
                            dataKey="expenses"
                            type="number"
                            tickFormatter={(value) => `₱${value}`}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                            cursor={false}
                        />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} layout="vertical" />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}
