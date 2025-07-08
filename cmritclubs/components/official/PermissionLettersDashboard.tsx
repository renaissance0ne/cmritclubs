'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';
import { ApprovalStatus } from '@/types/auth';

const departmentOrder = ['cse', 'csm', 'csd', 'frsh', 'ece'];

export const PermissionLettersDashboard: React.FC = () => {
    const { user, getToken } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [approvalError, setApprovalError] = useState('');

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

    const calculateOverallStatus = (approvals: any): 'pending' | 'approved' | 'rejected' => {
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
    
    useEffect(() => {
        setSelectedLetter(null);
        setApprovalError(''); // Reset error when filter changes
    }, [filter]);

    const triggerPdfGeneration = async (letterId: string) => {
        try {
            const token = await getToken();
            if (!token) {
                console.error("Authentication token not found. Cannot generate PDF.");
                return;
            }
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ letterId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'PDF generation failed');
            }

            console.log('PDF generation triggered for letter:', letterId);
        } catch (error) {
            console.error('Failed to trigger PDF generation:', error);
        }
    };

    const handleLetterApproval = async (letterId: string, newStatus: 'approved' | 'rejected') => {
        const myRole = getMyApprovalRole();
        if (!user || !myRole) return;

        setUpdating(letterId);
        try {
            const letterRef = doc(db, 'permissionLetters', letterId);
            const letterSnap = await getDoc(letterRef);
            if (!letterSnap.exists()) return;

            const letterData = letterSnap.data() as PermissionLetter;

            // HOD Validation: Check if all roll numbers are reviewed
            if (user.officialRole?.includes('_hod')) {
                const deptKey = user.officialRole.replace('_hod', '');
                const studentRolls = letterData.rollNos[deptKey as keyof typeof letterData.rollNos]?.split('\n').filter(rn => rn.trim()) || [];
                const reviewedRolls = Object.keys(letterData.rollNoApprovals?.[deptKey] || {});

                if (studentRolls.length > 0 && studentRolls.length !== reviewedRolls.length) {
                    const unreviewedCount = studentRolls.length - reviewedRolls.length;
                    setApprovalError(`You must approve or reject all ${studentRolls.length} students from your department first. ${unreviewedCount} remaining.`);
                    setUpdating(null);
                    return;
                }
            }

            setApprovalError(''); // Clear previous errors

            const updatedApprovals = { ...letterData.approvals, [myRole]: newStatus };
            const newOverallStatus = calculateOverallStatus(updatedApprovals);

            await updateDoc(letterRef, {
                approvals: updatedApprovals,
                status: newOverallStatus,
                updatedAt: serverTimestamp()
            });

            // If the letter is now fully approved, trigger PDF generation
            if (newOverallStatus === 'approved') {
                await triggerPdfGeneration(letterId);
            }

            fetchLetters();
            setSelectedLetter(null); // Go back to grid view after action
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
            // Refetch the specific letter to update the view
            const updatedLetterSnap = await getDoc(letterRef);
            if (updatedLetterSnap.exists()) {
                const updatedLetterData = { id: updatedLetterSnap.id, ...updatedLetterSnap.data() } as PermissionLetter;
                setLetters(prev => prev.map(l => l.id === letterId ? updatedLetterData : l));
            }
        } catch (error) {
            console.error("Error updating roll number approval: ", error);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="text-black text-center p-10">Loading letters...</div>;

    if (selectedLetter) {
        const letter = letters.find(l => l.id === selectedLetter);
        if (!letter) return <div className="text-black">Letter not found</div>;
        
        return (
            <div>
                <div className="mb-4 flex items-center space-x-4">
                    <button 
                        onClick={() => { setSelectedLetter(null); setApprovalError(''); }}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                    >
                        <span>←</span>
                        <span>Back to List</span>
                    </button>
                    <h2 className="text-lg font-semibold text-black">Letter Details</h2>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md text-black">
                    <h3 className="text-xl font-bold text-black">{letter.clubName}</h3>
                    
                    <div className="text-sm mb-4 text-black">
                        <p>To,</p>
                        <p>The Director,</p>
                        <p>CMR Institute of Technology</p>
                        <p>Medchal</p>
                    </div>
                    <p className="text-sm text-black">Submitted: {letter.createdAt?.toDate().toLocaleDateString()}</p>
                    <p className="mt-4 text-black"><strong>Subject:</strong> {letter.subject}</p>
                    <p className="mt-2 whitespace-pre-wrap text-black">{letter.body}</p>
                    <p className="mt-4 text-black"><strong>Sincerely,</strong><br/>{letter.sincerely}</p>

                    <div className="mt-6">
                        <h4 className="font-semibold text-black">Roll Numbers for Approval:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
                            {departmentOrder.map(dept => {
                                const rns = letter.rollNos[dept as keyof typeof letter.rollNos];
                                if (!rns || !rns.trim()) return null;
                                return (
                                <div key={dept}>
                                    <h5 className="text-sm font-bold capitalize text-black">{dept === 'frsh' ? 'Freshman' : dept}</h5>
                                    <ul className="text-xs list-inside space-y-1 text-black">
                                        {rns.split(/[\n, ]+/).filter(rn => rn.trim()).map(rn => (
                                            <li key={rn} className="flex items-center justify-between p-1 rounded hover:bg-gray-100">
                                                <span>{rn}</span>
                                                <div className="flex items-center space-x-2">
                                                    {(() => {
                                                        const rollNoStatus = letter.rollNoApprovals?.[dept]?.[rn];
                                                        const canApprove = user?.officialRole === `${dept}_hod` && filter === 'pending' && letter.approvals[`${dept}Hod` as keyof ApprovalStatus] === 'pending';

                                                        if (rollNoStatus) {
                                                            // If the roll number has a status, display it.
                                                            return (
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${rollNoStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                    {rollNoStatus}
                                                                </span>
                                                            );
                                                        } else if (canApprove) {
                                                            // If it's pending AND the HOD can approve, show the buttons.
                                                            return (
                                                                <div className="flex space-x-1">
                                                                    <button onClick={() => handleRollNoApproval(letter.id, dept, rn, 'approved')} disabled={updating === `${letter.id}-${rn}`} className="text-green-500 hover:text-green-700 disabled:opacity-50 text-lg">✓</button>
                                                                    <button onClick={() => handleRollNoApproval(letter.id, dept, rn, 'rejected')} disabled={updating === `${letter.id}-${rn}`} className="text-red-500 hover:text-red-700 disabled:opacity-50 text-lg">✗</button>
                                                                </div>
                                                            );
                                                        } else {
                                                            // Otherwise, it's just pending.
                                                            return (
                                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    Pending
                                                                </span>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )})}
                        </div>
                    </div>
                    
                    {approvalError && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {approvalError}
                        </div>
                    )}

                    {filter === 'pending' && (
                        <div className="mt-6 flex space-x-2">
                            <button onClick={() => handleLetterApproval(letter.id, 'approved')} disabled={updating === letter.id} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50">Approve Letter</button>
                            <button onClick={() => handleLetterApproval(letter.id, 'rejected')} disabled={updating === letter.id} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50">Reject Letter</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

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
                <p className="text-center text-black py-10">No {filter} letters to display.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {letters.map(letter => (
                        <div 
                            key={letter.id} 
                            className="bg-white p-6 rounded-lg shadow-md text-black cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedLetter(letter.id)}
                        >
                            <h3 className="text-lg font-bold text-black mb-2">{letter.clubName}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2"><strong>Subject:</strong> {letter.subject}</p>
                            <p className="text-sm text-gray-500">Submitted: {letter.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};