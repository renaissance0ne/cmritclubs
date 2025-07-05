'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';
import { ApprovalStatus } from '@/types/auth';

const departmentOrder = ['cse', 'csm', 'csd', 'frsh', 'ece'];

export const PermissionLettersDashboard: React.FC = () => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [updating, setUpdating] = useState<string | null>(null);

    const getMyApprovalRole = useCallback((): keyof ApprovalStatus | null => {
        if (!user || user.role !== 'college_official') return null;
        switch (user.officialRole) {
            case 'director': return 'director';
            case 'dsaa': return 'dsaa';
            case 'tpo': return 'tpo';
            case 'cse_hod': return 'cseHod';
            case 'csm_hod': return 'csmHod';
            case 'csd_hod': return 'csdHod';
            case 'frsh_hod': return 'frshHod';
            case 'ece_hod': return 'eceHod';
            default: return null;
        }
    }, [user]);

    const calculateOverallStatus = (approvals: ApprovalStatus): 'pending' | 'approved' | 'rejected' => {
        const statuses = Object.values(approvals);
        if (statuses.some(status => status === 'rejected')) return 'rejected';
        if (statuses.every(status => status === 'approved')) return 'approved';
        return 'pending';
    };

    const fetchLetters = useCallback(async () => {
        const myRole = getMyApprovalRole();
        if (!user || !myRole) {
            setLoading(false);
            return;
        };
        setLoading(true);
        try {
            // Corrected query to fetch letters relevant to the official
            const q = query(
                collection(db, 'permissionLetters'),
                where(`approvals.${myRole}`, '==', filter)
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
    }, [user, filter, getMyApprovalRole]);

    useEffect(() => {
        fetchLetters();
    }, [fetchLetters]);

    const handleLetterApproval = async (letterId: string, newStatus: 'approved' | 'rejected') => {
        const myRole = getMyApprovalRole();
        if (!user || !myRole) return;

        setUpdating(letterId);
        try {
            const letterRef = doc(db, 'permissionLetters', letterId);
            const letterSnap = await getDoc(letterRef);
            if (!letterSnap.exists()) return;

            const letterData = letterSnap.data() as PermissionLetter;
            const updatedApprovals = { ...letterData.approvals, [myRole]: newStatus };
            const newOverallStatus = calculateOverallStatus(updatedApprovals);

            await updateDoc(letterRef, {
                approvals: updatedApprovals,
                status: newOverallStatus,
                updatedAt: serverTimestamp()
            });
            // Refresh list after update
            fetchLetters();
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
            // Re-fetch to show updated state
            fetchLetters();
        } catch (error) {
            console.error("Error updating roll number approval: ", error);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="text-black">Loading...</div>;

    return (
        <div>
            <div className="mt-6 space-y-6">
                {letters.length === 0 ? <p className="text-center text-black">No {filter} letters to display.</p> : letters.map(letter => (
                    <div key={letter.id} className="bg-white p-6 rounded-lg shadow-md text-black">
                        <div className="text-sm mb-4 text-black">
                            <p>To,</p>
                            <p>The Director,</p>
                            <p>CMR Institute of Technology</p>
                            <p>Medchal</p>
                        </div>

                        <h3 className="text-xl font-bold text-black">{letter.clubName}</h3>
                        <p className="text-sm text-black">Submitted: {letter.createdAt?.toDate().toLocaleDateString()}</p>
                        <p className="mt-4 text-black"><strong>Subject:</strong> {letter.subject}</p>
                        <p className="mt-2 whitespace-pre-wrap text-black">{letter.body}</p>
                        <p className="mt-4 text-black"><strong>Sincerely,</strong><br/>{letter.sincerely}</p>

                        <div className="mt-6">
                            <h4 className="font-semibold text-black">Roll Numbers for Approval:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
                                {departmentOrder.map(dept => {
                                    const rns = letter.rollNos[dept as keyof typeof letter.rollNos];
                                    if (!rns) return null;
                                    return (
                                    <div key={dept}>
                                        <h5 className="text-sm font-bold capitalize text-black">{dept === 'frsh' ? 'Freshman' : dept}</h5>
                                        <ul className="text-xs list-inside space-y-1 text-black">
                                            {rns.split('\n').filter(rn => rn.trim()).map(rn => (
                                                <li key={rn} className="flex items-center justify-between">
                                                    <span>{rn}</span>
                                                    {user?.officialRole === `${dept}_hod` && filter === 'pending' && (
                                                        <div className="flex space-x-1">
                                                            <button onClick={() => handleRollNoApproval(letter.id, dept, rn, 'approved')} disabled={updating === `${letter.id}-${rn}`} className="text-green-500 disabled:opacity-50">✓</button>
                                                            <button onClick={() => handleRollNoApproval(letter.id, dept, rn, 'rejected')} disabled={updating === `${letter.id}-${rn}`} className="text-red-500 disabled:opacity-50">✗</button>
                                                        </div>
                                                    )}
                                                    <span className={`text-xs font-semibold ${letter.rollNoApprovals?.[dept]?.[rn] === 'approved' ? 'text-green-600' : letter.rollNoApprovals?.[dept]?.[rn] === 'rejected' ? 'text-red-600' : 'text-gray-400'}`}>
                                                        {letter.rollNoApprovals?.[dept]?.[rn] || 'Pending'}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )})}
                            </div>
                        </div>

                        {filter === 'pending' && !user?.officialRole?.includes('hod') && (
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