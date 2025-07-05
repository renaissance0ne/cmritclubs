'use client';

import { PermissionLetter } from '@/types/letters';

interface LetterCardProps {
    letter: PermissionLetter;
    onClick: () => void;
}

export const LetterCard: React.FC<LetterCardProps> = ({ letter, onClick }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div 
            onClick={onClick}
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all duration-200 transform hover:-translate-y-1"
        >
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                    {letter.clubName}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(letter.status)}`}>
                    {letter.status.toUpperCase()}
                </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-3 overflow-hidden">
                <strong>Subject:</strong> {letter.subject}
            </p>
            
            <p className="text-xs text-gray-500">
                Submitted: {letter.createdAt?.toDate().toLocaleDateString()}
            </p>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-blue-600 font-medium">
                    Click to view details →
                </p>
            </div>
        </div>
    );
};