import { PDFDocument, rgb, StandardFonts, PDFFont, degrees, PageSizes, PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Function to generate a unique hash for the PDF
export function generateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper function to wrap long lines of text
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const words = text.replace(/\n/g, ' \n ').split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if (word === '\n') {
            lines.push(currentLine.trim());
            currentLine = '';
            continue;
        }

        const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width < maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine.trim());
            currentLine = word;
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine.trim());
    }

    return lines;
}

// Function to create the letter PDF with security features
export async function createSecuredPdf(letterData: any, approvedRollNos: any, verificationUrl: string): Promise<{pdfBytes: Uint8Array, hash: string}> {
    const pdfDoc = await PDFDocument.create();
    const margin = 50;

    // A reusable object to manage the current page and Y-coordinate
    const cursor = {
        page: pdfDoc.addPage(PageSizes.A4),
        y: 0, // Will be initialized after getting page height
        width: 0,
        height: 0,
    };
    
    const { width, height } = cursor.page.getSize();
    cursor.width = width;
    cursor.height = height;
    cursor.y = height - margin;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // --- Helper functions for drawing and page management ---

    const drawWatermark = (page: PDFPage) => {
        const watermarkFont = font;
        const watermarkText = `CMRIT-${letterData.clubName}`;
        const watermarkOptions = {
            font: watermarkFont,
            size: 30,
            color: rgb(0.85, 0.85, 0.85),
            opacity: 0.5,
        };
        for (let yPos = height; yPos > 0; yPos -= 100) {
            for (let xPos = 0; xPos < width; xPos += 150) {
                page.drawText(watermarkText, {
                    ...watermarkOptions,
                    x: xPos,
                    y: yPos,
                    rotate: degrees(-45),
                });
            }
        }
    };
    
    // Initial watermark
    drawWatermark(cursor.page);

    const checkAndAddPage = (spaceNeeded: number) => {
        if (cursor.y - spaceNeeded < margin) {
            cursor.page = pdfDoc.addPage(PageSizes.A4);
            drawWatermark(cursor.page);
            cursor.y = height - margin;
        }
    };
    
    // --- Drawing Starts Here ---

    // 1. Club Name (Centered)
    const clubName = letterData.clubName;
    const clubNameWidth = boldFont.widthOfTextAtSize(clubName, 18);
    checkAndAddPage(20);
    cursor.page.drawText(clubName, {
        x: (width - clubNameWidth) / 2,
        y: cursor.y,
        font: boldFont,
        size: 18,
    });

    // 2. QR Code and Date (Top Right - absolute position)
    const qrCodeImage = await QRCode.toDataURL(verificationUrl);
    const qrCodePng = await pdfDoc.embedPng(qrCodeImage);
    cursor.page.drawImage(qrCodePng, {
        x: width - margin - 80,
        y: height - margin - 80,
        width: 80,
        height: 80,
    });
    const date = new Date(letterData.date.seconds * 1000).toLocaleDateString();
    cursor.page.drawText(`Date: ${date}`, {
        x: width - margin - 80,
        y: height - margin - 95,
        font,
        size: 12,
    });

    // Reset cursor Y to start content flow below the header elements
    cursor.y = height - 150;

    // 3. Recipient Address
    const drawLine = (text: string, options: { font?: PDFFont, size?: number, lineHeight?: number } = {}) => {
        const { font: f = font, size = 12, lineHeight = 15 } = options;
        checkAndAddPage(lineHeight);
        cursor.page.drawText(text, { x: margin, y: cursor.y, font: f, size });
        cursor.y -= lineHeight;
    };
    
    drawLine('To,');
    drawLine('The Director,');
    drawLine('CMR Institute of Technology');
    drawLine('Medchal');

    // 4. Subject
    cursor.y -= 25;
    drawLine(`Subject: ${letterData.subject}`, { font: boldFont, size: 12, lineHeight: 20 });
    
    // 5. Body
    cursor.y -= 20;
    drawLine('Respected Sir,', { lineHeight: 20 });
    
    const bodyText = letterData.body;
    const wrappedBodyLines = wrapText(bodyText, font, 12, width - (margin * 2));
    wrappedBodyLines.forEach(line => {
        drawLine(line, { size: 12, lineHeight: 18 });
    });

    // 6. Sincerely
    cursor.y -= 20;
    drawLine('Yours Sincerely,');
    cursor.y -= 5;
    drawLine(letterData.sincerely, { font: boldFont });
    
    // 7. Approval Status (Sequential Flow)
    cursor.y -= 30;
    drawLine('Approval Status:', { font: boldFont, size: 12 });
    cursor.y -= 5;
    const approvalOrder = ['director', 'dsaa', 'tpo', 'cseHod', 'csmHod', 'csdHod', 'eceHod', 'frshHod'];
    approvalOrder.forEach(officialKey => {
        if (letterData.approvals[officialKey]) {
            const status = letterData.approvals[officialKey];
            const officialName = officialKey.replace('Hod', ' HOD').toUpperCase();
            drawLine(`${officialName}: ${status.toUpperCase()}`, { 
                font, 
                size: 10,
                lineHeight: 15
            });
        }
    });

    // 8. Approved Roll Numbers (Sequential Flow)
    cursor.y -= 30;
    drawLine('The following students are permitted:', { font: boldFont, size: 12 });
    cursor.y -= 10;
    Object.keys(approvedRollNos).forEach(dept => {
        if (approvedRollNos[dept].length > 0) {
            drawLine(`${dept.toUpperCase()}:`, { font: boldFont, size: 10, lineHeight: 18 });
            const rollNoLines = wrapText(approvedRollNos[dept].join(', '), font, 10, width - margin * 2 - 20);
            rollNoLines.forEach(line => {
                drawLine(line, { font, size: 10, lineHeight: 14 });
            });
            cursor.y -= 4; // Extra space between departments
        }
    });

    // --- Finalize Document ---
    
    pdfDoc.setProducer('CMRIT Clubs Portal');
    pdfDoc.setCreator('CMRIT Clubs Portal');
    pdfDoc.setTitle(`${letterData.clubName} - ${letterData.subject}`);
    pdfDoc.setSubject('Club Activity Permission Letter');
    pdfDoc.setKeywords(['CMRIT', 'Club', 'Permission', 'Letter']);
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const pdfBytes = await pdfDoc.save();
    const hash = generateHash(Buffer.from(pdfBytes));

    return { pdfBytes, hash };
}