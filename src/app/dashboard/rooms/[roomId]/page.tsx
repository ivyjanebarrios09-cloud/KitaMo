'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, PiggyBank, Receipt } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, currency = '₱' }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {currency}{value}
        </div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );

export default function RoomDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
       <div className="flex items-center gap-2">
            <Home className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
       </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Balance"
          value="350.00"
          subtext="₱650.00 collected - ₱300.00 spent"
          icon={PiggyBank}
        />
        <StatCard
            title="Students"
            value="1"
            subtext="1 members have joined this room"
            icon={Users}
            currency=""
        />
        <StatCard
          title="Total Collected"
          value="650.00"
          subtext="Total funds received from students"
          icon={Receipt}
        />
      </div>
    </div>
  );
}
