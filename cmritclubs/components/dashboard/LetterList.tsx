'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { PermissionLetter } from '@/types/letters';
import { LetterCard } from '@/components/ui/LetterCard';
import { LetterDetailModal } from '@/components/ui/LetterDetailModal';

interface LettersListProps {
    filter: 'pending' | 'approved' | 'rejected';
}

export const LettersList: React.FC<LettersListProps> = ({ filter }) => {
    const { user } = useAuth();
    const [letters, setLetters] = useState<PermissionLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLetter, setSelectedLetter] = useState<PermissionLetter | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    useEffect(() => {
        fetchLetters();
    }, [user, filter]);

    const handleDelete = async (letterId: string) => {
        if (!window.confirm("Are you sure you want to delete this letter?")) return;
        try {
            await deleteDoc(doc(db, 'permissionLetters', letterId));
            setLetters(letters.filter(letter => letter.id !== letterId));
            // Close modal if deleted letter was open
            if (selectedLetter?.id === letterId) {
                setIsModalOpen(false);
                setSelectedLetter(null);
            }
        } catch (error) {
            console.error("Error deleting letter:", error);
            alert("Failed to delete letter.");
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

    if (loading) {
        return <div className="text-center p-10">Loading...</div>;
    }

    if (letters.length === 0) {
        return <div className="text-center py-10"><p className="text-gray-500">No {filter} permission letters found.</p></div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {letters.map(letter => (
                    <LetterCard 
                        key={letter.id} 
                        letter={letter} 
                        onClick={() => handleCardClick(letter)}
                    />
                ))}
            </div>

            <LetterDetailModal 
                letter={selectedLetter}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                showActions={false}
                onDelete={handleDelete}
            />
        </>
    );
};