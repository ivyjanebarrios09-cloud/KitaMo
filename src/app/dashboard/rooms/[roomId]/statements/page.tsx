

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
  Eye,
  FileText,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRoom } from '@/hooks/use-room';
import { useParams, useRouter } from 'next/navigation';
import { Loader } from '@/components/loader';
import { useToast } from '@/hooks/use-toast';
import { useStudentDeadlines } from '@/hooks/use-student-deadlines';
import { format } from 'date-fns';
import { downloadCSV } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear + 2; i >= currentYear - 5; i--) {
        years.push(i.toString());
    }
    return years;
}


function ChairpersonStatementsPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;
    
    const yearOptions = generateYearOptions();
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState('december');
    
    // State for Class Financial Report inputs
    const [remarks, setRemarks] = useState('A contribution was collected and managed by the class finance officer. This report aims to maintain transparency and accountability. Copies will be submitted to the adviser for record-keeping and will also be posted on the class bulletin board for public viewing.');
    const [adviserName, setAdviserName] = useState('');
    const [adviserPosition, setAdviserPosition] = useState('Class Adviser');

    const constructUrl = (basePath: 'api' | 'view', download: boolean = false) => {
        const path = basePath === 'api'
            ? '/api/class-financial-report'
            : `/dashboard/rooms/${roomId}/statements/class-financial-report`;

        const queryParams = new URLSearchParams({
            year,
            month,
            remarks,
            adviserName,
            adviserPosition,
            roomId,
        });

        if (download) {
            queryParams.set('download', 'true');
        }

        return `${path}?${queryParams.toString()}`;
    };


  return (
    <div className='flex flex-col gap-4'>
        <div>
            <h2 className="text-lg font-semibold">Generate Statements</h2>
            <p className="text-muted-foreground text-sm">
            Select a statement type to view, download, or export financial data
            for this room.
            </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <FileText className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <CardTitle>Class Financial Report</CardTitle>
                                <CardDescription>Generate an official monthly financial report with collections, expenses, and financial position.</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={constructUrl('view')}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <a href={constructUrl('api', true)} target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    PDF
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                            <label className="text-xs font-medium">Select Month</label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="h-8">
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
                            <label className="text-xs font-medium">Select Year</label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select a year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {yearOptions.map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Remarks</label>
                            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter remarks for the report..." rows={3}/>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Class Adviser Name</label>
                                <Input value={adviserName} onChange={(e) => setAdviserName(e.target.value)} placeholder="e.g., Mrs. Florence S." className="h-8"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Adviser Position</label>
                                <Input value={adviserPosition} onChange={(e) => setAdviserPosition(e.target.value)} placeholder="e.g., Class Adviser" className="h-8"/>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    </div>
  );
}


function StudentStatementsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;
    const { user } = useAuth();
    const { deadlines, loading: deadlinesLoading } = useStudentDeadlines(roomId, user?.uid || '');

    const handleDownloadCSV = () => {
        if (deadlinesLoading || deadlines.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data Available',
                description: 'There is no statement data to download.',
            });
            return;
        }

        const headers = ['Deadline', 'Due Date', 'Amount Required', 'Amount Paid', 'Status'];
        const data = deadlines.map(d => ({
            'Deadline': d.description,
            'Due Date': d.dueDate ? format(d.dueDate.toDate(), 'yyyy-MM-dd') : 'N/A',
            'Amount Required': d.amount.toFixed(2),
            'Amount Paid': d.amountPaid.toFixed(2),
            'Status': d.status
        }));
        
        downloadCSV(data, headers, `personal-statement-${roomId}.csv`);
        
        toast({
            title: 'Download Started',
            description: 'Your personal statement CSV has started downloading.',
        });
    }

    const handleActionClick = (label: string) => {
        if (label === 'View') {
            router.push(`/dashboard/rooms/${roomId}/statements/personal`);
            return;
        }
        if (label === 'Excel') {
            handleDownloadCSV();
            return;
        }
        if (label === 'PDF') {
            router.push(`/dashboard/rooms/${roomId}/statements/personal?download=pdf`);
            return;
        }
    };

    const studentActions = [
        { label: 'View', icon: <Eye className="mr-2 h-4 w-4" />, disabled: false, onClick: () => handleActionClick('View') },
        { label: 'PDF', icon: <FileText className="mr-2 h-4 w-4" />, disabled: false, onClick: () => handleActionClick('PDF') },
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
                            <FileText className="h-6 w-6 text-primary" />
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
                        <Button key={index} variant="outline" onClick={action.onClick} disabled={action.disabled}>
                            {action.icon}
                            {action.label}
                        </Button>
                        ))}
                    </div>
                </CardContent>
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
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Statements</h1>
            </div>
            {isChairperson ? <ChairpersonStatementsPage /> : <StudentStatementsPage />}
        </div>
    )
}
