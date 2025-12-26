'use client';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
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
import { useAuth } from '@/context/auth-context';
import { PiggyBank, Receipt, Scale, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, currency = '₱' }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {currency}
        {value}
      </div>
    </CardContent>
  </Card>
);

const transactions = [
  {
    type: 'deadline',
    date: 'Dec 30, 2025',
    room: 'Socrates Fund Monitoring',
    description: 'Food Expenses',
    status: 'Paid',
    amount: 150.0,
  },
  {
    type: 'deadline',
    date: 'Dec 30, 2025',
    room: 'Rizal Monitoring Funds',
    description: 'Year End Party',
    status: 'Unpaid',
    amount: 500.0,
  },
  {
    type: 'deadline',
    date: 'Dec 29, 2025',
    room: 'Socrates Fund Monitoring',
    description: 'Year End Party',
    status: 'Paid',
    amount: 500.0,
  },
  {
    type: 'expense',
    date: 'Dec 24, 2025',
    room: 'Rizal Monitoring Funds',
    description: 'Christmas Decor',
    status: 'Paid',
    amount: 300.0,
  },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const chairpersonName = user?.email?.split('@')[0] || 'Chairperson';

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {chairpersonName}! Here's an overview of all your rooms.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Collected" value="650.00" icon={PiggyBank} />
        <StatCard title="Total Expenses" value="600.00" icon={Receipt} />
        <StatCard title="Net Balance" value="50.00" icon={Scale} />
        <StatCard
          title="Total Students"
          value="1"
          icon={Users}
          currency=""
        />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent History</CardTitle>
          <p className="text-sm text-muted-foreground">
            The last 10 transactions across all of your rooms.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.type === 'expense'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="capitalize"
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>
                    <a href="#" className="text-primary hover:underline">
                      {transaction.room}
                    </a>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === 'Paid' ? 'default' : 'destructive'
                      }
                      className={transaction.status === 'Paid' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : ''}
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₱{transaction.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
