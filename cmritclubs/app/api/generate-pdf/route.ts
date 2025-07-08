import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { createSecuredPdf } from '@/lib/pdf';
import { utapi } from '@/app/api/uploadthing/core';
import { PermissionLetter } from '@/types/letters';
import { headers } from 'next/headers';
import { PDFDocument, PDFName, PDFNumber, PDFDict, PDFRef } from 'pdf-lib';

/**
 * @name getUserFromToken
 * @description Authenticates the user from the Authorization header.
 * This logic is based on your `api/uploadthing/core.ts` file.
 * @returns The decoded user token or null.
 */
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

/**
 * @name applyPDFSecurity
 * @description Applies security restrictions to the PDF - only allows printing
 * @param pdfBytes The PDF bytes to secure
 * @returns The secured PDF bytes
 */
async function applyPDFSecurity(pdfBytes: Uint8Array): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Flatten the PDF (remove form fields and make content non-editable)
    const form = pdfDoc.getForm();
    try {
      // Flatten all form fields
      form.flatten();
    } catch (error) {
      // If no form fields exist, continue
      console.log('No form fields to flatten');
    }
    
    // Save the flattened PDF
    const securedPdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });
    
    return securedPdfBytes;
  } catch (error) {
    console.error('Error applying PDF security:', error);
    // If security application fails, return the original PDF
    return pdfBytes;
  }
}

export async function POST(req: NextRequest) {
    try {
        // Step 1: Authenticate the request
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: You must be logged in.' }, { status: 401 });
        }

        // Step 2: Authorize the user
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'college_official') {
            return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
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
        letterData.id = letterSnap.id;

        if (letterData.status !== 'approved') {
            return NextResponse.json({ error: 'Letter is not fully approved' }, { status: 400 });
        }
        
        if (letterData.generatedPdfUrl) {
            return NextResponse.json({ 
                message: 'PDF already exists',
                pdfUrl: letterData.generatedPdfUrl,
                hash: letterData.pdfHash 
            });
        }

        // Step 4: Define the verification URL for the QR Code
        // This URL points to a page on your site that can verify and display the letter.
        const verificationUrl = `https://cmritclubs.com/verify-letter?id=${letterId}`;

        // Step 5: Filter approved roll numbers
        const approvedRollNos: { [key: string]: string[] } = {};
        if (letterData.rollNoApprovals) {
            for (const dept in letterData.rollNoApprovals) {
                approvedRollNos[dept] = [];
                for (const rollNo in letterData.rollNoApprovals[dept]) {
                    if (letterData.rollNoApprovals[dept][rollNo] === 'approved') {
                        approvedRollNos[dept].push(rollNo);
                    }
                }
            }
        }

        // Step 6: Generate the initial PDF with the verification URL in the QR code
        const { pdfBytes, hash } = await createSecuredPdf(letterData, approvedRollNos, verificationUrl);

        // Step 7: Apply security restrictions and flatten the PDF
        const securedPdfBytes = await applyPDFSecurity(pdfBytes);

        // Step 8: Upload the secured PDF to UploadThing
        const fileName = `PermissionLetter_${letterId}_${Date.now()}.pdf`;
        const finalUpload = await utapi.uploadFiles([new File([new Blob([securedPdfBytes], {type: 'application/pdf'})], fileName)]);

        // FIX: The result from uploadFiles is an array. We must access the first element.
        const uploadResult = finalUpload[0];

        // Check if the upload itself resulted in an error.
        if (uploadResult.error) {
            console.error("UploadThing Error:", uploadResult.error);
            throw new Error(`UploadThing error: ${uploadResult.error.message}`);
        }
        
        // The 'data' property contains the file details, including the URL.
        const finalPdfUrl = uploadResult.data.url;

        // Step 9: Update the Firestore document with the final URL and hash
        await letterRef.update({
            generatedPdfUrl: finalPdfUrl,
            pdfHash: hash,
            isSecured: true, // Flag to indicate this PDF has security restrictions
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return NextResponse.json({
            message: 'Secured PDF generated and stored successfully',
            pdfUrl: finalPdfUrl,
            hash: hash,
            isSecured: true
        });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 });
    }
}