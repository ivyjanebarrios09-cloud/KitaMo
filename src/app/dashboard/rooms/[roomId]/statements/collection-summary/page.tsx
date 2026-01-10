
'use client';

import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/use-room';
import { Loader } from '@/components/loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV } from '@/lib/utils';
import { useRoomTransactions } from '@/hooks/use-room-transactions';

export default function CollectionSummaryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const downloadAction = searchParams.get('download');
  const roomId = params.roomId as string;
  const { room, loading: roomLoading } = useRoom(roomId);
  const { transactions: payments, loading: paymentsLoading } = useRoomTransactions(roomId, 'credit');
  
  const [isDownloading, setIsDownloading] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loading = roomLoading || paymentsLoading;

  const totalCollected = payments.reduce((acc, item) => acc + item.amount, 0);


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
      pdf.save(`collection-summary-${roomId}.pdf`);
    } catch(err) {
        console.error("Error generating PDF", err);
    } finally {
        setIsDownloading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (loading || payments.length === 0) {
        toast({ variant: 'destructive', title: 'No Data Available', description: 'There is no data to download.' });
        return;
    }
    const headers = ['Date', 'Description', 'Amount (PHP)'];
    const data = payments.map(item => ({
        'Date': format(item.createdAt.toDate(), 'yyyy-MM-dd'),
        'Description': item.description,
        'Amount (PHP)': item.amount.toFixed(2),
    }));
    downloadCSV(data, headers, `collection-summary-${roomId}.csv`);
    toast({ title: 'Download Started', description: 'Your collection summary CSV has started downloading.' });
  }

  useEffect(() => {
    if (!loading && !isDownloading) {
      if (downloadAction === 'pdf') {
        handleDownloadPdf();
      } else if (downloadAction === 'csv') {
        handleDownloadCSV();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadAction, loading]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/rooms/${roomId}/statements`} className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Collection Summary</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Financial overview for {room?.name || '...'}</p>
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
              <h1 className="text-2xl font-bold text-primary">Summary of Collections</h1>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">Room:</span> {room?.name}</p>
              <p className="text-xs text-gray-500">Generated on: {format(new Date(), 'PP p')}</p>
              <p className="text-sm mt-2">
                The total amount collected from all students of {room?.name} is:
              </p>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary/90">
                    <TableHead className="text-primary-foreground">Date</TableHead>
                    <TableHead className="text-primary-foreground">Description</TableHead>
                    <TableHead className="text-right text-primary-foreground">Amount (PHP)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length > 0 ? (
                    payments.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{format(item.createdAt.toDate(), 'MMM d')}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">₱{item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">No payments have been recorded yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
                 <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2} className="text-right">Total</TableCell>
                    <TableCell className="text-right">P {totalCollected.toFixed(2)}</TableCell>
                 </TableRow>
              </Table>
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
