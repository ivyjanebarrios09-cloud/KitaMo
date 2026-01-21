import { type NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) {
    return new NextResponse('Year and month query parameters are required.', {
      status: 400,
    });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  // A promise-based way to get the buffer from the stream
  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);
  });

  // Add content to the PDF
  doc.fontSize(18).text(`Report for ${month} ${year}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text("Sensor data goes here...");
  // ... more content can be added here

  // Finalize the PDF and end the stream
  doc.end();

  try {
    // Wait for the PDF to be fully generated in memory
    const pdfData = await pdfPromise;
    
    const fileName = `report-${month}-${year}.pdf`;

    const headers = new Headers();
    headers.append('Content-Type', 'application/pdf');
    headers.append('Content-Disposition', `attachment; filename="${fileName}"`);

    return new NextResponse(pdfData, { status: 200, headers });
  } catch (error) {
    console.error(error);
    return new NextResponse('Failed to generate PDF.', { status: 500 });
  }
}
