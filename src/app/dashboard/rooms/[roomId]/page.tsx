'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, Receipt, Users, Home } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useParams } from 'next/navigation';
import { useRoom } from '@/hooks/use-room';
import { Loader } from '@/components/loader';


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
            <p className="text-xs text-muted-foreground">{subtext}</p>
        </>
      )}
      </CardContent>
    </Card>
  );

export default function RoomDashboardPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const { room, loading } = useRoom(roomId);

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
