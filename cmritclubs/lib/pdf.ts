import { PDFDocument, rgb, StandardFonts, PDFFont, degrees, PageSizes } from 'pdf-lib';
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
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 50;

    // --- Drawing Starts Here ---

    // Draw the watermark FIRST so it's in the background
    const watermarkFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const watermarkText = `CMRIT-${letterData.clubName}`;
    const watermarkOptions = {
        font: watermarkFont,
        size: 30, // Smaller font size
        color: rgb(0.85, 0.85, 0.85), // Lighter color
        opacity: 0.5,
    };
    // Tile the watermark across the page
    for (let y = height; y > 0; y -= 100) {
        for (let x = 0; x < width; x += 150) {
             page.drawText(watermarkText, {
                ...watermarkOptions,
                x: x,
                y: y,
                rotate: degrees(-45),
            });
        }
    }

    // 1. Club Name (Centered)
    const clubName = letterData.clubName;
    const clubNameWidth = boldFont.widthOfTextAtSize(clubName, 18);
    page.drawText(clubName, {
        x: (width - clubNameWidth) / 2,
        y: height - margin,
        font: boldFont,
        size: 18,
    });

    // 2. QR Code and Date (Top Right)
    const qrCodeImage = await QRCode.toDataURL(verificationUrl);
    const qrCodePng = await pdfDoc.embedPng(qrCodeImage);
    page.drawImage(qrCodePng, {
        x: width - margin - 80,
        y: height - margin - 80,
        width: 80,
        height: 80,
    });

    // Date is now below the QR code
    const date = new Date(letterData.date.seconds * 1000).toLocaleDateString();
    page.drawText(`Date: ${date}`, {
        x: width - margin - 80, // Align with QR code
        y: height - margin - 95, // Positioned below
        font,
        size: 12,
    });

    // 3. Recipient Address
    let yPosition = height - 150;
    page.drawText('To,', { x: margin, y: yPosition, font, size: 12 });
    yPosition -= 20;
    page.drawText('The Director,', { x: margin, y: yPosition, font, size: 12 });
    yPosition -= 20;
    page.drawText('CMR Institute of Technology', { x: margin, y: yPosition, font, size: 12 });
    yPosition -= 20;
    page.drawText('Medchal', { x: margin, y: yPosition, font, size: 12 });

    // 4. Subject
    yPosition -= 40;
    page.drawText(`Subject: ${letterData.subject}`, { x: margin, y: yPosition, font: boldFont, size: 12 });

    // 5. Body
    yPosition -= 40;
    page.drawText('Respected Sir,', { x: margin, y: yPosition, font, size: 12 });
    yPosition -= 20;
    const bodyText = letterData.body;
    // Use the text wrapping function for the body
    const wrappedBodyLines = wrapText(bodyText, font, 12, width - (margin * 2));
    wrappedBodyLines.forEach((line: string) => {
        page.drawText(line, { x: margin, y: yPosition, font, size: 12, lineHeight: 18 });
        yPosition -= 18;
    });

    // Move Sincerely section before the Roll Numbers
    yPosition -= 20;
    page.drawText('Yours Sincerely,', { x: margin, y: yPosition, font, size: 12 });
    yPosition -= 20;
    page.drawText(letterData.sincerely, { x: margin, y: yPosition, font: boldFont, size: 12 });

    // Calculate the middle point for two-column layout
    const middleX = width / 2;

    // 6. Approved Roll Numbers (RIGHT SIDE - moved to right column)
    let rollNoYPosition = 280; // Starting position for roll numbers on the right
    page.drawText('The following students are permitted:', { x: middleX, y: rollNoYPosition, font: boldFont, size: 12 });
    rollNoYPosition -= 20;
    Object.keys(approvedRollNos).forEach(dept => {
        if (approvedRollNos[dept].length > 0) {
            page.drawText(`${dept.toUpperCase()}:`, { x: middleX + 20, y: rollNoYPosition, font: boldFont, size: 10 });
            rollNoYPosition -= 15;
            // Use the wrapping function for roll numbers too, in case the list is very long
            const rollNoLines = wrapText(approvedRollNos[dept].join(', '), font, 10, (width/2) - margin - 40);
            rollNoLines.forEach(line => {
                page.drawText(line, { x: middleX + 40, y: rollNoYPosition, font, size: 10, lineHeight: 14 });
                rollNoYPosition -= 14;
            });
            rollNoYPosition -= 6; // Extra space between departments
        }
    });

    // 7. Approval Status (LEFT SIDE - moved to left column)
    let approvalYPosition = 280; // Starting position for approvals on the left
    page.drawText('Approval Status:', { x: margin, y: approvalYPosition, font: boldFont, size: 12 });
    approvalYPosition -= 20;
    // Enforce a specific display order for approvals
    const approvalOrder = ['director', 'dsaa', 'tpo', 'cseHod', 'csmHod', 'csdHod', 'eceHod', 'frshHod'];
    approvalOrder.forEach(officialKey => {
        if (letterData.approvals[officialKey]) {
            const status = letterData.approvals[officialKey];
            const officialName = officialKey.replace('Hod', ' HOD').toUpperCase(); // Make it look nicer
            page.drawText(`${officialName}: ${status.toUpperCase()}`, { 
                x: margin + 20, 
                y: approvalYPosition, 
                font, 
                size: 10, 
                color: status === 'approved' ? rgb(0, 0.5, 0) : rgb(0.5, 0, 0) 
            });
            approvalYPosition -= 15;
        }
    });

    // Set document metadata for security
    pdfDoc.setProducer('CMRIT Clubs Portal');
    pdfDoc.setCreator('CMRIT Clubs Portal');
    pdfDoc.setTitle(`${letterData.clubName} - ${letterData.subject}`);
    pdfDoc.setSubject('Club Activity Permission Letter');
    pdfDoc.setKeywords(['CMRIT', 'Club', 'Permission', 'Letter']);
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Add security restrictions - Only allow printing
    // Note: pdf-lib doesn't have built-in encryption/restriction methods
    // We'll need to add this after the PDF is created using a different approach
    
    // For now, let's add a custom property to track that this PDF should be secured
    // This will be handled in the API endpoint

    // Save the document to get the bytes for hashing
    const pdfBytes = await pdfDoc.save();

    // Generate hash from the final bytes
    const hash = generateHash(Buffer.from(pdfBytes));

    return { pdfBytes, hash };
}