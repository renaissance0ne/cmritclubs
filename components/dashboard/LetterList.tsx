'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';

interface LettersListProps {
    filter: 'pending' | 'approved' | 'rejected';
}

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

export const LettersList: React.FC<LettersListProps> = ({ filter }) => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLetters = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // FIX: Added orderBy to sort letters by creation date on the server.
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

    useEffect(() => {
        fetchLetters();
    }, [user, filter]);

    const handleDelete = async (letterId: string) => {
        if (!confirm("Are you sure you want to delete this letter? This action cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, 'permissionLetters', letterId));
            setLetters(letters.filter(letter => letter.id !== letterId));
        } catch (error) {
            console.error("Error deleting letter:", error);
            alert("Failed to delete letter.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };


    if (loading) {
        return <div className="text-center p-10 text-black">Loading...</div>;
    }

    if (letters.length === 0) {
        return <div className="text-center py-10"><p className="text-gray-500">No {filter} permission letters found.</p></div>;
    }

    return (
        <div className="space-y-6">
            {letters.map(letter => (
                <div key={letter.id} className="bg-white p-6 rounded-lg shadow-md text-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-black">{letter.subject}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Submitted on: {letter.createdAt?.toDate().toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status)}`}>
                                {letter.status.toUpperCase()}
                            </span>
                            <button onClick={() => handleDelete(letter.id)} className="text-red-500 hover:text-red-700 text-sm p-1">
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-black">
                        <p><strong>Sincerely:</strong> {letter.sincerely}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <h4 className="text-md font-semibold text-black mb-2">Approval Status</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            {Object.entries(letter.approvals).map(([key, status]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="text-black">{officialRoles[key as keyof typeof officialRoles]}:</span>
                                    <span className={`font-medium ${getStatusColor(status)} px-2 rounded`}>{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {letter.rollNoApprovals && Object.keys(letter.rollNoApprovals).length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-md font-semibold text-black mb-2">HOD Roll Number Approvals</h4>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(letter.rollNoApprovals).map(([dept, approvals]) =>
                                    Object.keys(approvals).length > 0 && (
                                        <div key={dept}>
                                            <h5 className="font-bold capitalize text-black">{dept}</h5>
                                            <ul className="list-disc list-inside text-xs text-black">
                                                {Object.entries(approvals).map(([rollNo, status]) => (
                                                    <li key={rollNo}>
                                                        {rollNo}: <span className={`font-semibold ${status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>{status}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
