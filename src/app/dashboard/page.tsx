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
import { useUserRooms } from '@/hooks/use-user-rooms';
import { Loader } from '@/components/loader';
import Link from 'next/link';
import { useUserTransactions } from '@/hooks/use-user-transactions';
import { format } from 'date-fns';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useStudentRooms } from '@/hooks/use-student-rooms';
import { useStudentTransactions } from '@/hooks/use-student-transactions';

const StatCard = ({ title, value, icon: Icon, currency = '₱', loading = false }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
        {loading ? <Loader className="h-6 w-6"/> : (
            <div className="text-2xl font-bold">
                {currency}
                {value}
            </div>
        )}
    </CardContent>
  </Card>
);


function ChairpersonDashboard() {
    const { user } = useAuth();
    const { rooms, loading: roomsLoading } = useUserRooms(user?.uid);
    const { transactions, loading: transactionsLoading } = useUserTransactions(user?.uid);
    const chairpersonName = user?.displayName || user?.email?.split('@')[0] || 'Chairperson';

    const loading = roomsLoading || transactionsLoading;

    const stats = rooms.reduce((acc, room) => {
        acc.totalCollected += room.totalCollected || 0;
        acc.totalExpenses += room.totalExpenses || 0;
        acc.totalStudents += room.studentCount || 0;
        return acc;
    }, {
        totalCollected: 0,
        totalExpenses: 0,
        totalStudents: 0
    });

    stats.netBalance = stats.totalCollected - stats.totalExpenses;

    const getRoomName = (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        return room ? room.name : 'Unknown Room';
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                Welcome back, {chairpersonName}! Here's an overview of all your rooms.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Collected" value={stats.totalCollected.toFixed(2)} icon={PiggyBank} loading={loading}/>
                <StatCard title="Total Expenses" value={stats.totalExpenses.toFixed(2)} icon={Receipt} loading={loading} />
                <StatCard title="Net Balance" value={stats.netBalance.toFixed(2)} icon={Scale} loading={loading} />
                <StatCard
                title="Total Students"
                value={stats.totalStudents}
                icon={Users}
                currency=""
                loading={loading}
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
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                <div className="flex justify-center p-8"><Loader/></div>
                            </TableCell>
                        </TableRow>
                    ) : transactions.length > 0 ? (
                        transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
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
                            <TableCell>{transaction.date ? format(transaction.date.toDate(), 'PP') : 'N/A'}</TableCell>
                            <TableCell>
                            <Link href={`/dashboard/rooms/${transaction.roomId}`} className="text-primary hover:underline">
                                {getRoomName(transaction.roomId)}
                            </Link>
                            </TableCell>
                            <TableCell>{transaction.name}</TableCell>
                            <TableCell className="text-right font-medium">
                            ₱{transaction.amount.toFixed(2)}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            No recent transactions found.
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

function StudentDashboard() {
    const { user } = useAuth();
    const { rooms, loading: roomsLoading } = useStudentRooms(user?.uid);
    const { transactions, loading: transactionsLoading } = useStudentTransactions(rooms.map(r => r.id));
    const studentName = user?.displayName || user?.email?.split('@')[0] || 'Student';

    const loading = roomsLoading || transactionsLoading;

    const getRoomName = (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        return room ? room.name : 'Unknown Room';
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome, {studentName}! Here's the latest activity from your rooms.
                </p>
            </div>
             <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Recent History</CardTitle>
                <p className="text-sm text-muted-foreground">
                    The latest deadlines and expenses across all of your joined rooms.
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
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                <div className="flex justify-center p-8"><Loader/></div>
                            </TableCell>
                        </TableRow>
                    ) : transactions.length > 0 ? (
                        transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
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
                            <TableCell>{transaction.date ? format(transaction.date.toDate(), 'PP') : 'N/A'}</TableCell>
                            <TableCell>
                                {getRoomName(transaction.roomId)}
                            </TableCell>
                            <TableCell>{transaction.name}</TableCell>
                            <TableCell className="text-right font-medium">
                            ₱{transaction.amount.toFixed(2)}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            No recent transactions found.
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

export default function DashboardPage() {
    const { user } = useAuth();
    const { userProfile, loading } = useUserProfile(user?.uid);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader/></div>
    }

    if (userProfile?.role === 'student') {
        return <StudentDashboard />;
    }
    
    return <ChairpersonDashboard />;
}
