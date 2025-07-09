'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PermissionLetter } from '@/types/letters';
import Image from 'next/image';

// Helper to format date
const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Status color helper
const getStatusColor = (status: string) => {
    switch (status) {
        case 'approved': return 'text-green-700 bg-green-100';
        case 'rejected': return 'text-red-700 bg-red-100';
        case 'pending': return 'text-yellow-700 bg-yellow-100';
        default: return 'text-gray-700 bg-gray-100';
    }
};

const officialRoles = {
    director: 'Director',
    dsaa: 'DSAA',
    tpo: 'TPO',
    cseHod: 'CSE HOD',
    csmHod: 'CSM HOD',
    csdHod: 'CSD HOD',
    frshHod: 'Freshman HOD',
    eceHod: 'ECE HOD'
};

export default function VerifyLetterPage() {
    const params = useParams();
    const letterId = params.letterId as string;

    const [letter, setLetter] = useState<PermissionLetter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (letterId) {
            const fetchLetter = async () => {
                try {
                    setLoading(true);
                    const letterRef = doc(db, 'permissionLetters', letterId);
                    const letterSnap = await getDoc(letterRef);

                    if (letterSnap.exists()) {
                        setLetter({ id: letterSnap.id, ...letterSnap.data() } as PermissionLetter);
                    } else {
                        setError('This permission letter could not be found. It may have been deleted or the link is incorrect.');
                    }
                } catch (err) {
                    console.error("Error fetching letter:", err);
                    setError('An error occurred while trying to verify the letter.');
                } finally {
                    setLoading(false);
                }
            };

            fetchLetter();
        }
    }, [letterId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                <p className="text-lg text-gray-700 ml-4">Verifying Letter...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md text-center">
                    <Image src="/logo.png" alt="Error" width={60} height={60} className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
                    <p className="text-gray-700">{error}</p>
                </div>
            </div>
        );
    }
    
    if (!letter) {
        return null; // Should be handled by loading/error states
    }

    const isVerified = letter.status === 'approved' && letter.generatedPdfUrl && letter.pdfHash;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className={`p-6 ${isVerified ? 'bg-green-600' : 'bg-yellow-500'}`}>
                     <div className="flex justify-center items-center space-x-4">
                        <Image src="/logo.png" alt="CMRIT Logo" width={50} height={50} />
                        <h1 className="text-3xl font-bold text-white text-center">
                            {isVerified ? 'Authentic Letter Verified' : 'Letter Verification'}
                        </h1>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Header Section */}
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-800">{letter.clubName}</h2>
                        <p className="text-sm text-gray-500 mt-1">Permission Letter</p>
                    </div>

                    {/* Subject and Date */}
                    <div className="pb-6 border-b">
                         <p className="text-gray-600"><strong>Date Submitted:</strong> {formatDate(letter.createdAt)}</p>
                         <h3 className="text-xl font-semibold text-gray-900 mt-4">{letter.subject}</h3>
                    </div>

                    {/* Body */}
                    <div className="prose max-w-none">
                        <p className="text-gray-800 whitespace-pre-wrap">{letter.body}</p>
                    </div>

                    {/* Sincerely */}
                    <div className="pt-6 border-t text-right">
                        <p className="text-gray-800">Yours Sincerely,</p>
                        <p className="font-semibold text-gray-900">{letter.sincerely}</p>
                    </div>

                    {/* Approval Status */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Official Approval Status</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(letter.approvals).map(([key, status]) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
                                    <span className="font-medium text-gray-700">{officialRoles[key as keyof typeof officialRoles]}:</span>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(status)}`}>{status.toUpperCase()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Approved Roll Numbers */}
                    {letter.rollNoApprovals && (
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Permitted Students</h4>
                            {Object.values(letter.rollNoApprovals).every(dept => Object.keys(dept).length === 0) ? (
                                <p className="text-gray-500">No students were listed for this event.</p>
                            ) : (
                                Object.entries(letter.rollNoApprovals).map(([dept, approvals]) => {
                                    const approvedStudents = Object.entries(approvals).filter(([, status]) => status === 'approved').map(([rollNo]) => rollNo);
                                    if (approvedStudents.length === 0) return null;
                                    return (
                                        <div key={dept} className="mb-3">
                                            <h5 className="font-bold capitalize text-gray-700">{dept === 'frsh' ? 'Freshman' : dept}</h5>
                                            <p className="text-sm text-gray-600">{approvedStudents.join(', ')}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Verification Hash */}
                    {letter.pdfHash && (
                        <div className="text-center pt-6 border-t border-dashed">
                            <p className="text-sm text-gray-600">Document Hash (SHA-256)</p>
                            <p className="font-mono text-xs text-gray-500 break-all mt-1">{letter.pdfHash}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}