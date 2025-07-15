import { PDFDocument, rgb, StandardFonts, PDFFont, degrees, PageSizes, PDFPage, PDFName, PDFString, PDFArray } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';

// Function to generate a unique hash for the PDF
export function generateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Enhanced context for drawing, including fonts and cursor
interface DrawContext {
    pdfDoc: PDFDocument;
    page: PDFPage;
    y: number;
    width: number;
    height: number;
    margin: number;
    font: PDFFont;
    boldFont: PDFFont;
    italicFont: PDFFont;
    boldItalicFont: PDFFont;
    currentAlignment: 'left' | 'center' | 'right' | 'justify';
}

// Helper function to draw strikethrough line
function drawStrikethrough(page: PDFPage, x: number, y: number, width: number, fontSize: number) {
    const lineY = y + (fontSize * 0.3); // Position line roughly in middle of text
    page.drawLine({
        start: { x, y: lineY },
        end: { x: x + width, y: lineY },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
}

// Helper function to draw highlight background
function drawHighlight(page: PDFPage, x: number, y: number, width: number, height: number) {
    page.drawRectangle({
        x,
        y: y - 2,
        width,
        height: height + 4,
        color: rgb(1, 1, 0.7), // Yellow highlight
        opacity: 0.3,
    });
}

// [REVISED] Enhanced HTML to PDF Drawing Logic with Justification
async function drawHtml(context: DrawContext, html: string, checkAndAddPage: (spaceNeeded: number) => void) {
    const { window } = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
    const body = window.document.body;

    // --- Style Management ---
    interface TextStyle {
        size: number;
        color: any;
        lineHeight: number;
        isBold: boolean;
        isItalic: boolean;
        isStrikethrough: boolean;
        isHighlight: boolean;
        isLink: boolean;
        linkUrl?: string;
    }

    const defaultStyle: TextStyle = {
        size: 12,
        color: rgb(0, 0, 0),
        lineHeight: 15,
        isBold: false,
        isItalic: false,
        isStrikethrough: false,
        isHighlight: false,
        isLink: false,
    };

    // Helper to select the correct PDFFont object based on style flags.
    const selectFont = (style: TextStyle): PDFFont => {
        if (style.isBold && style.isItalic) return context.boldItalicFont;
        if (style.isBold) return context.boldFont;
        if (style.isItalic) return context.italicFont;
        return context.font;
    };
    
    // --- List Management ---
    let listLevel = 0;
    let listTypes: ('ul' | 'ol')[] = [];
    let listCounters: number[] = [];

    // --- Core Rendering Logic ---

    // Renders a single line of styled words, handling alignment and justification.
    const renderLine = (line: { word: string; style: TextStyle }[], alignment: 'left' | 'center' | 'right' | 'justify', isLastLine: boolean) => {
        if (line.length === 0) return;
        
        const lineStyle = line[0].style;
        checkAndAddPage(lineStyle.lineHeight);
        
        const maxWidth = context.width - context.margin * 2;
        let totalWordsWidth = 0;
        line.forEach(item => {
            totalWordsWidth += selectFont(item.style).widthOfTextAtSize(item.word, item.style.size);
        });

        const spaceWidth = selectFont(lineStyle).widthOfTextAtSize(' ', lineStyle.size);
        let startX = context.margin;
        let spaceBetweenWords = spaceWidth;

        // Calculate spacing and starting position based on alignment
        if (alignment === 'justify' && !isLastLine && line.length > 1) {
            const totalSpacing = maxWidth - totalWordsWidth;
            spaceBetweenWords = totalSpacing / (line.length - 1);
        } else {
            const totalLineWidth = totalWordsWidth + (spaceWidth * (line.length - 1));
            if (alignment === 'center') {
                startX = (context.width - totalLineWidth) / 2;
            } else if (alignment === 'right') {
                startX = context.width - context.margin - totalLineWidth;
            }
        }
        
        let currentX = startX;
        for (const item of line) {
            const { word, style } = item;
            const font = selectFont(style);
            const textWidth = font.widthOfTextAtSize(word, style.size);

            if (style.isHighlight) {
                drawHighlight(context.page, currentX, context.y, textWidth, style.size);
            }
            context.page.drawText(word, { x: currentX, y: context.y, font, size: style.size, color: style.color });
            if (style.isStrikethrough) {
                drawStrikethrough(context.page, currentX, context.y, textWidth, style.size);
            }
            if (style.isLink && style.linkUrl) {
                context.page.drawLine({
                    start: { x: currentX, y: context.y - 1 },
                    end: { x: currentX + textWidth, y: context.y - 1 },
                    thickness: 0.5, color: style.color,
                });
                
                // The rectangle for the link annotation. Coordinates are from the bottom-left corner.
                const annotationRect = [
                    currentX,                  // lower-left x
                    context.y,                 // lower-left y
                    currentX + textWidth,      // upper-right x
                    context.y + style.size,    // upper-right y
                ];

                // Create the annotation dictionary object.
                const linkAnnotation = context.pdfDoc.context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: annotationRect,
                    Border: [0, 0, 0], // No visible border for the link
                    A: {
                        Type: 'Action',
                        S: 'URI',
                        URI: PDFString.of(style.linkUrl),
                    },
                });

                // Get the page's annotations array, creating it if it doesn't exist.
                // Using `lookup` is safer as it checks the type and returns a `PDFArray` or `undefined`.
                let annots = context.page.node.lookup(PDFName.of('Annots'), PDFArray);
                if (!annots) {
                    annots = context.pdfDoc.context.obj([]);
                    context.page.node.set(PDFName.of('Annots'), annots);
                }
                
                // Add the new link annotation to the array.
                annots.push(linkAnnotation);
            }
            currentX += textWidth + spaceBetweenWords;
        }
        context.y -= lineStyle.lineHeight;
    };

    // Takes a buffer of styled text fragments, wraps them into lines, and renders them.
    const drawAndWrapStyledFragments = (buffer: { text: string; style: TextStyle }[], alignment: 'left' | 'center' | 'right' | 'justify') => {
        let currentLine: { word: string; style: TextStyle }[] = [];
        let currentLineWidth = 0;
        const maxWidth = context.width - context.margin * 2;

        const renderCurrentLine = (isLast: boolean) => {
            if (currentLine.length > 0) {
                renderLine(currentLine, alignment, isLast);
                currentLine = [];
                currentLineWidth = 0;
            }
        };

        for (const fragment of buffer) {
            const words = fragment.text.split(' ').filter(w => w.length > 0);
            for (const word of words) {
                const font = selectFont(fragment.style);
                let wordWidth;
                let sanitizedWord = word;

                try {
                    // Try to measure the original word
                    wordWidth = font.widthOfTextAtSize(word, fragment.style.size);
                } catch (error) {
                    // If it fails, it's likely due to unsupported characters.
                    console.warn(`[PDF-LIB] Could not calculate width for word "${word}" due to unsupported characters. Sanitizing word.`);
                    
                    // Sanitize the word by replacing only the unsupported characters with '?'
                    sanitizedWord = Array.from(word).map(char => {
                        try {
                            font.widthOfTextAtSize(char, fragment.style.size);
                            return char; // Character is supported
                        } catch {
                            return '?'; // Character is not supported
                        }
                    }).join('');
                    
                    // Recalculate the width with the sanitized word
                    try {
                        wordWidth = font.widthOfTextAtSize(sanitizedWord, fragment.style.size);
                    } catch (finalError) {
                        // As a last resort, if even the sanitized word fails, use a fallback width.
                        console.error(`[PDF-LIB] Could not calculate width even for sanitized word "${sanitizedWord}". Using fallback width.`);
                        wordWidth = font.widthOfTextAtSize('???', fragment.style.size);
                    }
                }

                const spaceWidth = font.widthOfTextAtSize(' ', fragment.style.size);

                if (currentLineWidth + (currentLine.length > 0 ? spaceWidth : 0) + wordWidth > maxWidth) {
                    renderCurrentLine(false);
                }
                
                // Use the (potentially sanitized) word for layout and drawing
                currentLine.push({ word: sanitizedWord, style: fragment.style });
                currentLineWidth += (currentLine.length > 1 ? spaceWidth : 0) + wordWidth;
            }
        }
        renderCurrentLine(true); // Render the final line
    };

    // Recursively collects styled text fragments from a node and its children into a flat buffer.
    const collectStyledFragments = (node: Node, style: TextStyle, buffer: { text: string; style: TextStyle }[]) => {
        if (node.nodeType === 3) { // Text node
            buffer.push({ text: node.textContent || '', style });
        } else if (node.nodeType === 1) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            
            let newStyle = { ...style };
            switch (tagName) {
                case 'strong': case 'b': newStyle.isBold = true; break;
                case 'em': case 'i': newStyle.isItalic = true; break;
                case 's': case 'strike': case 'del': newStyle.isStrikethrough = true; break;
                case 'mark': newStyle.isHighlight = true; break;
                case 'a': 
                    newStyle.isLink = true;
                    newStyle.linkUrl = element.getAttribute('href') || '';
                    newStyle.color = rgb(0, 0, 1);
                    break;
            }
            element.childNodes.forEach(child => collectStyledFragments(child, newStyle, buffer));
        }
    };

    // The main recursive function to walk through the HTML nodes.
    const processNode = (node: Node, currentStyle: TextStyle) => {
        if (node.nodeType === 1) { // Element node
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            
            const originalAlignment = context.currentAlignment;
            const textAlign = element.style.textAlign;
            if (textAlign && ['left', 'center', 'right', 'justify'].includes(textAlign)) {
                context.currentAlignment = textAlign as 'left' | 'center' | 'right' | 'justify';
            }

            let newStyle = { ...currentStyle };
            let spaceBefore = 0;
            let spaceAfter = 0;

            switch (tagName) {
                case 'h1': newStyle = {...newStyle, isBold: true, size: 24, lineHeight: 28}; spaceBefore = 10; spaceAfter = 10; break;
                case 'h2': newStyle = {...newStyle, isBold: true, size: 20, lineHeight: 24}; spaceBefore = 8; spaceAfter = 8; break;
                case 'h3': newStyle = {...newStyle, isBold: true, size: 16, lineHeight: 20}; spaceBefore = 6; spaceAfter = 6; break;
                case 'p': spaceBefore = 10; spaceAfter = 10; break;
                case 'br': context.y -= newStyle.lineHeight; return;
                
                case 'ul':
                    listLevel++; listTypes.push('ul'); listCounters.push(0); context.y -= 5;
                    element.childNodes.forEach(child => processNode(child, newStyle));
                    listLevel--; listTypes.pop(); listCounters.pop(); context.y -= 10;
                    return;
                
                case 'ol':
                    listLevel++; listTypes.push('ol'); listCounters.push(0); context.y -= 5;
                    element.childNodes.forEach(child => processNode(child, newStyle));
                    listLevel--; listTypes.pop(); listCounters.pop(); context.y -= 10;
                    return;
                
                case 'li':
                    checkAndAddPage(newStyle.lineHeight + 5); context.y -= 5;
                    const listType = listTypes[listLevel - 1];
                    let bullet = '';
                    if (listType === 'ul') bullet = '•  ';
                    else if (listType === 'ol') { listCounters[listLevel - 1]++; bullet = `${listCounters[listLevel - 1]}.  `; }
                    
                    const indent = context.margin + ((listLevel - 1) * 20);
                    const font = selectFont(newStyle);
                    const bulletWidth = font.widthOfTextAtSize(bullet, newStyle.size);
                    context.page.drawText(bullet, { x: indent, y: context.y, font, size: newStyle.size, color: newStyle.color });
                    
                    const originalMargin = context.margin;
                    context.margin = indent + bulletWidth;
                    
                    // Buffer and draw content for the list item
                    const buffer: { text: string; style: TextStyle }[] = [];
                    collectStyledFragments(element, newStyle, buffer);
                    drawAndWrapStyledFragments(buffer, context.currentAlignment);

                    context.margin = originalMargin;
                    return; // Handled children via buffer
            }

            // For block elements, buffer content and draw
            if (['p', 'h1', 'h2', 'h3'].includes(tagName)) {
                context.y -= spaceBefore;
                const buffer: { text: string; style: TextStyle }[] = [];
                collectStyledFragments(element, newStyle, buffer);
                drawAndWrapStyledFragments(buffer, context.currentAlignment);
                context.y -= spaceAfter;
            } else {
                // For inline elements, just continue traversal
                element.childNodes.forEach(child => processNode(child, newStyle));
            }
            
            context.currentAlignment = originalAlignment;
        }
    };

    // Initialize alignment and start processing
    context.currentAlignment = 'left';
    body.childNodes.forEach(node => processNode(node, defaultStyle));
}

