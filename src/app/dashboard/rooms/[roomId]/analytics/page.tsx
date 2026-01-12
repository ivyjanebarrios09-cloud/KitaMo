
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
import { Pie, PieChart, Cell, Legend, ResponsiveContainer } from 'recharts';
import { useRoomTransactions } from '@/hooks/use-room-transactions';
import { useRoom } from '@/hooks/use-room';
import { Loader } from '@/components/loader';
import { format } from 'date-fns';
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';


const chartConfig = {
    expenses: {
      label: 'Expenses',
      color: 'hsl(var(--primary))',
    },
  };
  
const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))',
];

export default function ExpenseAnalyticsPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { room, loading: roomLoading } = useRoom(roomId);
  const { transactions: expenses, loading: expensesLoading } = useRoomTransactions(roomId, 'debit');
  const isMobile = useIsMobile();

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


  const chartHeight = isMobile ? 200 : 250;
  const outerRadius = isMobile ? '60%' : '80%';
  const labelFontSize = isMobile ? 'text-[10px]' : 'text-xs';


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href={`/dashboard/rooms/${roomId}`}
          className="p-2 rounded-md hover:bg-muted -ml-2"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Expense Analytics</h1>
          <p className="text-muted-foreground text-sm sm:text-base break-words">
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
                        Proportion of expenses by month.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="month" />} />
                                <Pie
                                    data={monthlyExpensesData}
                                    dataKey="expenses"
                                    nameKey="month"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={outerRadius}
                                    labelLine={false}
                                    isAnimationActive={true}
                                    animationDuration={500}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                        if (percent < 0.05) return null;
                                        return (
                                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className={labelFontSize}>
                                            {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                >
                                    {monthlyExpensesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend
                                    verticalAlign="bottom"
                                    content={({ payload }) => {
                                        return (
                                        <ul className="flex flex-col sm:flex-row flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground justify-center mt-4">
                                            {payload?.map((entry, index) => (
                                            <li key={`item-${index}`} className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                <span>{entry.value}</span>
                                            </li>
                                            ))}
                                        </ul>
                                        )
                                    }}
                                    />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>Yearly Expenses</CardTitle>
                    <CardDescription>
                        Proportion of expenses by year.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="year" />} />
                                <Pie
                                    data={yearlyExpensesData}
                                    dataKey="expenses"
                                    nameKey="year"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={outerRadius}
                                    labelLine={false}
                                    isAnimationActive={true}
                                    animationDuration={500}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                        if (percent < 0.05) return null;
                                        return (
                                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className={labelFontSize}>
                                            {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                >
                                    {yearlyExpensesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend
                                    verticalAlign="bottom"
                                    content={({ payload }) => {
                                        return (
                                        <ul className="flex flex-col sm:flex-row flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground justify-center mt-4">
                                            {payload?.map((entry, index) => (
                                            <li key={`item-${index}`} className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                <span>{entry.value}</span>
                                            </li>
                                            ))}
                                        </ul>
                                        )
                                    }}
                                    />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}
