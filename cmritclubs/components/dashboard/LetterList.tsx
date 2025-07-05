'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';
import { LetterModal } from '@/components/common/LetterModal';

interface LettersListProps {
    filter: 'pending' | 'approved' | 'rejected';
}

export const LettersList: React.FC<LettersListProps> = ({ filter }) => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLetter, setSelectedLetter] = useState<PermissionLetter | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchLetters = useCallback(async () => {
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
    }, [user, filter]);

    useEffect(() => {
        fetchLetters();
    }, [fetchLetters]);

    const handleDelete = async (letterId: string) => {
        if (!window.confirm("Are you sure you want to delete this letter?")) return;
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

    const handleCardClick = (letter: PermissionLetter) => {
        setSelectedLetter(letter);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLetter(null);
    };


    if (loading) {
        return <div className="text-center p-10">Loading...</div>;
    }

    if (letters.length === 0) {
        return <div className="text-center py-10"><p className="text-gray-500">No {filter} permission letters found.</p></div>;
    }

    return (
        <div>
            {letters.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">No {filter} permission letters found.</p>
                </div>
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
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status)}`}>
                                    {letter.status.toUpperCase()}
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

                            {/* Actions */}
                            <div className="flex justify-between items-center border-t pt-3">
                                <span className="text-xs text-gray-500">Click to view details</span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(letter.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <LetterModal
                letter={selectedLetter}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                isOfficialView={false}
            />
        </div>
    );
};