// Function to create the letter PDF with security features
export async function createSecuredPdf(letterData: any, approvedRollNos: any, verificationUrl: string): Promise<{pdfBytes: Uint8Array, hash: string}> {
    const pdfDoc = await PDFDocument.create();
    const margin = 50;

    const cursor = {
        page: pdfDoc.addPage(PageSizes.A4),
        y: 0, width: 0, height: 0,
    };
   
    const { width, height } = cursor.page.getSize();
    cursor.width = width;
    cursor.height = height;
    cursor.y = height - margin;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const boldItalicFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

    const context: DrawContext = {
        pdfDoc: pdfDoc,
        page: cursor.page, y: cursor.y, width: cursor.width, height: cursor.height, margin: margin,
        font: font, boldFont: boldFont, italicFont: italicFont, boldItalicFont: boldItalicFont,
        currentAlignment: 'left',
    };

    const drawWatermark = (page: PDFPage) => {
        const watermarkText = `CMRIT-${letterData.clubName}`;
        for (let yPos = height; yPos > 0; yPos -= 100) {
            for (let xPos = 0; xPos < width; xPos += 150) {
                page.drawText(watermarkText, {
                    x: xPos, y: yPos, font, size: 30, color: rgb(0.85, 0.85, 0.85), opacity: 0.5, rotate: degrees(-45),
                });
            }
        }
    };
   
    drawWatermark(cursor.page);

    const checkAndAddPage = (spaceNeeded: number) => {
        if (context.y - spaceNeeded < margin) {
            context.page = pdfDoc.addPage(PageSizes.A4);
            drawWatermark(context.page);
            context.y = height - margin;
        }
    };
   
    // --- Drawing Starts Here ---
    const clubName = letterData.clubName;
    const clubNameWidth = boldFont.widthOfTextAtSize(clubName, 18);
    checkAndAddPage(20);
    context.page.drawText(clubName, { x: (width - clubNameWidth) / 2, y: context.y, font: boldFont, size: 18 });
    context.y -= 20;

    const qrCodeImage = await QRCode.toDataURL(verificationUrl);
    const qrCodePng = await pdfDoc.embedPng(qrCodeImage);
    context.page.drawImage(qrCodePng, { x: width - margin - 80, y: height - margin - 80, width: 80, height: 80 });
    const date = new Date(letterData.date.seconds * 1000).toLocaleDateString();
    context.page.drawText(`Date: ${date}`, { x: width - margin - 80, y: height - margin - 95, font, size: 12 });

    context.y = height - 150;

    const drawLine = (text: string, options: { font?: PDFFont, size?: number, lineHeight?: number } = {}) => {
        const { font: f = font, size = 12, lineHeight = 15 } = options;
        checkAndAddPage(lineHeight);
        context.page.drawText(text, { x: margin, y: context.y, font: f, size });
        context.y -= lineHeight;
    };
   
    drawLine('To,');
    drawLine('The Director,');
    drawLine('CMR Institute of Technology');
    drawLine('Medchal');

    context.y -= 25;
    drawLine(`Subject: ${letterData.subject}`, { font: boldFont, size: 12, lineHeight: 20 });
   
    context.y -= 20;
    drawLine('Respected Sir,', { lineHeight: 20 });
   
    await drawHtml(context, letterData.body, checkAndAddPage);

    // This wrapper function now uses the shared context.y
    const drawLineFromContext = (text: string, options: { font?: PDFFont, size?: number, lineHeight?: number } = {}) => {
        const { font: f = font, size = 12, lineHeight = 15 } = options;
        checkAndAddPage(lineHeight);
        context.page.drawText(text, { x: margin, y: context.y, font: f, size });
        context.y -= lineHeight;
    };

    context.y -= 20;
    drawLineFromContext('Yours Sincerely,');
    context.y -= 5;
    drawLineFromContext(letterData.sincerely, { font: boldFont });
   
    context.y -= 30;
    drawLineFromContext('Approval Status:', { font: boldFont, size: 12 });
    context.y -= 5;
    const approvalOrder = ['director', 'dsaa', 'tpo', 'cseHod', 'csmHod', 'csdHod', 'eceHod', 'frshHod'];
    approvalOrder.forEach(officialKey => {
        if (letterData.approvals[officialKey]) {
            const status = letterData.approvals[officialKey];
            const officialName = officialKey.replace('Hod', ' HOD').toUpperCase();
            drawLineFromContext(`${officialName}: ${status.toUpperCase()}`, { font, size: 10, lineHeight: 15 });
        }
    });

    context.y -= 30;
    drawLineFromContext('The following students are permitted:', { font: boldFont, size: 12 });
    context.y -= 10;
    
    // Simple text wrapping for the roll numbers section
    const simpleWrapText = (text: string, f: PDFFont, s: number, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (f.widthOfTextAtSize(testLine, s) <= maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    Object.keys(approvedRollNos).forEach(dept => {
        if (approvedRollNos[dept].length > 0) {
            drawLineFromContext(`${dept.toUpperCase()}:`, { font: boldFont, size: 10, lineHeight: 18 });
            const rollNoLines = simpleWrapText(approvedRollNos[dept].join(', '), font, 10, width - margin * 2 - 20);
            rollNoLines.forEach(line => {
                drawLineFromContext(line, { font, size: 10, lineHeight: 14 });
            });
            context.y -= 4;
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
