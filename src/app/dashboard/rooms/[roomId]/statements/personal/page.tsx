
'use client';

import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/use-room';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useStudentDeadlines } from '@/hooks/use-student-deadlines';
import { Loader } from '@/components/loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';

const StatementSummary = ({ studentDetails, deadlines, loading }) => {
    const totalDues = deadlines.reduce((acc, d) => acc + d.amount, 0);
    const totalPaid = studentDetails?.totalPaid || 0;
    const balance = totalDues - totalPaid;

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="grid grid-cols-3 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Dues</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">₱{totalDues.toFixed(2)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">₱{totalPaid.toFixed(2)}</p>
                </CardContent>
            </Card>
            <Card className={balance > 0 ? "border-destructive" : ""}>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`text-2xl font-bold ${balance > 0 ? "text-destructive" : ""}`}>
                        ₱{balance.toFixed(2)}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default function PersonalStatementPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shouldPrint = searchParams.get('print') === 'true';
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { room, loading: roomLoading } = useRoom(roomId);
  const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
  const { deadlines, loading: deadlinesLoading } = useStudentDeadlines(roomId, user?.uid || '');

  const loading = roomLoading || profileLoading || deadlinesLoading;

  const handlePrint = () => {
    window.print();
  }

  useEffect(() => {
    if (shouldPrint && !loading) {
      handlePrint();
    }
  }, [shouldPrint, loading]);

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4">
                <Link
                href={`/dashboard/rooms/${roomId}/statements`}
                className="p-2 rounded-md hover:bg-muted"
                >
                <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                <h1 className="text-3xl font-bold">Personal Statement</h1>
                <p className="text-muted-foreground">
                    Your financial summary for {room?.name || '...'}
                </p>
                </div>
            </div>
            <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4"/>
                Print Statement
            </Button>
      </div>

      <Card className="shadow-lg print:shadow-none print:border-none">
        <CardHeader className="bg-muted/30 print:bg-transparent rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{room?.name || 'Room Statement'}</CardTitle>
              <CardDescription>Generated on {format(new Date(), 'PPP')}</CardDescription>
            </div>
            <div className="text-right">
                <p className="font-semibold">{userProfile?.name}</p>
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
             <div className="flex justify-center p-8"><Loader/></div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <StatementSummary studentDetails={userProfile} deadlines={deadlines} loading={loading}/>
              </div>
              
              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Contributions & Dues</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Deadline</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Amount Required</TableHead>
                            <TableHead>Amount Paid</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {deadlines.length > 0 ? (
                        deadlines.map((deadline) => (
                        <TableRow key={deadline.id}>
                            <TableCell className="font-medium">{deadline.description}</TableCell>
                            <TableCell>{deadline.dueDate ? format(deadline.dueDate.toDate(), 'PP') : 'N/A'}</TableCell>
                            <TableCell>₱{deadline.amount.toFixed(2)}</TableCell>
                            <TableCell>₱{deadline.amountPaid.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={deadline.status === 'Paid' ? 'secondary' : 'destructive'} className={deadline.status === 'Paid' ? 'bg-green-100 text-green-800' : ''}>
                                    {deadline.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            No deadlines or contributions found.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx global>{`
        @media print {
          body {
            background-color: white;
          }
          .print\:hidden {
            display: none;
          }
          .print\:shadow-none {
            box-shadow: none;
          }
           .print\:border-none {
            border: none;
          }
          .print\:bg-transparent {
            background-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}
