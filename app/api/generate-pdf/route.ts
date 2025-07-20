import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { createSecuredPdf } from '@/lib/pdf';
import { utapi } from '@/app/api/uploadthing/core';
import { PermissionLetter } from '@/types/letters';
import { headers } from 'next/headers';
import { PDFDocument } from 'pdf-lib';

// --- Imports for QPDF Integration ---
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

// Promisify execFile to use it with async/await
const execFileAsync = promisify(execFile);

// (The getUserFromToken function remains the same)
const getUserFromToken = async () => {
    const authHeader = (await headers()).get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

    const idToken = authHeader.split("Bearer ")[1];
    try {
        return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error("Firebase token verification failed:", error);
        return null;
    }
};

// (The flattenPdf function remains a good step to have before encryption)
async function flattenPdf(pdfBytes: Uint8Array): Promise<Uint8Array> {
    try {
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        if (form.getFields().length > 0) {
            form.flatten();
        }
        return await pdfDoc.save();
    } catch (error) {
        console.error('Error applying PDF flattening:', error);
        return pdfBytes;
    }
}

export async function POST(req: NextRequest) {
    const tempId = crypto.randomBytes(12).toString('hex');
    // --- Use os.tmpdir() to get the correct temp directory for any OS ---
    const tempDirectory = os.tmpdir(); // <--- 2. GET THE OS-SPECIFIC TEMP DIRECTORY
    const tempInputPath = path.join(tempDirectory, `unsecured_${tempId}.pdf`);
    const tempOutputPath = path.join(tempDirectory, `secured_${tempId}.pdf`);
    const qpdfPath = path.resolve('./qpdf/bin/qpdf');
    const libPath = path.resolve('./qpdf/lib');

    try {
        // Step 1 & 2: Authenticate & Authorize User
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'college_official') {
            return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
        }

        const { letterId } = await req.json();
        if (!letterId) {
            return NextResponse.json({ error: 'Letter ID is required' }, { status: 400 });
        }

        // Step 3: Fetch letter data
        const letterRef = db.collection('permissionLetters').doc(letterId);
        const letterSnap = await letterRef.get();
        if (!letterSnap.exists) {
            return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
        }
        const letterData = letterSnap.data() as PermissionLetter;
        if (letterData.status !== 'approved') {
            return NextResponse.json({ error: 'Letter is not fully approved' }, { status: 400 });
        }
        if (letterData.generatedPdfUrl) {
            return NextResponse.json({ message: 'PDF already exists', pdfUrl: letterData.generatedPdfUrl, hash: letterData.pdfHash });
        }

        // Step 4 & 5: Prepare data for PDF generation
        const verificationUrl = `https://cmritclubs.vercel.app/verify-letter/${letterId}`;
        const approvedRollNos: { [key: string]: string[] } = {};
        if (letterData.rollNoApprovals) {
            for (const dept in letterData.rollNoApprovals) {
                approvedRollNos[dept] = Object.keys(letterData.rollNoApprovals[dept]).filter(
                    rollNo => letterData.rollNoApprovals![dept][rollNo] === 'approved'
                );
            }
        }

        // Step 6: Generate and flatten the initial PDF
        const { pdfBytes, hash } = await createSecuredPdf(letterData, approvedRollNos, verificationUrl);
        const flattenedPdfBytes = await flattenPdf(pdfBytes);

        // --- Step 7: Apply QPDF Security ---
        const ownerPassword = crypto.randomBytes(16).toString('hex');

        // 7a. Write to the OS's temp directory
        await fs.writeFile(tempInputPath, flattenedPdfBytes);

        // 7b. Execute qpdf
        await execFileAsync(qpdfPath, [
            tempInputPath,
            tempOutputPath,
            '--encrypt', '', ownerPassword, '256',
            '--print=full',
            '--modify=none',
            '--extract=n',
            '--cleartext-metadata',
            '--'
        ], {
            env: {
                    ...process.env,
                    'LD_LIBRARY_PATH': libPath
                }
        });




        // 7c. Read the secured PDF
        const securedPdfBytes = await fs.readFile(tempOutputPath);

        // Step 8: Upload to UploadThing
        const fileName = `PermissionLetter_${letterId}.pdf`;
        const uploadResponse = await utapi.uploadFiles([new File([securedPdfBytes], fileName)]);

        const uploadResult = uploadResponse[0];
        if (uploadResult.error) {
            throw new Error(`UploadThing error: ${uploadResult.error.message}`);
        }
        const finalPdfUrl = uploadResult.data.url;

        // Step 9: Update Firestore
        await letterRef.update({
            generatedPdfUrl: finalPdfUrl,
            pdfHash: hash,
            isSecured: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return NextResponse.json({
            message: 'Secured PDF generated and stored successfully',
            pdfUrl: finalPdfUrl,
            hash: hash
        });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        // Note: The error object from your log is now in the 'details' field
        return NextResponse.json({ error: 'Failed to generate PDF', details: error }, { status: 500 });
    } finally {
        // --- Step 10: Cleanup ---
        try {
            await fs.unlink(tempInputPath);
            await fs.unlink(tempOutputPath);
        } catch (cleanupError: any) {
            if (cleanupError.code !== 'ENOENT') {
                console.error('Failed to cleanup temporary PDF files:', cleanupError);
            }
        }
    }
}
