
import { type NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { doc, getDoc, collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';

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

        const room = await getRoomData(roomId);
        const userProfile = await getUserProfile(room.createdBy);
        
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

        const docPDF = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
        
        // --- PDF Content ---
        const logoPath = path.resolve('./public/image/logoooo.png');
        if (fs.existsSync(logoPath)) {
            docPDF.image(logoPath, {
                fit: [64, 64],
                align: 'center',
            });
            docPDF.moveDown(2);
        }

        docPDF.strokeColor('#000000').lineWidth(1).moveTo(50, docPDF.y).lineTo(550, docPDF.y).stroke();
        docPDF.moveDown(2);

        docPDF.font('Helvetica-Bold').fontSize(18).text('Class Financial Report', { align: 'center' });
        docPDF.moveDown(2);
        
        docPDF.font('Helvetica').fontSize(12);
        docPDF.text(`Month: ${monthName} ${yearNumber}`);
        docPDF.text(`Prepared by: ${userProfile?.name || 'N/A'}`);
        docPDF.text(`Position: Class Finance Officer`);
        docPDF.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`);
        docPDF.moveDown(2);

        // Collections Table
        docPDF.font('Helvetica-Bold').fontSize(14).text('I. SUMMARY OF COLLECTIONS', { align: 'left' });
        docPDF.moveDown();
        
        const collectionsHeaders = ['Date', 'Description', 'Amount/Student', '# Paid', 'Amount Collected'];
        const collectionsColWidths = [70, 160, 80, 80, 110];
        let tableY = docPDF.y;

        function drawTableHeader(headers: string[], colWidths: number[]) {
            docPDF.font('Helvetica-Bold').fontSize(10);
            let currentX = 50;
            headers.forEach((header, i) => {
                docPDF.text(header, currentX + 5, tableY + 5, { width: colWidths[i] - 10, align: 'left' });
                currentX += colWidths[i];
            });
            docPDF.rect(50, tableY, 500, 20).stroke();
            tableY += 20;
        }
        
        drawTableHeader(collectionsHeaders, collectionsColWidths);
        
        docPDF.font('Helvetica').fontSize(10);
        if (collectionSummary.length > 0) {
            collectionSummary.forEach(item => {
                let currentX = 50;
                const row = [
                    format(item.date.toDate(), 'MMM d, yyyy'),
                    item.description,
                    item.amountPerStudent.toFixed(2),
                    item.paidCount.toString(),
                    item.amount.toFixed(2)
                ];
                row.forEach((cell, i) => {
                    docPDF.text(cell, currentX + 5, tableY + 5, { width: collectionsColWidths[i] - 10, align: i > 1 ? 'right' : 'left' });
                    currentX += collectionsColWidths[i];
                });
                docPDF.rect(50, tableY, 500, 20).stroke();
                tableY += 20;
            });
        } else {
            docPDF.text('No collections this month.', 55, tableY + 5, { width: 490, align: 'center' });
            docPDF.rect(50, tableY, 500, 20).stroke();
            tableY += 20;
        }

        docPDF.font('Helvetica-Bold');
        docPDF.text('Total Amount Collected:', 50, tableY + 5, { align: 'right', width: 445 });
        docPDF.text(`P ${totalCollections.toFixed(2)}`, 495, tableY + 5, { align: 'right', width: 50 });
        docPDF.rect(50, tableY, 500, 20).stroke();
        tableY += 20;
        docPDF.y = tableY;
        docPDF.moveDown(2);

        // Expenses Table
        docPDF.font('Helvetica-Bold').fontSize(14).text('II. SUMMARY OF EXPENSES');
        docPDF.moveDown();
        tableY = docPDF.y;
        const expensesHeaders = ['Date', 'Description', 'Recipient', 'Amount', 'Signature'];
        const expensesColWidths = [70, 150, 100, 80, 100];
        drawTableHeader(expensesHeaders, expensesColWidths);

        docPDF.font('Helvetica').fontSize(10);
        if (expensesInMonth.length > 0) {
            expensesInMonth.forEach(item => {
                let currentX = 50;
                const row = [
                    format(item.createdAt.toDate(), 'MMM d, yyyy'),
                    item.description,
                    item.recipient,
                    item.amount.toFixed(2),
                    ''
                ];
                row.forEach((cell, i) => {
                    docPDF.text(cell, currentX + 5, tableY + 5, { width: expensesColWidths[i] - 10, align: i === 3 ? 'right' : 'left' });
                    currentX += expensesColWidths[i];
                });
                docPDF.rect(50, tableY, 500, 20).stroke();
                tableY += 20;
            });
        } else {
            docPDF.text('No expenses this month.', 55, tableY + 5, { width: 490, align: 'center' });
            docPDF.rect(50, tableY, 500, 20).stroke();
            tableY += 20;
        }

        docPDF.font('Helvetica-Bold');
        docPDF.text('Total Expenses', 50, tableY + 5, { align: 'right', width: 315 });
        docPDF.text(`P ${totalExpenses.toFixed(2)}`, 370, tableY + 5, { align: 'right', width: 75 });
        docPDF.rect(50, tableY, 500, 20).stroke();
        tableY += 20;
        docPDF.y = tableY;
        docPDF.moveDown(2);
        
        // Financial Position Table
        docPDF.font('Helvetica-Bold').fontSize(14).text('III. FINANCIAL POSITION');
        docPDF.moveDown();
        tableY = docPDF.y;
        const posHeaders = ['Particulars', 'Amount (PHP)'];
        const posColWidths = [250, 250];
        drawTableHeader(posHeaders, posColWidths);

        const posRows = [
            ['Total Collections this Month', totalCollections.toFixed(2)],
            ['Total Expenses this Month', `- ${totalExpenses.toFixed(2)}`],
        ];
        docPDF.font('Helvetica').fontSize(10);
        posRows.forEach(row => {
            docPDF.text(row[0], 55, tableY + 5, { width: posColWidths[0] - 10 });
            docPDF.text(row[1], 305, tableY + 5, { width: posColWidths[1] - 10, align: 'right' });
            docPDF.rect(50, tableY, 500, 20).stroke();
            tableY += 20;
        });

        docPDF.font('Helvetica-Bold');
        docPDF.text('Current Room Balance', 55, tableY + 5, { width: posColWidths[0] - 10 });
        docPDF.text(financialPosition.toFixed(2), 305, tableY + 5, { width: posColWidths[1] - 10, align: 'right' });
        docPDF.rect(50, tableY, 500, 20).stroke();
        tableY += 20;
        docPDF.y = tableY;
        docPDF.moveDown(2);


        if (docPDF.y > 600) docPDF.addPage();

        // Remarks & Signatories
        if (remarks) {
            docPDF.font('Helvetica-Bold').fontSize(14).text('IV. REMARKS');
            docPDF.moveDown();
            docPDF.font('Helvetica').fontSize(10).text(remarks, { width: 500 });
            docPDF.moveDown(2);
        }
        
        docPDF.font('Helvetica-Bold').fontSize(14).text('V. SIGNATORIES');
        const sigY = docPDF.y + 60;
        docPDF.font('Helvetica').fontSize(10);
        docPDF.text('Prepared by:', 75, sigY - 15);
        docPDF.text('_________________________', 75, sigY);
        docPDF.text(`${userProfile?.name}`, 75, sigY + 15, { align: 'center', width: 150 });
        docPDF.text('Class Finance Officer', 75, sigY + 30, { align: 'center', width: 150 });
        
        if (adviserName) {
            docPDF.text('Verified by:', 325, sigY - 15);
            docPDF.text('_________________________', 325, sigY);
            docPDF.text(`${adviserName}`, 325, sigY + 15, { align: 'center', width: 150 });
            docPDF.text(`${adviserPosition || 'Class Adviser'}`, 325, sigY + 30, { align: 'center', width: 150 });
        }


        const pdfPromise = new Promise<Buffer>((resolve, reject) => {
            const buffers: Buffer[] = [];
            docPDF.on('data', buffers.push.bind(buffers));
            docPDF.on('end', () => resolve(Buffer.concat(buffers)));
            docPDF.on('error', reject);
            docPDF.end();
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
