'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';
import { ApprovalStatus } from '@/types/auth';
import { LetterModal } from '@/components/common/LetterModal';

export const PermissionLettersDashboard: React.FC = () => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter] = useState<'pending' | 'approved' | 'rejected'>('pending');
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) return <div className="text-black">Loading...</div>;

    return (
        <div>
            <div className="mt-6">
                {letters.length === 0 ? (
                    <p className="text-center text-black">No {filter} letters to display.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {letters.map(letter => (
                            <div
                                key={letter.id}
                                onClick={() => handleCardClick(letter)}
                                className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
                            >
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                                        {letter.clubName}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status || 'pending')}`}>
                                        {(letter.status || 'pending').toUpperCase()}
                                    </span>
                                </div>

                                {/* Subject */}
                                <div className="mb-3">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Subject:</p>
                                    <p className="text-sm text-gray-600 line-clamp-2">{letter.subject}</p>
                                </div>

                                {/* Date */}
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Submitted:</p>
                                    <p className="text-sm text-gray-600">
                                        {letter.createdAt?.toDate().toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Quick Status Indicator */}
                                <div className="text-xs text-gray-500 border-t pt-3">
                                    Click to view details
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <LetterModal
                letter={selectedLetter}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                isOfficialView={true}
                onApprove={(letterId) => handleLetterApproval(letterId, 'approved')}
                onReject={(letterId) => handleLetterApproval(letterId, 'rejected')}
                onRollNoApproval={handleRollNoApproval}
                userRole={user?.officialRole}
                filter={filter}
                updating={updating}
            />
        </div>
    );
};