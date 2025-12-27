
'use client';

import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/use-room';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useStudentDeadlines } from '@/hooks/use-student-deadlines';
import { Loader } from '@/components/loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StatementSummary = ({ deadlines, loading }) => {
    const totalDues = deadlines.reduce((acc, d) => acc + d.amount, 0);
    const totalPaid = deadlines.reduce((acc, d) => acc + d.amountPaid, 0);
    const balance = totalDues - totalPaid;

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="mt-8 space-y-2 text-right">
            <p><span className="font-semibold">Total Amount Due:</span> PHP {totalDues.toFixed(2)}</p>
            <p><span className="font-semibold">Total Amount Paid:</span> PHP {totalPaid.toFixed(2)}</p>
            <p className="font-bold text-lg"><span className="font-semibold">Remaining Balance:</span> PHP {balance.toFixed(2)}</p>
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
        const canvas = await html2canvas(statementRef.current, {
            scale: 2,
            useCORS: true, 
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;

        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`personal-statement-${roomId}.pdf`);

    } catch(err) {
        console.error("Error generating PDF", err);
    } finally {
        setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (downloadAction === 'pdf' && !loading && !isDownloading) {
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

      <div ref={statementRef} className="bg-background p-4 sm:p-8">
            {loading ? (
              <div className="flex justify-center p-8"><Loader/></div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold">KitaMo! Personal Statement</h1>
                </div>
                <div className="space-y-1">
                    <p><span className="font-semibold">Student:</span> {userProfile?.name}</p>
                    <p><span className="font-semibold">Room:</span> {room?.name}</p>
                    <p><span className="font-semibold">Statement Type:</span> Personal Expense Report</p>
                    <p className="text-sm text-muted-foreground">Generated on: {format(new Date(), 'PP p')}</p>
                </div>

                <div>
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-primary hover:bg-primary/90">
                                <TableHead className="text-primary-foreground">Deadline Title</TableHead>
                                <TableHead className="text-primary-foreground">Due Date</TableHead>
                                <TableHead className="text-right text-primary-foreground">Amount Due (PHP)</TableHead>
                                <TableHead className="text-right text-primary-foreground">Amount Paid (PHP)</TableHead>
                                <TableHead className="text-right text-primary-foreground">Status</TableHead>
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
                                    <Badge variant={deadline.status === 'Paid' ? 'secondary' : 'outline'} className={deadline.status === 'Paid' ? 'bg-green-100 text-green-800' : 'border-destructive text-destructive'}>
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
                <div>
                  <StatementSummary deadlines={deadlines} loading={loading}/>
                </div>
              </div>
            )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white;
          }
          .print\:hidden {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

