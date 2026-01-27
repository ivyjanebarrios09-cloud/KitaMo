
'use client';

import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/use-room';
import { useRoomTransactions } from '@/hooks/use-room-transactions';
import { Loader } from '@/components/loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, getMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const monthMap = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, 
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

export default function MonthlyStatementPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const downloadAction = searchParams.get('download');
  const year = searchParams.get('year');
  const monthName = searchParams.get('month');
  const roomId = params.roomId as string;
  const { room, loading: roomLoading } = useRoom(roomId);
  const { transactions, loading: transactionsLoading } = useRoomTransactions(roomId);
  const [isDownloading, setIsDownloading] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loading = roomLoading || transactionsLoading;

  const monthNumber = monthName ? monthMap[monthName.toLowerCase()] : -1;
  const yearNumber = year ? parseInt(year) : new Date().getFullYear();

  const filteredTransactions = transactions.filter(t => {
      if (!t.createdAt) return false;
      const txDate = t.createdAt.toDate();
      return txDate.getFullYear() === yearNumber && txDate.getMonth() === monthNumber;
  });

  const handleDownloadPdf = async () => {
    if (!statementRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const element = statementRef.current;
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = 'white';
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      element.style.backgroundColor = originalBg;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.width / canvas.height;
      
      let imgWidth = pdfWidth - 20;
      let imgHeight = imgWidth / canvasAspectRatio;

      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * canvasAspectRatio;
      }

      const x = (pdfWidth - imgWidth) / 2;
      const y = 10;
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`monthly-statement-${room?.name || roomId}-${year}-${monthName}.pdf`);
    } catch(err) {
        console.error("Error generating PDF", err);
    } finally {
        setIsDownloading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (loading || filteredTransactions.length === 0) {
        toast({ variant: 'destructive', title: 'No Data Available', description: 'There is no data to download for the selected period.' });
        return;
    }
    const headers = ['Date', 'Type', 'Description', 'User', 'Amount (PHP)'];
    const data = filteredTransactions.map(t => ({
        'Date': t.createdAt ? format(t.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
        'Type': t.type,
        'Description': t.description,
        'User': t.userName || 'N/A',
        'Amount (PHP)': t.amount.toFixed(2),
    }));
    downloadCSV(data, headers, `monthly-statement-${room?.name || roomId}-${year}-${monthName}.csv`);
    toast({ title: 'Download Started', description: 'Your monthly statement CSV has started downloading.' });
  }

  useEffect(() => {
    if (!loading && !isDownloading) {
      if (downloadAction === 'pdf') {
        handleDownloadPdf();
      } else if (downloadAction === 'csv') {
        handleDownloadCSV();
      }
    }
  }, [downloadAction, loading, isDownloading]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/rooms/${roomId}/statements`} className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold capitalize">Monthly Statement</h1>
            <p className="text-muted-foreground text-sm sm:text-base">{monthName} {year} for {room?.name || '...'}</p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button onClick={handleDownloadPdf} variant="outline" disabled={isDownloading} className="flex-1">
            {isDownloading ? <Loader className="mr-2 h-4 w-4"/> : <Download className="mr-2 h-4 w-4"/>} PDF
          </Button>
          <Button onClick={handleDownloadCSV} variant="outline" disabled={loading} className="flex-1">
            <Download className="mr-2 h-4 w-4"/> CSV
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8"><Loader/></div>
      ) : (
        <div ref={statementRef} className="bg-white rounded-lg shadow-md p-6 sm:p-10 text-black">
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-primary capitalize">Monthly Financial Statement</h1>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">Room:</span> {room?.name}</p>
              <p><span className="font-semibold">Period:</span> {monthName}, {year}</p>
              <p className="text-xs text-gray-500">Generated on: {format(new Date(), 'PP p')}</p>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/90 hover:bg-primary/90">
                    <TableHead className="text-primary-foreground">Date</TableHead>
                    <TableHead className="text-primary-foreground">Type</TableHead>
                    <TableHead className="text-primary-foreground">Description</TableHead>
                    <TableHead className="text-right text-primary-foreground">Amount (PHP)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.createdAt ? format(t.createdAt.toDate(), 'PP') : 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant={t.type === 'credit' ? 'secondary' : t.type === 'debit' ? 'destructive' : 'outline'} className="capitalize">{t.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell className="text-right">₱{t.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">No transactions for this month.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-8 space-y-2 text-right text-sm">
              <p><span className="text-muted-foreground">Total Income:</span> <span className='font-semibold'>PHP {totalIncome.toFixed(2)}</span></p>
              <p><span className="text-muted-foreground">Total Expenses:</span> <span className='font-semibold'>PHP {totalExpenses.toFixed(2)}</span></p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background-color: white; }
          .print\:hidden { display: none; }
        }
      `}</style>
    </div>
  );
}
