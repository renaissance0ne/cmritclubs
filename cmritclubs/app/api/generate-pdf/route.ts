import { NextRequest, NextResponse } from 'next/server';
// REMOVED: Client SDK imports
// import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
import { db, admin } from '@/lib/firebase-admin'; // Import admin to get serverTimestamp
import { createSecuredPdf } from '@/lib/pdf';
import { utapi } from '@/app/api/uploadthing/core';
import { PermissionLetter } from '@/types/letters';

export async function POST(req: NextRequest) {
    try {
        const { letterId } = await req.json();

        if (!letterId) {
            return NextResponse.json({ error: 'Letter ID is required' }, { status: 400 });
        }

        // 1. Fetch letter data from Firestore using Admin SDK methods
        const letterRef = db.collection('permissionLetters').doc(letterId);
        const letterSnap = await letterRef.get();

        if (!letterSnap.exists) {
            return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
        }

        const letterData = letterSnap.data() as PermissionLetter;
        letterData.id = letterSnap.id;

        // Ensure the letter is actually approved
        if (letterData.status !== 'approved') {
            return NextResponse.json({ error: 'Letter is not fully approved' }, { status: 400 });
        }

        // 2. Filter for approved roll numbers only
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

        // 3. Generate the secured PDF
        const { pdfBytes, hash } = await createSecuredPdf(letterData, approvedRollNos);

        // 4. Upload the PDF to UploadThing from the server
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const fileName = `PermissionLetter_${letterId}_${Date.now()}.pdf`;
        
        // Use the UTApi to upload the file
        const uploadResult = await utapi.uploadFiles(new File([pdfBlob], fileName));

        if (!uploadResult.data) {
             throw new Error('Failed to upload PDF to UploadThing');
        }

        const generatedPdfUrl = uploadResult.data.url;

        // 5. Update the Firestore document with the PDF URL and hash using Admin SDK methods
        await letterRef.update({
            generatedPdfUrl: generatedPdfUrl,
            pdfHash: hash,
            updatedAt: admin.firestore.FieldValue.serverTimestamp() // Use Admin SDK serverTimestamp
        });

        return NextResponse.json({
            message: 'PDF generated and stored successfully',
            pdfUrl: generatedPdfUrl,
            hash: hash
        });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 });
    }
}