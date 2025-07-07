'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';

export const ApprovedLettersList: React.FC = () => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApprovedLetters = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'permissionLetters'),
                    where('uid', '==', user.uid),
                    where('status', '==', 'approved'),
                    where('generatedPdfUrl', '!=', null), // Ensure PDF has been generated
                    orderBy('generatedPdfUrl'),
                    orderBy('updatedAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const fetchedLetters = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as PermissionLetter));
                setLetters(fetchedLetters);
            } catch (error) {
                console.error('Error fetching approved letters:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApprovedLetters();
    }, [user]);

    if (loading) {
        return <div className="text-center p-10 text-black">Loading approved letters...</div>;
    }

    if (letters.length === 0) {
        return <div className="text-center py-10"><p className="text-gray-500">No finalized approved letters found.</p></div>;
    }

    return (
        <div className="space-y-6">
            {letters.map(letter => (
                <div key={letter.id} className="bg-white p-6 rounded-lg shadow-md text-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-black">{letter.subject}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Approved on: {letter.updatedAt?.toDate().toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Hash: {letter.pdfHash?.substring(0, 12)}...
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <a
                                href={letter.generatedPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={`PermissionLetter_${letter.clubName}_${letter.id}.pdf`}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                             >
                                Download PDF
                            </a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};