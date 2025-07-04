'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';

export const PermissionLettersDashboard: React.FC = () => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        const fetchLetters = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'permissionLetters'),
                    where('status', '==', filter)
                );
                const querySnapshot = await getDocs(q);
                const fetchedLetters = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as PermissionLetter));
                setLetters(fetchedLetters);
            } catch (error) {
                console.error("Error fetching permission letters: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLetters();
    }, [user, filter]);

    const handleLetterApproval = async (letterId: string, newStatus: 'approved' | 'rejected') => {
        if (!user) return;
        setUpdating(letterId);
        try {
            const letterRef = doc(db, 'permissionLetters', letterId);
            await updateDoc(letterRef, {
                status: newStatus,
                [`approvals.${user.officialRole}`]: newStatus,
                updatedAt: serverTimestamp()
            });
            setLetters(prev => prev.filter(l => l.id !== letterId));
        } catch (error) {
            console.error("Error updating letter status: ", error);
        } finally {
            setUpdating(null);
        }
    };

    const handleRollNoApproval = async (letterId: string, department: string, rollNo: string, approval: 'approved' | 'rejected') => {
        if (!user) return;
        setUpdating(`${letterId}-${rollNo}`);
        try {
            const letterRef = doc(db, 'permissionLetters', letterId);
            await updateDoc(letterRef, {
                [`rollNoApprovals.${department}.${rollNo}`]: approval,
                updatedAt: serverTimestamp()
            });
            // Re-fetch to show updated state - for simplicity here
             const q = query(
                    collection(db, 'permissionLetters'),
                    where('status', '==', filter)
                );
                const querySnapshot = await getDocs(q);
                const fetchedLetters = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as PermissionLetter));
                setLetters(fetchedLetters);
        } catch (error) {
            console.error("Error updating roll number approval: ", error);
        } finally {
            setUpdating(null);
        }
    };

    const myDepartment = user?.officialRole ? user.officialRole.split('_')[0] : '';


    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-center border-b border-gray-200">
                <button onClick={() => setFilter('pending')} className={`px-4 py-2 text-sm font-medium ${filter === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Pending</button>
                <button onClick={() => setFilter('approved')} className={`px-4 py-2 text-sm font-medium ${filter === 'approved' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Approved</button>
                <button onClick={() => setFilter('rejected')} className={`px-4 py-2 text-sm font-medium ${filter === 'rejected' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Rejected</button>
            </div>
            <div className="mt-6 space-y-6">
                {letters.map(letter => (
                    <div key={letter.id} className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold">{letter.clubName}</h3>
                        <p className="text-sm text-gray-500">Submitted: {letter.createdAt?.toDate().toLocaleDateString()}</p>
                        <p className="mt-4"><strong>Subject:</strong> {letter.subject}</p>
                        <p className="mt-2 whitespace-pre-wrap">{letter.body}</p>
                        <p className="mt-4"><strong>Sincerely,</strong><br/>{letter.sincerely}</p>

                        <div className="mt-6">
                            <h4 className="font-semibold">Roll Numbers:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                                {Object.entries(letter.rollNos).map(([dept, rns]) => (
                                    <div key={dept}>
                                        <h5 className="text-sm font-bold capitalize">{dept}</h5>
                                        <ul className="text-xs list-disc list-inside">
                                            {rns.split('\n').map(rn => (
                                                <li key={rn} className="flex items-center justify-between">
                                                    <span>{rn}</span>
                                                    {user?.officialRole === `${dept}_hod` && filter === 'pending' && (
                                                        <div className="flex space-x-1">
                                                            <button onClick={() => handleRollNoApproval(letter.id, dept, rn, 'approved')} disabled={updating === `${letter.id}-${rn}`} className="text-green-500 disabled:opacity-50">✓</button>
                                                            <button onClick={() => handleRollNoApproval(letter.id, dept, rn, 'rejected')} disabled={updating === `${letter.id}-${rn}`} className="text-red-500 disabled:opacity-50">✗</button>
                                                        </div>
                                                    )}
                                                     <span className={`text-xs ${letter.rollNoApprovals?.[dept]?.[rn] === 'approved' ? 'text-green-600' : letter.rollNoApprovals?.[dept]?.[rn] === 'rejected' ? 'text-red-600' : ''}`}>
                                                        {letter.rollNoApprovals?.[dept]?.[rn]}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {filter === 'pending' && (
                            <div className="mt-6 flex space-x-2">
                                <button onClick={() => handleLetterApproval(letter.id, 'approved')} disabled={updating === letter.id} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50">Approve Letter</button>
                                <button onClick={() => handleLetterApproval(letter.id, 'rejected')} disabled={updating === letter.id} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50">Reject Letter</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};