'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';

interface LettersListProps {
    filter: 'pending' | 'approved' | 'rejected';
}

export const LettersList: React.FC<LettersListProps> = ({ filter }) => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLetters = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'permissionLetters'),
                    where('uid', '==', user.uid),
                    where('status', '==', filter),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const fetchedLetters = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as PermissionLetter));
                setLetters(fetchedLetters);
            } catch (error) {
                console.error('Error fetching letters:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLetters();
    }, [user, filter]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (letters.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">No {filter} permission letters found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {letters.map(letter => (
                <div key={letter.id} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-800">{letter.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            letter.status === 'approved' ? 'bg-green-100 text-green-800' :
                            letter.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {letter.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Submitted on: {letter.createdAt?.toDate().toLocaleDateString()}
                    </p>
                    <div className="mt-4 text-sm text-gray-600">
                        <p><strong>Sincerely:</strong> {letter.sincerely}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};