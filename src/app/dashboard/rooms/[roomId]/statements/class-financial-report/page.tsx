
'use client';

import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/use-room';
import { useRoomTransactions } from '@/hooks/use-room-transactions';
import { Loader } from '@/components/loader';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const remarks = searchParams.get('remarks');
  const adviserName = searchParams.get('adviserName');
  const adviserPosition = searchParams.get('adviserPosition');
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

  const { collections, expenses, deadlinesInMonth } = useMemo(() => {
    const paymentsInMonth: any[] = [];
    const expensesInMonth: any[] = [];
    const deadlines: any[] = [];
    
    transactions.forEach(t => {
      if (t.createdAt) {
        const txDate = t.createdAt.toDate();
        const isInPeriod = txDate.getFullYear() === yearNumber && (monthNumber === -1 || txDate.getMonth() === monthNumber);

        if (isInPeriod) {
          if (t.type === 'credit') paymentsInMonth.push(t);
          if (t.type === 'debit') expensesInMonth.push(t);
        }
      }
      if (t.type === 'deadline') {
        deadlines.push(t);
      }
    });

    const collectionsByDeadline = paymentsInMonth.reduce((acc, payment) => {
        const key = payment.deadlineId || 'general';
        if (!acc[key]) {
            const deadlineInfo = deadlines.find(d => d.id === key);
            acc[key] = {
                id: key,
                description: deadlineInfo?.description || 'General Payment',
                date: deadlineInfo?.createdAt || payment.createdAt,
                amount: 0,
                amountPerStudent: deadlineInfo?.amount || 0,
                paidBy: new Set()
            };
        }
        acc[key].amount += payment.amount;
        acc[key].paidBy.add(payment.userId);
        return acc;
    }, {} as Record<string, {id: string, description: string, date: any, amount: number, amountPerStudent: number, paidBy: Set<string>}>);

    const collectionSummary = Object.values(collectionsByDeadline).map(c => ({...c, paidCount: c.paidBy.size}));

    return { collections: collectionSummary, expenses: expensesInMonth, deadlinesInMonth: deadlines };

  }, [transactions, yearNumber, monthNumber]);

  const totalCollections = collections.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  

  const financialPosition = (room?.totalCollected || 0) - (room?.totalExpenses || 0);


  const handleDownloadPdf = async () => {
    if (!statementRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
        const element = statementRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = margin;
        
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);

        while (heightLeft > 0) {
            position = margin - (imgHeight - heightLeft);
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
            heightLeft -= (pdfHeight - margin * 2);
        }

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
        setTimeout(handleDownloadPdf, 500);
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
        <div className="bg-background sm:p-4 overflow-x-auto">
          <div ref={statementRef} className="bg-white text-black p-4 sm:p-8 mx-auto origin-top-left w-full sm:w-[800px] scale-[0.8] xs:scale-100 sm:scale-100">
              <div className="max-w-4xl mx-auto report-content">
                  {/* Header */}
                  <div className="text-center mb-8 report-section">
                      <img src="/image/logoooo.png" alt="Logo" className="w-16 h-16 mx-auto mb-2"/>
                      <h2 className="text-xl font-bold">Saint Louis College</h2>
                      <p className="text-sm">of San Fernando, La Union</p>
                      <p className="text-xs">The Beacon of Wisdom in the North</p>
                      <h3 className="text-lg font-bold mt-2">SENIOR HIGH SCHOOL</h3>
                      <div className="flex flex-col sm:flex-row justify-center sm:justify-around items-center text-xs mt-2 text-gray-600 gap-2 sm:gap-4">
                          <span className="text-center">● Center of Excellence in Teacher Education</span>
                          <span className="text-center">● ISO 9001:2015 Quality Management System Certified</span>
                          <span className="text-center">● CHED Autonomous Status</span>
                      </div>
                  </div>

                  <hr className="my-4 border-black"/>

                  {/* Report Title */}
                  <h1 className="text-xl font-bold text-center mb-4 report-section">Class Financial Report</h1>
                  
                  <div className="mb-6 text-sm report-section">
                      <p><span className="font-semibold">Month:</span> <span className='capitalize'>{monthName} {year}</span></p>
                      <p><span className="font-semibold">Prepared by:</span> {userProfile?.name}</p>
                      <p><span className="font-semibold">Position:</span> Class Finance Officer</p>
                      <p><span className="font-semibold">Date:</span> {format(new Date(), 'MMMM d, yyyy')}</p>
                  </div>

                  {/* Collections */}
                  <div className="mb-8 report-section">
                      <h3 className="font-bold text-lg mb-2">I. SUMMARY OF COLLECTIONS</h3>
                      <p className="text-sm mb-2">
                          The total amount collected from all students of {room?.name} for the month of <span className='capitalize'>{monthName} {year}</span> is:
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-black min-w-[600px]">
                            <thead>
                                <tr>
                                    <th className="border border-black p-1 text-left">Date</th>
                                    <th className="border border-black p-1 text-left">Description</th>
                                    <th className="border border-black p-1 text-right">Amount Per Student (PHP)</th>
                                    <th className="border border-black p-1 text-right">No. of Students Paid</th>
                                    <th className="border border-black p-1 text-right">Amount Collected (PHP)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collections.length > 0 ? (
                                    collections.map(item => (
                                        <tr key={item.id}>
                                            <td className="border border-black p-1">{format(item.date.toDate(), 'MMM d, yyyy')}</td>
                                            <td className="border border-black p-1">{item.description}</td>
                                            <td className="border border-black p-1 text-right">{item.amountPerStudent.toFixed(2)}</td>
                                            <td className="border border-black p-1 text-right">{item.paidCount}</td>
                                            <td className="border border-black p-1 text-right">{item.amount.toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="border border-black p-1 text-center">No collections this month.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                      </div>
                      <table className="w-full text-sm mt-2">
                           <tbody>
                              <tr className="font-bold">
                                  <td className="text-left p-1">Total Amount Collected:</td>
                                  <td className="text-right p-1">P {totalCollections.toFixed(2)}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  {/* Expenses */}
                  <div className="mb-8 report-section">
                      <h3 className="font-bold text-lg mb-2">II. SUMMARY OF EXPENSES</h3>
                      <p className="text-sm mb-2">
                          Major disbursements were made this month for class activities:
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-black min-w-[600px]">
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
                                {expenses.length > 0 ? (
                                    expenses.map(item => (
                                        <tr key={item.id}>
                                            <td className="border border-black p-1">{format(item.createdAt.toDate(), 'MMM d, yyyy')}</td>
                                            <td className="border border-black p-1">{item.description}</td>
                                            <td className="border border-black p-1">{item.recipient}</td>
                                            <td className="border border-black p-1 text-right">{item.amount.toFixed(2)}</td>
                                            <td className="border border-black p-1 h-8"></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="border border-black p-1 text-center">No expenses this month.</td>
                                    </tr>
                                )}
                                <tr className="font-bold bg-gray-100">
                                    <td colSpan={3} className="border border-black p-1 text-left">Total Expenses</td>
                                    <td className="border border-black p-1 text-right">P {totalExpenses.toFixed(2)}</td>
                                    <td className="border border-black p-1"></td>
                                </tr>
                            </tbody>
                        </table>
                      </div>
                  </div>

                  {/* Financial Position */}
                  <div className="mb-12 report-section">
                       <h3 className="font-bold text-lg mb-2">III. FINANCIAL POSITION</h3>
                        <table className="w-full sm:w-1/2 text-sm border-collapse border border-black">
                          <thead>
                              <tr>
                                  <th className="border border-black p-1 text-left">Particulars</th>
                                  <th className="border border-black p-1 text-right">Amount (PHP)</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td className="border border-black p-1">Total Collections this Month</td>
                                  <td className="border border-black p-1 text-right">{totalCollections.toFixed(2)}</td>
                              </tr>
                              <tr>
                                  <td className="border border-black p-1">Total Expenses this Month</td>
                                  <td className="border border-black p-1 text-right">- {totalExpenses.toFixed(2)}</td>
                              </tr>
                              <tr className='font-bold bg-gray-100'>
                                  <td className="border border-black p-1">Current Room Balance</td>
                                  <td className="border border-black p-1 text-right">{financialPosition.toFixed(2)}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  {/* Remarks */}
                  {remarks && (
                      <div className="mb-12 text-sm report-section">
                          <h3 className="font-bold text-lg mb-2">IV. REMARKS</h3>
                          <p className='whitespace-pre-wrap'>{remarks}</p>
                      </div>
                  )}
                  
                  {/* Signatories */}
                  <div className="mb-8 text-sm report-section" style={{paddingTop: '50px' }}>
                      <h3 className="font-bold text-lg mb-4">V. SIGNATORIES</h3>
                      <div className="flex justify-around items-start">
                          <div className="text-center w-1/2">
                              <p className="font-semibold mb-1">Prepared by:</p>
                              <div className='h-16'></div>
                              <p className="font-bold underline">{userProfile?.name}</p>
                              <p>Class Finance Officer</p>
                          </div>
                          {adviserName && (
                              <div className="text-center w-1/2">
                                  <p className="font-semibold mb-1">Verified by:</p>
                                  <div className='h-16'></div>
                                  <p className="font-bold underline">{adviserName}</p>
                                  <p>{adviserPosition}</p>
                              </div>
                          )}
                      </div>
                  </div>

              </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\:hidden { display: none; }
          .report-section { page-break-inside: avoid; }
        }
        .report-content table, .report-content th, .report-content td {
            border: 1px solid black !important;
        }
        .bg-gray-100 {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @page {
            margin: 10mm;
        }
      `}</style>
    </div>
  );
}
