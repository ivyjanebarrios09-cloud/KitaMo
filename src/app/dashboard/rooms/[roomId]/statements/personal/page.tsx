
'use client';

import { ArrowLeft, Printer, Download } from 'lucide-react';
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
import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StatementSummary = ({ studentDetails, deadlines, loading }) => {
    const totalDues = deadlines.reduce((acc, d) => acc + d.amount, 0);
    const totalPaid = studentDetails?.totalPaid || 0;
    const balance = totalDues - totalPaid;

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  const downloadAction = searchParams.get('download');
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { room, loading: roomLoading } = useRoom(roomId);
  const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
  const { deadlines, loading: deadlinesLoading } = useStudentDeadlines(roomId, user?.uid || '');
  const [isDownloading, setIsDownloading] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);

  const loading = roomLoading || profileLoading || deadlinesLoading;

  const handleDownloadPdf = async () => {
    if (!statementRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
        const canvas = await html2canvas(statementRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`personal-statement-${roomId}.pdf`);
    } catch(err) {
        console.error("Error generating PDF", err);
    } finally {
        setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (downloadAction === 'pdf' && !loading) {
      handleDownloadPdf();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadAction, loading]);

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-4">
                <Link
                href={`/dashboard/rooms/${roomId}/statements`}
                className="p-2 rounded-md hover:bg-muted"
                >
                <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Personal Statement</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                    Your financial summary for {room?.name || '...'}
                </p>
                </div>
            </div>
            <Button onClick={handleDownloadPdf} variant="outline" disabled={isDownloading} className="w-full sm:w-auto">
                {isDownloading ? <Loader className="mr-2 h-4 w-4"/> : <Download className="mr-2 h-4 w-4"/>}
                {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Button>
      </div>

      <div ref={statementRef} className="bg-background">
        <Card className="shadow-lg print:shadow-none print:border-none">
          <CardHeader className="bg-muted/30 print:bg-transparent rounded-t-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <CardTitle className="text-xl sm:text-2xl">{room?.name || 'Room Statement'}</CardTitle>
                <CardDescription>Generated on {format(new Date(), 'PPP')}</CardDescription>
              </div>
              <div className="text-left sm:text-right">
                  <p className="font-semibold">{userProfile?.name}</p>
                  <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
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
                  <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Amount Required</TableHead>
                                <TableHead className="text-right">Amount Paid</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {deadlines.length > 0 ? (
                            deadlines.map((deadline) => (
                            <TableRow key={deadline.id}>
                                <TableCell className="font-medium">{deadline.description}</TableCell>
                                <TableCell>{deadline.dueDate ? format(deadline.dueDate.toDate(), 'PP') : 'N/A'}</TableCell>
                                <TableCell className="text-right">₱{deadline.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-right">₱{deadline.amountPaid.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
