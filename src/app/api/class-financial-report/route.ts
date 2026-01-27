
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

        const docPDF = new PDFDocument({ size: 'A4', margin: 50 });
        
        // --- PDF Content ---
        const contentWidth = docPDF.page.width - docPDF.page.margins.left - docPDF.page.margins.right;
        const startX = docPDF.page.margins.left;
        const rowHeight = 20;

        // Header
        const logoPath = path.resolve('./public/image/logoooo.png');
        if (fs.existsSync(logoPath)) {
            docPDF.image(logoPath, (docPDF.page.width / 2) - 30, docPDF.y, { width: 60 });
        }
        docPDF.y = 80;
        docPDF.moveTo(startX, docPDF.y).lineTo(startX + contentWidth, docPDF.y).stroke();
        docPDF.moveDown(2);

        docPDF.font('Helvetica-Bold').fontSize(14).text('Class Financial Report', { align: 'center' });
        docPDF.moveDown(2);

        // Metadata
        docPDF.font('Helvetica').fontSize(10);
        const metaStartY = docPDF.y;
        docPDF.text('Month:', startX, metaStartY);
        docPDF.text('Prepared by:', startX, metaStartY + 15);
        docPDF.text('Position:', startX, metaStartY + 30);
        docPDF.text('Date:', startX, metaStartY + 45);

        docPDF.font('Helvetica-Bold');
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        docPDF.text(`${capitalizedMonth} ${yearStr}`, startX + 90, metaStartY);
        docPDF.text(userProfile?.name || 'N/A', startX + 90, metaStartY + 15);
        docPDF.text('Class Finance Officer', startX + 90, metaStartY + 30);
        docPDF.text(format(new Date(), 'MMMM d, yyyy'), startX + 90, metaStartY + 45);
        docPDF.y = metaStartY + 65;

        // --- Table Drawing Helper ---
        const drawTableHeader = (y, headers, colWidths) => {
            let currentX = startX;
            docPDF.font('Helvetica-Bold').fontSize(9);
            headers.forEach((header, i) => {
                docPDF.rect(currentX, y, colWidths[i], rowHeight).stroke();
                docPDF.text(header, currentX + 5, y + 7, { width: colWidths[i] - 10, align: 'left' });
                currentX += colWidths[i];
            });
        };
        
        const drawTableRow = (y, rowData, colWidths, alignments) => {
            let currentX = startX;
            docPDF.font('Helvetica').fontSize(9);
            rowData.forEach((cell, i) => {
                docPDF.rect(currentX, y, colWidths[i], rowHeight).stroke();
                docPDF.text(cell.toString(), currentX + 5, y + 7, { width: colWidths[i] - 10, align: alignments[i] });
                currentX += colWidths[i];
            });
        };
        
        // --- I. SUMMARY OF COLLECTIONS ---
        docPDF.font('Helvetica-Bold').fontSize(12).text('I. SUMMARY OF COLLECTIONS', startX, docPDF.y);
        docPDF.moveDown(0.5);
        docPDF.font('Helvetica').fontSize(9).text(`The total amount collected from all students of ${room?.name} for the month of ${capitalizedMonth} ${yearStr} is:`, { width: contentWidth });
        docPDF.moveDown(1);
        let tableY = docPDF.y;
        
        const collHeaders = ['Date', 'Description', 'Amount Per Student (PHP)', 'No. of Students Paid', 'Amount Collected (PHP)'];
        const collWidths = [80, 140, 80, 80, 115];
        drawTableHeader(tableY, collHeaders, collWidths);
        tableY += rowHeight;

        if (collectionSummary.length > 0) {
            collectionSummary.forEach(item => {
                const row = [format(item.date.toDate(), 'PP'), item.description, item.amountPerStudent.toFixed(2), item.paidCount, item.amount.toFixed(2)];
                const alignments = ['left', 'left', 'right', 'right', 'right'];
                drawTableRow(tableY, row, collWidths, alignments);
                tableY += rowHeight;
            });
        } else {
            docPDF.rect(startX, tableY, collWidths.reduce((a, b) => a + b), rowHeight).stroke();
            docPDF.text('No collections this month.', startX, tableY + 7, { width: contentWidth, align: 'center' });
            tableY += rowHeight;
        }

        const totalCollLabelWidth = collWidths.slice(0, 4).reduce((a, b) => a + b);
        docPDF.rect(startX, tableY, totalCollLabelWidth, rowHeight).stroke();
        docPDF.font('Helvetica-Bold').text('Total Amount Collected:', startX + 5, tableY + 7);
        docPDF.rect(startX + totalCollLabelWidth, tableY, collWidths[4], rowHeight).stroke();
        docPDF.text(`P ${totalCollections.toFixed(2)}`, startX + totalCollLabelWidth + 5, tableY + 7, { width: collWidths[4] - 10, align: 'right' });
        tableY += rowHeight;
        docPDF.y = tableY + 20;

        // --- II. SUMMARY OF EXPENSES ---
        if (docPDF.y > 600) docPDF.addPage();
        docPDF.font('Helvetica-Bold').fontSize(12).text('II. SUMMARY OF EXPENSES', startX, docPDF.y);
        docPDF.moveDown(0.5);
        docPDF.font('Helvetica').fontSize(9).text('Major disbursements were made this month for class activities:', { width: contentWidth });
        docPDF.moveDown(1);
        tableY = docPDF.y;

        const expHeaders = ['Date', 'Description', 'Recipient', 'Amount (PHP)', 'Signature'];
        const expWidths = [80, 185, 100, 80, 50];
        drawTableHeader(tableY, expHeaders, expWidths);
        tableY += rowHeight;
        
        if (expensesInMonth.length > 0) {
            expensesInMonth.forEach(item => {
                const row = [format(item.createdAt.toDate(), 'PP'), item.description, item.recipient, `P ${item.amount.toFixed(2)}`, ''];
                const alignments = ['left', 'left', 'left', 'right', 'left'];
                drawTableRow(tableY, row, expWidths, alignments);
                tableY += rowHeight;
            });
        } else {
            docPDF.rect(startX, tableY, expWidths.reduce((a, b) => a + b), rowHeight).stroke();
            docPDF.text('No expenses this month.', startX, tableY + 7, { width: contentWidth, align: 'center' });
            tableY += rowHeight;
        }

        const totalExpLabelWidth = expWidths.slice(0, 3).reduce((a, b) => a + b);
        docPDF.rect(startX, tableY, totalExpLabelWidth, rowHeight).stroke();
        docPDF.font('Helvetica-Bold').text('Total Expenses', startX + 5, tableY + 7, { width: totalExpLabelWidth - 10, align: 'left'});
        docPDF.rect(startX + totalExpLabelWidth, tableY, expWidths[3], rowHeight).stroke();
        docPDF.text(`P ${totalExpenses.toFixed(2)}`, startX + totalExpLabelWidth + 5, tableY + 7, { width: expWidths[3] - 10, align: 'right'});
        docPDF.rect(startX + totalExpLabelWidth + expWidths[3], tableY, expWidths[4], rowHeight).stroke();
        tableY += rowHeight;
        docPDF.y = tableY + 20;

        // --- III. FINANCIAL POSITION ---
        if (docPDF.y > 650) docPDF.addPage();
        docPDF.font('Helvetica-Bold').fontSize(12).text('III. FINANCIAL POSITION', startX, docPDF.y);
        docPDF.moveDown(1);
        tableY = docPDF.y;

        const posHeaders = ['Particulars', 'Amount (PHP)'];
        const posWidths = [250, 100];
        drawTableHeader(tableY, posHeaders, posWidths);
        tableY += rowHeight;
        
        drawTableRow(tableY, ['Total Collections this Month', totalCollections.toFixed(2)], posWidths, ['left', 'right']);
        tableY += rowHeight;
        drawTableRow(tableY, ['Total Expenses this Month', `- ${totalExpenses.toFixed(2)}`], posWidths, ['left', 'right']);
        tableY += rowHeight;
        
        docPDF.font('Helvetica-Bold');
        drawTableRow(tableY, ['Current Room Balance', financialPosition.toFixed(2)], posWidths, ['left', 'right']);
        tableY += rowHeight;
        docPDF.y = tableY + 20;

        // --- IV. REMARKS ---
        if (remarks) {
            if (docPDF.y > 600) docPDF.addPage();
            docPDF.font('Helvetica-Bold').fontSize(12).text('IV. REMARKS');
            docPDF.moveDown(0.5);
            docPDF.font('Helvetica').fontSize(10).text(remarks, { width: contentWidth, align: 'justify' });
            docPDF.moveDown(2);
        }

        // --- V. SIGNATORIES ---
        if (docPDF.y > 650) docPDF.addPage();
        docPDF.font('Helvetica-Bold').fontSize(12).text('V. SIGNATORIES');
        const sigY = docPDF.y + 40;
        
        const sigBlockWidth = contentWidth / 2;

        docPDF.font('Helvetica').fontSize(10);
        docPDF.text('Prepared by:', startX, sigY);
        docPDF.text('_________________________', startX, sigY + 50);
        docPDF.font('Helvetica-Bold').text(`${userProfile?.name}`, startX, sigY + 65, { width: 200, align: 'left'});
        docPDF.font('Helvetica').text('Class Finance Officer', startX, sigY + 80, { width: 200, align: 'left' });

        if (adviserName) {
            const adviserX = startX + sigBlockWidth;
            docPDF.text('Verified by:', adviserX, sigY);
            docPDF.text('_________________________', adviserX, sigY + 50);
            docPDF.font('Helvetica-Bold').text(`${adviserName}`, adviserX, sigY + 65, { align: 'left', width: 200 });
            docPDF.font('Helvetica').text(`${adviserPosition || 'Class Adviser'}`, adviserX, sigY + 80, { align: 'left', width: 200 });
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
        
        const fileName = `report-${monthName}-${yearStr}.pdf`;
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
    
