
'use client';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/context/auth-context';
import { PiggyBank, Receipt, Scale, Users } from 'lucide-react';
import { Loader } from '@/components/loader';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUserRooms } from '@/hooks/use-user-rooms';
import { useUserTransactions } from '@/hooks/use-user-transactions';

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

const TransactionRow = ({ transaction, roomName }) => (
    <div className="flex justify-between items-center py-4 border-b last:border-b-0">
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
                 <Badge
                    variant={
                    transaction.type === 'debit'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="capitalize w-16 justify-center"
                >
                    {transaction.type}
                </Badge>
            </div>
            <div>
                <p className="font-semibold truncate max-w-[150px] sm:max-w-none">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                    <Link href={`/dashboard/rooms/${transaction.roomId}`} className="hover:underline">
                        {roomName}
                    </Link>
                    {' · '}
                    {transaction.createdAt ? format(transaction.createdAt.toDate(), 'PP') : 'N/A'}
                </p>
            </div>
        </div>
        <div className="font-medium text-right whitespace-nowrap">
            ₱{transaction.amount.toFixed(2)}
        </div>
    </div>
)

const StudentTransactionRow = ({ transaction, roomName }) => (
    <div className="flex justify-between items-center py-4 border-b last:border-b-0">
        <div className="flex items-center gap-3">
             <div className="flex-shrink-0">
                <Badge
                    variant={
                    transaction.type === 'debit'
                        ? 'destructive'
                        : transaction.type === 'deadline' ? 'outline' : 'secondary'
                    }
                    className="capitalize w-20 justify-center"
                >
                    {transaction.type}
                </Badge>
            </div>
            <div>
                <p className="font-semibold truncate max-w-[150px] sm:max-w-none">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                    {roomName}
                    {' · '}
                    {transaction.createdAt ? format(transaction.createdAt.toDate(), 'PP') : 'N/A'}
                </p>
            </div>
        </div>
         <div className="font-medium text-right whitespace-nowrap">
            ₱{transaction.amount.toFixed(2)}
        </div>
    </div>
)


function ChairpersonDashboard() {
    const { user } = useAuth();
    const { rooms, loading: roomsLoading } = useUserRooms(user?.uid, true);
    const roomIds = rooms.map(r => r.id);
    const { transactions, loading: transactionsLoading } = useUserTransactions(roomIds);
    const { userProfile } = useUserProfile(user?.uid);
    
    const chairpersonName = userProfile?.name || user?.email?.split('@')[0] || 'Chairperson';

    const loading = roomsLoading || transactionsLoading;

    const stats = rooms.reduce((acc, room) => {
        const collected = room.totalCollected || 0;
        const expenses = room.totalExpenses || 0;
        acc.totalCollected += collected;
        acc.totalExpenses += expenses;
        acc.totalMembers += room.members?.length > 1 ? room.members.length -1 : 0;
        return acc;
    }, {
        totalCollected: 0,
        totalExpenses: 0,
        totalMembers: 0,
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Collected" value={stats.totalCollected.toFixed(2)} icon={PiggyBank} loading={loading}/>
                <StatCard title="Total Expenses" value={stats.totalExpenses.toFixed(2)} icon={Receipt} loading={loading} />
                <StatCard title="Net Balance" value={stats.netBalance.toFixed(2)} icon={Scale} loading={loading} />
                <StatCard
                title="Total Members"
                value={stats.totalMembers}
                icon={Users}
                currency=""
                loading={loading}
                />
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Recent History</CardTitle>
                <CardDescription>
                    The last 10 transactions across all of your rooms.
                </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0 max-h-[400px] overflow-y-auto">
                    {loading ? (
                         <div className="flex justify-center p-8"><Loader/></div>
                    ) : transactions.length > 0 ? (
                        <div className="flow-root">
                            <div className="-my-4 divide-y divide-border">
                                {transactions.map((transaction) => (
                                    <TransactionRow key={transaction.id} transaction={transaction} roomName={getRoomName(transaction.roomId)}/>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                            No recent transactions found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function StudentDashboard() {
    const { user } = useAuth();
    const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
    const { rooms, loading: roomsLoading } = useUserRooms(user?.uid, false);
    const roomIds = rooms.map(r => r.id);
    const { transactions, loading: transactionsLoading } = useUserTransactions(roomIds);
    
    const studentName = userProfile?.name || user?.email?.split('@')[0] || 'Student';

    const loading = profileLoading || roomsLoading || transactionsLoading;

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
                <CardDescription>
                    The latest deadlines and expenses across all of your joined rooms.
                </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0 max-h-[400px] overflow-y-auto">
                     {loading ? (
                        <div className="flex justify-center p-8"><Loader/></div>
                    ) : transactions.length > 0 ? (
                        <div className="flow-root">
                            <div className="-my-4 divide-y divide-border">
                                {transactions.map((transaction) => (
                                    <StudentTransactionRow key={transaction.id} transaction={transaction} roomName={getRoomName(transaction.roomId)}/>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                            No recent transactions found.
                        </div>
                    )}
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

    
