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

const monthlyExpensesData = [{ month: 'Dec 2025', expenses: 300 }];
const yearlyExpensesData = [{ year: '2025', expenses: 300 }];

const chartConfig = {
  expenses: {
    label: 'Expenses',
    color: 'hsl(var(--primary))',
  },
};

export default function ExpenseAnalyticsPage() {
  const params = useParams();
  const { roomId } = params;

  const getRoomName = (id: string) => {
    const roomNames: { [key: string]: string } = {
      'socrates-fund-monitoring': 'Socrates Fund Monitoring',
      'rizal-monitoring-funds': 'Rizal Monitoring Funds',
      'bonifacio-fund-monitoring': 'Bonifacio Fund Monitoring',
    };
    return roomNames[id as string] || 'Room Not Found';
  };

  const roomName = getRoomName(roomId as string);

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
            Visualizing financial data for: {roomName}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                />
                <YAxis
                  tickFormatter={(value) => `₱${value}`}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Legend />
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
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Legend />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
