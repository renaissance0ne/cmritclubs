'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';
import { ApprovalStatus } from '@/types/auth';
import { LetterCard } from '@/components/ui/LetterCard';
import { LetterDetailModal } from '@/components/ui/LetterDetailModal';

export const PermissionLettersDashboard: React.FC = () => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedLetter, setSelectedLetter] = useState<PermissionLetter | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleCardClick = (letter: PermissionLetter) => {
        setSelectedLetter(letter);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLetter(null);
    };

    if (loading) return <div className="text-black">Loading...</div>;

    return (
        <div>
            <div className="mb-4 flex space-x-2">
                <button 
                    onClick={() => setFilter('pending')} 
                    className={`px-3 py-2 rounded-md text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Pending
                </button>
                <button 
                    onClick={() => setFilter('approved')} 
                    className={`px-3 py-2 rounded-md text-sm ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Approved
                </button>
                <button 
                    onClick={() => setFilter('rejected')} 
                    className={`px-3 py-2 rounded-md text-sm ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Rejected
                </button>
            </div>
            
            {letters.length === 0 ? (
                <p className="text-center text-black">No {filter} letters to display.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {letters.map(letter => (
                        <LetterCard 
                            key={letter.id} 
                            letter={letter} 
                            onClick={() => handleCardClick(letter)}
                        />
                    ))}
                </div>
            )}

            <LetterDetailModal 
                letter={selectedLetter}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                showActions={filter === 'pending'}
                onApprove={(letterId) => handleLetterApproval(letterId, 'approved')}
                onReject={(letterId) => handleLetterApproval(letterId, 'rejected')}
                updating={updating}
                userRole={user?.officialRole}
                onRollNoApproval={handleRollNoApproval}
            />
        </div>
    );
};