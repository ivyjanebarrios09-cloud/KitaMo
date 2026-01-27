
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
                x: 50,
                y: 40
            });
        }

        docPDF.strokeColor('#e5e5e5').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();

        docPDF.font('Helvetica-Bold').fontSize(16).text('Class Financial Report', 50, 135, { align: 'center' });
        docPDF.moveDown(3);
        
        docPDF.font('Helvetica').fontSize(10);
        const metaDataY = docPDF.y;
        docPDF.text(`Month:`, 50, metaDataY);
        docPDF.text(`Prepared by:`, 50, metaDataY + 15);
        docPDF.text(`Position:`, 50, metaDataY + 30);
        docPDF.text(`Date:`, 50, metaDataY + 45);

        docPDF.font('Helvetica-Bold');
        docPDF.text(monthName, 120, metaDataY, {width: 200});
        docPDF.text(userProfile?.name || 'N/A', 120, metaDataY + 15);
        docPDF.text('Class Finance Officer', 120, metaDataY + 30);
        docPDF.text(format(new Date(), 'MMMM d, yyyy'), 120, metaDataY + 45);
        docPDF.y = metaDataY + 65;

        const drawSectionHeader = (title: string) => {
            if (docPDF.y > 700) docPDF.addPage();
            docPDF.font('Helvetica-Bold').fontSize(12).text(title, 50, docPDF.y, { underline: true });
            docPDF.moveDown(1.5);
        };

        const drawTableRow = (y, row, widths, aligns, isHeader = false) => {
            let x = 50;
            row.forEach((cell, i) => {
                docPDF.text(cell, x + 5, y + 7, {
                    width: widths[i] - 10,
                    align: aligns[i]
                });
                x += widths[i];
            });
        };
        
        // --- Collections Table ---
        drawSectionHeader('I. SUMMARY OF COLLECTIONS');
        let tableY = docPDF.y;
        const colWidthsCollections = [80, 170, 80, 80, 90];
        const colAlignsCollections = ['left', 'left', 'right', 'right', 'right'];
        const headersCollections = ['Date', 'Description', 'Amount/Student', '# Paid', 'Amount Collected'];
        
        docPDF.font('Helvetica-Bold').fontSize(9);
        docPDF.fillColor("#4f46e5").rect(50, tableY, 500, 25).fill();
        docPDF.fillColor("#ffffff");
        drawTableRow(tableY, headersCollections, colWidthsCollections, colAlignsCollections, true);
        docPDF.fillColor("#000000");
        tableY += 25;

        docPDF.font('Helvetica').fontSize(9);
        if (collectionSummary.length > 0) {
            collectionSummary.forEach((item, i) => {
                if (i % 2 === 1) {
                    docPDF.fillColor("#f4f4f5").rect(50, tableY, 500, 25).fill();
                    docPDF.fillColor("#000000");
                }
                const row = [
                    format(item.date.toDate(), 'MMM d, yyyy'),
                    item.description,
                    item.amountPerStudent.toFixed(2),
                    item.paidCount.toString(),
                    item.amount.toFixed(2)
                ];
                drawTableRow(tableY, row, colWidthsCollections, colAlignsCollections);
                tableY += 25;
            });
        } else {
            docPDF.text('No collections this month.', 55, tableY + 7, { width: 490, align: 'center' });
            tableY += 25;
        }
        docPDF.strokeColor('#e5e5e5').rect(50, docPDF.y, 500, tableY - docPDF.y).stroke();
        
        docPDF.font('Helvetica-Bold').fontSize(10);
        docPDF.fillColor("#e4e4e7").rect(50, tableY, 500, 25).fill();
        docPDF.fillColor("#000000");
        drawTableRow(tableY, ['Total Amount Collected:', `P ${totalCollections.toFixed(2)}`], [410, 90], ['right', 'right']);
        tableY += 25;
        docPDF.y = tableY + 20;

        // --- Expenses Table ---
        drawSectionHeader('II. SUMMARY OF EXPENSES');
        tableY = docPDF.y;
        const colWidthsExpenses = [80, 170, 80, 70, 100];
        const colAlignsExpenses = ['left', 'left', 'left', 'right', 'left'];
        const headersExpenses = ['Date', 'Description', 'Recipient', 'Amount', 'Signature'];

        docPDF.font('Helvetica-Bold').fontSize(9);
        docPDF.fillColor("#4f46e5").rect(50, tableY, 500, 25).fill();
        docPDF.fillColor("#ffffff");
        drawTableRow(tableY, headersExpenses, colWidthsExpenses, colAlignsExpenses, true);
        docPDF.fillColor("#000000");
        tableY += 25;
        
        docPDF.font('Helvetica').fontSize(9);
        if (expensesInMonth.length > 0) {
            expensesInMonth.forEach((item, i) => {
                 if (i % 2 === 1) {
                    docPDF.fillColor("#f4f4f5").rect(50, tableY, 500, 25).fill();
                    docPDF.fillColor("#000000");
                }
                const row = [
                    format(item.createdAt.toDate(), 'MMM d, yyyy'),
                    item.description,
                    item.recipient,
                    `P ${item.amount.toFixed(2)}`,
                    ''
                ];
                drawTableRow(tableY, row, colWidthsExpenses, colAlignsExpenses);
                tableY += 25;
            });
        } else {
            docPDF.text('No expenses this month.', 55, tableY + 7, { width: 490, align: 'center' });
            tableY += 25;
        }
        docPDF.strokeColor('#e5e5e5').rect(50, docPDF.y, 500, tableY - docPDF.y).stroke();

        docPDF.font('Helvetica-Bold').fontSize(10);
        docPDF.fillColor("#e4e4e7").rect(50, tableY, 500, 25).fill();
        docPDF.fillColor("#000000");
        drawTableRow(tableY, ['Total Expenses', `P ${totalExpenses.toFixed(2)}`], [330, 70, 100], ['right', 'right', 'left']);
        tableY += 25;
        docPDF.y = tableY + 20;

        // --- Financial Position Table ---
        drawSectionHeader('III. FINANCIAL POSITION');
        tableY = docPDF.y;
        docPDF.font('Helvetica-Bold').fontSize(9);
        docPDF.fillColor("#4f46e5").rect(50, tableY, 350, 25).fill();
        docPDF.fillColor("#ffffff");
        drawTableRow(tableY, ['Particulars', 'Amount (PHP)'], [250, 100], ['left', 'right']);
        tableY += 25;
        docPDF.fillColor("#000000");

        const posRows = [
            ['Total Collections this Month', totalCollections.toFixed(2)],
            ['Total Expenses this Month', `- ${totalExpenses.toFixed(2)}`],
        ];
        docPDF.font('Helvetica').fontSize(9);
        posRows.forEach((row, i) => {
             if (i % 2 === 1) {
                docPDF.fillColor("#f4f4f5").rect(50, tableY, 350, 25).fill();
                docPDF.fillColor("#000000");
            }
            drawTableRow(tableY, row, [250, 100], ['left', 'right']);
            tableY += 25;
        });

        docPDF.font('Helvetica-Bold').fontSize(10);
        docPDF.fillColor("#e4e4e7").rect(50, tableY, 350, 25).fill();
        docPDF.fillColor("#000000");
        drawTableRow(tableY, ['Current Room Balance', financialPosition.toFixed(2)], [250, 100], ['left', 'right']);
        tableY += 25;
        docPDF.strokeColor('#e5e5e5').rect(50, docPDF.y, 350, tableY - docPDF.y).stroke();
        docPDF.y = tableY + 20;

        if (docPDF.y > 600) docPDF.addPage();

        // Remarks & Signatories
        if (remarks) {
            drawSectionHeader('IV. REMARKS');
            docPDF.font('Helvetica').fontSize(10).text(remarks, { width: 500, align: 'justify' });
            docPDF.moveDown(2);
        }
        
        drawSectionHeader('V. SIGNATORIES');
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
        
        const fileName = `report-${monthName}-${year}.pdf`;
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
    