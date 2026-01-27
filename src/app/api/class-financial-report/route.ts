import { type NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { doc, getDoc, collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

const monthMap: { [key: string]: number } = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, 
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

async function getRoomData(roomId: string) {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error("Room not found");
    return roomSnap.data();
}

async function getUserProfile(userId: string) {
    if (!userId) return null;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    return userSnap.data();
}

async function getTransactionsForPeriod(roomId: string, year: number, month: number) {
    const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
    const q = query(transactionsRef);
    const querySnapshot = await getDocs(q);

    const transactions: any[] = [];
    querySnapshot.forEach(doc => {
        const t = doc.data();
        if (t.createdAt) {
            const txDate = (t.createdAt as Timestamp).toDate();
            const isInPeriod = txDate.getFullYear() === year && (month === -1 || txDate.getMonth() === month);
            if (isInPeriod) {
                transactions.push({ id: doc.id, ...t });
            }
        }
    });
    return transactions;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('roomId');
        const yearStr = searchParams.get('year');
        const monthName = searchParams.get('month');
        const remarks = searchParams.get('remarks');
        const adviserName = searchParams.get('adviserName');
        const adviserPosition = searchParams.get('adviserPosition');
        const download = searchParams.get('download');

        if (!roomId || !yearStr || !monthName) {
            return new NextResponse('Missing required query parameters: roomId, year, month', { status: 400 });
        }
        
        const yearNumber = parseInt(yearStr);
        const monthNumber = monthName ? monthMap[monthName.toLowerCase()] : -1;

        // Fetch data from Firestore
        const room = await getRoomData(roomId);
        const userProfile = await getUserProfile(room.createdBy);
        
        // This is a simplified fetch, for a real app you might need more complex queries
        const allRoomTransactions = await getDocs(collection(db, 'rooms', roomId, 'transactions'));
        
        const paymentsInMonth: any[] = [];
        const expensesInMonth: any[] = [];
        const deadlines: any[] = [];
        
        allRoomTransactions.forEach(doc => {
            const t = { id: doc.id, ...doc.data() };
            if (t.type === 'deadline') {
                deadlines.push(t);
            }
            if (t.createdAt) {
                const txDate = (t.createdAt as Timestamp).toDate();
                const isInPeriod = txDate.getFullYear() === yearNumber && (monthNumber === -1 || txDate.getMonth() === monthNumber);
                if (isInPeriod) {
                  if (t.type === 'credit') paymentsInMonth.push(t);
                  if (t.type === 'debit') expensesInMonth.push(t);
                }
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

        const totalCollections = collectionSummary.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expensesInMonth.reduce((sum, t) => sum + t.amount, 0);
        const financialPosition = (room?.totalCollected || 0) - (room?.totalExpenses || 0);

        // Generate PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
        
        // --- PDF Content ---
        doc.font('Helvetica-Bold').fontSize(18).text('Class Financial Report', { align: 'center' });
        doc.moveDown(2);
        
        doc.font('Helvetica').fontSize(12);
        doc.text(`Room: ${room.name}`);
        doc.text(`Period: ${monthName} ${yearNumber}`);
        doc.text(`Prepared by: ${userProfile?.name || 'N/A'}`);
        doc.moveDown(2);

        doc.font('Helvetica-Bold').text('I. SUMMARY OF COLLECTIONS');
        doc.moveDown(0.5);
        collectionSummary.forEach(item => {
            doc.font('Helvetica').fontSize(10).text(`- ${item.description}: P ${item.amount.toFixed(2)} (${item.paidCount} paid)`);
        });
        doc.font('Helvetica-Bold').moveDown(0.5).text(`Total Collections: P ${totalCollections.toFixed(2)}`);
        doc.moveDown(2);

        doc.font('Helvetica-Bold').text('II. SUMMARY OF EXPENSES');
        doc.moveDown(0.5);
        expensesInMonth.forEach(item => {
            doc.font('Helvetica').fontSize(10).text(`- ${item.description} (${item.recipient}): P ${item.amount.toFixed(2)}`);
        });
        doc.font('Helvetica-Bold').moveDown(0.5).text(`Total Expenses: P ${totalExpenses.toFixed(2)}`);
        doc.moveDown(2);
        
        doc.font('Helvetica-Bold').text('III. FINANCIAL POSITION');
        doc.moveDown(0.5);
        doc.font('Helvetica');
        doc.text(`Total Collections this Month: P ${totalCollections.toFixed(2)}`);
        doc.text(`Total Expenses this Month: - P ${totalExpenses.toFixed(2)}`);
        doc.font('Helvetica-Bold').moveDown(0.5).text(`Current Room Balance: P ${financialPosition.toFixed(2)}`);
        doc.moveDown(2);

        if (remarks) {
            doc.font('Helvetica-Bold').text('IV. REMARKS');
            doc.moveDown(0.5);
            doc.font('Helvetica').text(remarks, { width: 500 });
            doc.moveDown(2);
        }
        
        if (adviserName) {
            doc.addPage().font('Helvetica-Bold').text('V. SIGNATORIES');
            doc.moveDown(4);
            doc.font('Helvetica').text('_________________________', {align: 'left'});
            doc.text(`${userProfile?.name}`, {align: 'left'});
            doc.text('Class Finance Officer', {align: 'left'});
            doc.moveDown(4);
            doc.text('_________________________', {align: 'left'});
            doc.text(`${adviserName}`, {align: 'left'});
            doc.text(`${adviserPosition || 'Class Adviser'}`, {align: 'left'});
        }


        const pdfPromise = new Promise<Buffer>((resolve, reject) => {
            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            doc.end();
        });

        const pdfBuffer = await pdfPromise;

        const headers = new Headers();
        headers.append('Content-Type', 'application/pdf');
        
        const fileName = `report-${monthName}-${yearNumber}.pdf`;
        if (download === 'true') {
             headers.append('Content-Disposition', `attachment; filename="${fileName}"`);
        } else {
             headers.append('Content-Disposition', `inline; filename="${fileName}"`);
        }
       
        return new NextResponse(pdfBuffer, { status: 200, headers });
    } catch (error) {
        console.error("Error generating PDF:", error);
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse('An unknown error occurred while generating the PDF.', { status: 500 });
    }
}
