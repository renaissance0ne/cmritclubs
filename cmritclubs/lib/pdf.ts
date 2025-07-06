import { PDFDocument, rgb, StandardFonts, PDFFont, degrees } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Function to generate a unique hash for the PDF
export function generateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Function to create the letter PDF with security features
export async function createSecuredPdf(letterData: any, approvedRollNos: any): Promise<{pdfBytes: Uint8Array, hash: string}> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 1. Club Name (Centered)
    const clubName = letterData.clubName;
    const clubNameWidth = boldFont.widthOfTextAtSize(clubName, 18);
    page.drawText(clubName, {
        x: (width - clubNameWidth) / 2,
        y: height - 70,
        font: boldFont,
        size: 18,
    });

    // 2. QR Code and Date (Top Right)
    const qrCodeUrl = `https://your-app-domain.com/verify-letter/${letterData.id}`; // Replace with your actual URL
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);
    const qrCodePng = await pdfDoc.embedPng(qrCodeImage);
    page.drawImage(qrCodePng, {
        x: width - 120,
        y: height - 120,
        width: 80,
        height: 80,
    });

    const date = new Date(letterData.date.seconds * 1000).toLocaleDateString();
    page.drawText(`Date: ${date}`, {
        x: width - 150,
        y: height - 50,
        font,
        size: 12,
    });


    // 3. Recipient Address
    let yPosition = height - 150;
    page.drawText('To,', { x: 50, y: yPosition, font, size: 12 });
    yPosition -= 20;
    page.drawText('The Director,', { x: 50, y: yPosition, font, size: 12 });
    yPosition -= 20;
    page.drawText('CMR Institute of Technology', { x: 50, y: yPosition, font, size: 12 });
    yPosition -= 20;
    page.drawText('Medchal', { x: 50, y: yPosition, font, size: 12 });

    // 4. Subject
    yPosition -= 40;
    page.drawText(`Subject: ${letterData.subject}`, { x: 50, y: yPosition, font: boldFont, size: 12 });

    // 5. Body
    yPosition -= 40;
    page.drawText('Respected Sir,', { x: 50, y: yPosition, font, size: 12 });
    yPosition -= 20;
    const bodyText = letterData.body;
    // Simple line wrapping
    const lines = bodyText.split('\n');
    lines.forEach((line: string) => {
        page.drawText(line, { x: 50, y: yPosition, font, size: 12 });
        yPosition -= 15;
    });

    // 6. Approved Roll Numbers
    yPosition -= 20;
    page.drawText('The following students are permitted:', { x: 50, y: yPosition, font: boldFont, size: 12 });
    yPosition -= 20;

    Object.keys(approvedRollNos).forEach(dept => {
        if (approvedRollNos[dept].length > 0) {
            page.drawText(`${dept.toUpperCase()}:`, { x: 70, y: yPosition, font: boldFont, size: 10 });
            yPosition -= 15;
            page.drawText(approvedRollNos[dept].join(', '), { x: 90, y: yPosition, font, size: 10 });
            yPosition -= 20;
        }
    });


    // 7. Sincerely
    yPosition -= 40;
    page.drawText('Yours Sincerely,', { x: 50, y: yPosition, font, size: 12 });
    yPosition -= 20;
    page.drawText(letterData.sincerely, { x: 50, y: yPosition, font: boldFont, size: 12 });

    // 8. Approval Status
    yPosition = 120;
    page.drawText('Approval Status:', { x: 50, y: yPosition, font: boldFont, size: 12 });
    yPosition -= 20;
    Object.keys(letterData.approvals).forEach(official => {
        const status = letterData.approvals[official];
        page.drawText(`${official.toUpperCase()}: ${status.toUpperCase()}`, { x: 70, y: yPosition, font, size: 10, color: status === 'approved' ? rgb(0, 0.5, 0) : rgb(0.5, 0, 0) });
        yPosition -= 15;
    });


    // Security Feature: Watermark
    const watermarkText = `CMRIT-${letterData.clubName}`;
    const watermarkFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const watermarkOptions = {
        font: watermarkFont,
        size: 50,
        color: rgb(0.75, 0.75, 0.75),
        opacity: 0.3,
    };

    for (let i = 0; i < 5; i++) {
        page.drawText(watermarkText, {
            ...watermarkOptions,
            x: 100,
            y: height - 150 - (i * 150),
            rotate: degrees(-45),
        });
    }


    // Security Feature: Read-only permissions
    pdfDoc.setProducer('CMRIT Clubs Portal');
    pdfDoc.setCreator('CMRIT Clubs Portal');
    // Note: pdf-lib doesn't directly support setting user permissions like no-printing.
    // This is often handled by Adobe's proprietary security handlers.
    // We can set metadata to indicate it's read-only. More advanced restrictions
    // would require a different library or service.

    // Security Feature: Flattening (pdf-lib does this by default when saving)
    const pdfBytes = await pdfDoc.save();

    // Security Feature: Unique Hash
    const hash = generateHash(Buffer.from(pdfBytes));

    return { pdfBytes, hash };
}