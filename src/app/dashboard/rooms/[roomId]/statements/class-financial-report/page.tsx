
'use client';

import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/use-room';
import { useRoomTransactions } from '@/hooks/use-room-transactions';
import { Loader } from '@/components/loader';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/context/auth-context';

const monthMap = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, 
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

export default function ClassFinancialReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const downloadAction = searchParams.get('download');
  const year = searchParams.get('year');
  const monthName = searchParams.get('month');
  const roomId = params.roomId as string;
  
  const { user } = useAuth();
  const { room, loading: roomLoading } = useRoom(roomId);
  const { userProfile, loading: profileLoading } = useUserProfile(room?.createdBy);
  const { transactions, loading: transactionsLoading } = useRoomTransactions(roomId);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loading = roomLoading || transactionsLoading || profileLoading;

  const monthNumber = monthName ? monthMap[monthName.toLowerCase()] : -1;
  const yearNumber = year ? parseInt(year) : new Date().getFullYear();

  const { collections, expenses } = transactions.reduce((acc, t) => {
      if (!t.createdAt) return acc;
      const txDate = t.createdAt.toDate();
      const isInMonth = txDate.getFullYear() === yearNumber && txDate.getMonth() === monthNumber;
      
      if (isInMonth) {
          if (t.type === 'credit') acc.collections.push(t);
          if (t.type === 'debit') acc.expenses.push(t);
      }
      return acc;
  }, { collections: [], expenses: [] });

  const totalCollections = collections.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const financialPosition = totalCollections - totalExpenses; // Simplified for now

  const handleDownloadPdf = async () => {
    if (!statementRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const element = statementRef.current;
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = 'white';
      
      const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true,
          logging: true,
          onclone: (document) => {
              // On the cloned document, we can add styles that will only affect the canvas capture
              const reportContent = document.querySelector('.report-content');
              if (reportContent) {
                  (reportContent as HTMLElement).style.boxShadow = 'none';
                  (reportContent as HTMLElement).style.border = 'none';
              }
          }
      });
      element.style.backgroundColor = originalBg;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight * (canvas.height > 1122 ? 1.4 : 1)); // Extend height if content is long
      pdf.save(`class-financial-report-${roomId}-${year}-${monthName}.pdf`);
    } catch(err) {
        console.error("Error generating PDF", err);
        toast({variant: "destructive", title: "Error generating PDF", description: "An error occurred while trying to create the PDF."})
    } finally {
        setIsDownloading(false);
    }
  };


  useEffect(() => {
    if (!loading && !isDownloading) {
      if (downloadAction === 'pdf') {
        handleDownloadPdf();
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
            <h1 className="text-2xl sm:text-3xl font-bold">Class Financial Report</h1>
            <p className="text-muted-foreground text-sm sm:text-base capitalize">{monthName} {year} for {room?.name || '...'}</p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button onClick={handleDownloadPdf} variant="outline" disabled={isDownloading} className="flex-1">
            {isDownloading ? <Loader className="mr-2 h-4 w-4"/> : <Download className="mr-2 h-4 w-4"/>} PDF
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8"><Loader/></div>
      ) : (
        <div ref={statementRef} className="bg-gray-100 p-4">
            <div className="max-w-4xl mx-auto bg-white p-8 report-content">
                {/* Header */}
                <div className="text-center mb-8">
                    <img src="/image/logoooo.png" alt="Logo" className="w-16 h-16 mx-auto mb-2"/>
                    <h2 className="text-xl font-bold">Saint Louis College</h2>
                    <p className="text-sm">of San Fernando, La Union</p>
                    <p className="text-xs">The Beacon of Wisdom in the North</p>
                    <h3 className="text-lg font-bold mt-2">SENIOR HIGH SCHOOL</h3>
                    <div className="flex justify-around text-xs mt-2 text-gray-600">
                        <span>● Center of Excellence in Teacher Education</span>
                        <span>● ISO 9001:2015 Quality Management System Certified</span>
                        <span>● CHED Autonomous Status</span>
                    </div>
                </div>

                <hr className="my-4 border-black"/>

                {/* Report Title */}
                <h1 className="text-xl font-bold text-center mb-4">Class Financial Report</h1>
                
                <div className="mb-6 text-sm">
                    <p><span className="font-semibold">Month:</span> <span className='capitalize'>{monthName} {year}</span></p>
                    <p><span className="font-semibold">Prepared by:</span> {userProfile?.name}</p>
                    <p><span className="font-semibold">Position:</span> Class Finance Officer</p>
                    <p><span className="font-semibold">Date:</span> {format(new Date(), 'MMMM d, yyyy')}</p>
                </div>

                {/* Collections */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-2">I. SUMMARY OF COLLECTIONS</h3>
                    <p className="text-sm mb-2">
                        The total amount collected from all students of {room?.name} for the month of <span className='capitalize'>{monthName} {year}</span> is:
                    </p>
                    <table className="w-full text-sm border-collapse border border-black">
                        <thead>
                            <tr>
                                <th className="border border-black p-1 text-left">Date</th>
                                <th className="border border-black p-1 text-left">Description</th>
                                <th className="border border-black p-1 text-right">Amount (PHP)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {collections.map(item => (
                                <tr key={item.id}>
                                    <td className="border border-black p-1">{format(item.createdAt.toDate(), 'MMM d')}</td>
                                    <td className="border border-black p-1">{item.description}</td>
                                    <td className="border border-black p-1 text-right">{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr className="font-bold">
                                <td colSpan={2} className="border border-black p-1 text-left">Total</td>
                                <td className="border border-black p-1 text-right">P {totalCollections.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Expenses */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-2">II. SUMMARY OF EXPENSES</h3>
                    <p className="text-sm mb-2">
                        Major disbursements were made this month for class activities:
                    </p>
                     <table className="w-full text-sm border-collapse border border-black">
                        <thead>
                            <tr>
                                <th className="border border-black p-1 text-left">Date</th>
                                <th className="border border-black p-1 text-left">Description</th>
                                <th className="border border-black p-1 text-left">Recipient</th>
                                <th className="border border-black p-1 text-right">Amount (PHP)</th>
                                <th className="border border-black p-1 text-left">Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                             {expenses.map(item => (
                                <tr key={item.id}>
                                    <td className="border border-black p-1">{format(item.createdAt.toDate(), 'MMM d')}</td>
                                    <td className="border border-black p-1">{item.description}</td>
                                    <td className="border border-black p-1">{item.userName}</td>
                                    <td className="border border-black p-1 text-right">{item.amount.toFixed(2)}</td>
                                    <td className="border border-black p-1"></td>
                                </tr>
                            ))}
                            <tr className="font-bold">
                                <td colSpan={3} className="border border-black p-1 text-left">Total Expenses</td>
                                <td className="border border-black p-1 text-right">P {totalExpenses.toFixed(2)}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Financial Position */}
                <div>
                     <h3 className="font-bold text-lg mb-2">III. FINANCIAL POSITION</h3>
                      <table className="w-1/2 text-sm border-collapse border border-black">
                        <thead>
                            <tr>
                                <th className="border border-black p-1 text-left">Particulars</th>
                                <th className="border border-black p-1 text-right">Amount (PHP)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-1">Total Collections</td>
                                <td className="border border-black p-1 text-right">{totalCollections.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1">Total Budget (Including the balances from the past months)</td>
                                <td className="border border-black p-1 text-right">{financialPosition.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1">Total Expenses</td>
                                <td className="border border-black p-1 text-right">{totalExpenses.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background-color: white; }
          .print\:hidden { display: none; }
        }
        .report-content table, .report-content th, .report-content td {
            border: 1px solid black;
        }
      `}</style>
    </div>
  );
}
