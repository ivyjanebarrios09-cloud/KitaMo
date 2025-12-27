
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList,
  CalendarDays,
  BarChart3,
  FileText,
  Eye,
  FileSpreadsheet,
  Wallet,
} from 'lucide-react';
import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRoom } from '@/hooks/use-room';
import { useParams } from 'next/navigation';
import { Loader } from '@/components/loader';
import { useToast } from '@/hooks/use-toast';

const StatementCard = ({
  icon: Icon,
  title,
  description,
  children,
  actions,
}) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex items-start gap-4">
        <Icon className="h-6 w-6 text-primary mt-1" />
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {children && <div className="grid gap-4 mb-6">{children}</div>}
      <div className="flex items-center justify-end gap-2">
        {actions.map((action, index) => (
          <Button key={index} variant="outline" disabled>
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);

const actions = [
  { label: 'View', icon: <Eye className="mr-2 h-4 w-4" /> },
  { label: 'PDF', icon: <FileText className="mr-2 h-4 w-4" /> },
  { label: 'Excel', icon: <FileSpreadsheet className="mr-2 h-4 w-4" /> },
];

function ChairpersonStatementsPage() {
  return (
    <div className='flex flex-col gap-6'>
        <div>
            <h2 className="text-xl font-semibold">Generate Statements</h2>
            <p className="text-muted-foreground">
            Select a statement type to view, download, or export financial data
            for this room.
            </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatementCard
            icon={CalendarDays}
            title="Financial Statement for the Whole Year"
            description="A comprehensive report of all expenses, deadlines, and payments for the entire year."
            actions={actions}
            >
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Year</label>
                <Select defaultValue="2025">
                <SelectTrigger>
                    <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
                </Select>
            </div>
            </StatementCard>

            <StatementCard
            icon={CalendarDays}
            title="Financial Statement for a Specific Month"
            description="A detailed report of all financial activities for a single selected month."
            actions={actions}
            >
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <label className="text-sm font-medium">Select Month</label>
                <Select defaultValue="december">
                    <SelectTrigger>
                    <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="january">January</SelectItem>
                    <SelectItem value="february">February</SelectItem>
                    <SelectItem value="march">March</SelectItem>
                    <SelectItem value="april">April</SelectItem>
                    <SelectItem value="may">May</SelectItem>
                    <SelectItem value="june">June</SelectItem>
                    <SelectItem value="july">July</SelectItem>
                    <SelectItem value="august">August</SelectItem>
                    <SelectItem value="september">September</SelectItem>
                    <SelectItem value="october">October</SelectItem>
                    <SelectItem value="november">November</SelectItem>
                    <SelectItem value="december">December</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                <label className="text-sm font-medium">Select Year</label>
                <Select defaultValue="2025">
                    <SelectTrigger>
                    <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            </StatementCard>

            <StatementCard
            icon={BarChart3}
            title="Summary of Collection"
            description="An overview of total funds collected, payment status per student, and collection progress."
            actions={actions}
            />

            <StatementCard
            icon={FileText}
            title="Summary of Expenses"
            description="A breakdown of all expenses, showing where the collected funds were spent."
            actions={actions}
            />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon!</CardTitle>
                <CardDescription>
                    This feature is currently under construction. Please check back later for full statement generation and download functionality.
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
  );
}


function StudentStatementsPage() {
    const { toast } = useToast();

    const handleActionClick = (label: string) => {
        toast({
        title: 'Generating Statement...',
        description: `Your ${label} download will begin shortly.`,
        });
    };

    const studentActions = [
        { label: 'View', icon: <Eye className="mr-2 h-4 w-4" /> },
        { label: 'PDF', icon: <FileText className="mr-2 h-4 w-4" /> },
        { label: 'Excel', icon: <FileSpreadsheet className="mr-2 h-4 w-4" /> },
      ];

    return (
        <div className="flex flex-col gap-6">
             <div>
                <h2 className="text-xl font-semibold">Download Personal Statement</h2>
                <p className="text-muted-foreground">
                    Select a statement type to view, download, or export your financial data for this room.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <Wallet className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Personal Expense Report</CardTitle>
                            <CardDescription>
                                A detailed report of all your required contributions and payments for this room.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-end gap-2">
                        {studentActions.map((action, index) => (
                        <Button key={index} variant="outline" onClick={() => handleActionClick(action.label)}>
                            {action.icon}
                            {action.label}
                        </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Coming Soon!</CardTitle>
                    <CardDescription>
                        Full statement generation and download functionality is currently under construction. This is a test.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}

export default function RoomStatementsPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const { user } = useAuth();
    const { room, loading } = useRoom(roomId);
  
    if (loading) {
      return <div className="flex justify-center p-8"><Loader /></div>
    }
  
    const isChairperson = user?.uid === room?.createdBy;
  
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Statements</h1>
            </div>
            {isChairperson ? <ChairpersonStatementsPage /> : <StudentStatementsPage />}
        </div>
    )
}
