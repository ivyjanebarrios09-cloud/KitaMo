'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PiggyBank, Receipt, Users, Home, Wallet, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useParams } from 'next/navigation';
import { useRoom } from '@/hooks/use-room';
import { Loader } from '@/components/loader';
import { useStudentRoomDetails } from '@/hooks/use-student-room-details';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudentPaymentsInRoom } from '@/hooks/use-student-payments-in-room';
import { format } from 'date-fns';


const StatCard = ({ title, value, subtext, icon: Icon, currency = '₱', loading = false }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
      {loading ? <Loader className="h-6 w-6"/> : (
        <>
            <div className="text-2xl font-bold">
            {currency}{value}
            </div>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </>
      )}
      </CardContent>
    </Card>
  );

function ChairpersonRoomDashboard({ room, loading }) {
    const totalBalance = (room?.totalCollected || 0) - (room?.totalExpenses || 0);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2">
                <Home className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Balance"
                    value={totalBalance.toFixed(2)}
                    subtext={`₱${room?.totalCollected?.toFixed(2) || '0.00'} collected - ₱${room?.totalExpenses?.toFixed(2) || '0.00'} spent`}
                    icon={PiggyBank}
                    loading={loading}
                />
                <StatCard
                    title="Students"
                    value={room?.studentCount || '0'}
                    subtext={`${room?.studentCount || 0} members have joined this room`}
                    icon={Users}
                    currency=""
                    loading={loading}
                />
                <StatCard
                    title="Total Collected"
                    value={room?.totalCollected?.toFixed(2) || '0.00'}
                    subtext="Total funds received from students"
                    icon={Receipt}
                    loading={loading}
                />
            </div>
        </div>
    );
}

function StudentRoomDashboard({ roomId, userId }) {
    const { studentDetails, loading: studentLoading } = useStudentRoomDetails(roomId, userId);
    const { payments, loading: paymentsLoading } = useStudentPaymentsInRoom(roomId, userId);
    
    const loading = studentLoading || paymentsLoading;
    const totalDues = (studentDetails?.totalPaid || 0) + (studentDetails?.totalOwed || 0);
    const paymentProgress = totalDues > 0 ? ((studentDetails?.totalPaid || 0) / totalDues) * 100 : 100;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2">
                <Home className="w-6 h-6" />
                <h1 className="text-2xl font-bold">My Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <StatCard
                    title="Total Unpaid"
                    value={(studentDetails?.totalOwed || 0).toFixed(2)}
                    subtext="Your outstanding balance for this room."
                    icon={Wallet}
                    loading={loading}
                    currency="₱"
                />
                <StatCard
                    title="Total Paid"
                    value={(studentDetails?.totalPaid || 0).toFixed(2)}
                    subtext="Your total contributions to this room."
                    icon={CreditCard}
                    loading={loading}
                    currency="₱"
                />
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Overall Payment Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader className="h-6 w-6"/> : (
                           <div className="space-y-2">
                                <Progress value={paymentProgress} className="h-2"/>
                                <p className="text-xs text-muted-foreground">You've paid {paymentProgress.toFixed(0)}% of your total dues.</p>
                           </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A record of all payments you have made in this room.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Note / For</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        <div className="flex justify-center"><Loader /></div>
                                    </TableCell>
                                </TableRow>
                            ) : payments.length > 0 ? (
                                payments.map(payment => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{payment.date ? format(payment.date.toDate(), 'PP') : 'N/A'}</TableCell>
                                        <TableCell>{payment.name}</TableCell>
                                        <TableCell className="text-right font-medium">₱{payment.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No payments made yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default function RoomDashboardPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const { user } = useAuth();
    const { room, loading } = useRoom(roomId);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader /></div>
    }

    const isChairperson = user?.uid === room?.ownerId;

    if (isChairperson) {
        return <ChairpersonRoomDashboard room={room} loading={loading} />;
    }
    
    return <StudentRoomDashboard roomId={roomId} userId={user?.uid} />;
}
