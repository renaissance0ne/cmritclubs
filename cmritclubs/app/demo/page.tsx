'use client';

import { useState } from 'react';

// Simplified card component for demo
const DemoLetterCard = ({ letter, onClick }: { letter: any; onClick: () => void }) => {
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
                Submitted: {letter.date}
            </p>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-blue-600 font-medium">
                    Click to view details →
                </p>
            </div>
        </div>
    );
};

// Simplified modal component for demo
const DemoLetterModal = ({ letter, isOpen, onClose }: { letter: any; isOpen: boolean; onClose: () => void }) => {
    if (!isOpen || !letter) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Permission Letter Details</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="bg-white text-black">
                        <h3 className="text-xl font-bold text-black mb-4">{letter.clubName}</h3>
                        
                        <div className="text-sm mb-4 text-black">
                            <p>To,</p>
                            <p>The Director,</p>
                            <p>CMR Institute of Technology</p>
                            <p>Medchal</p>
                        </div>
                        
                        <p className="text-sm text-black mb-4">
                            Submitted: {letter.date}
                        </p>
                        
                        <p className="mt-4 text-black">
                            <strong>Subject:</strong> {letter.subject}
                        </p>
                        
                        <p className="mt-4 whitespace-pre-wrap text-black">{letter.body}</p>
                        
                        <p className="mt-4 text-black">
                            <strong>Sincerely,</strong><br/>{letter.sincerely}
                        </p>

                        <div className="mt-6">
                            <h4 className="font-semibold text-black mb-2">Status:</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                letter.status === 'approved' ? 'text-green-600 bg-green-100' :
                                letter.status === 'rejected' ? 'text-red-600 bg-red-100' :
                                'text-yellow-600 bg-yellow-100'
                            }`}>
                                {letter.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t p-4">
                    <button 
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Mock data for demo
const mockLetters = [
    {
        id: '1',
        clubName: 'Computer Science Club',
        subject: 'Permission for Annual Tech Fest 2024',
        body: 'We request permission to organize our annual tech fest on campus with various technical competitions and workshops.',
        sincerely: 'John Doe, President',
        status: 'pending',
        date: '1/15/2024'
    },
    {
        id: '2',
        clubName: 'Robotics Club',
        subject: 'Workshop on Arduino Programming',
        body: 'We would like to conduct a 3-day workshop on Arduino programming for interested students.',
        sincerely: 'Jane Smith, Secretary',
        status: 'approved',
        date: '1/10/2024'
    },
    {
        id: '3',
        clubName: 'Photography Club',
        subject: 'Campus Photography Exhibition',
        body: 'Request for organizing a photography exhibition showcasing campus life and nature photography.',
        sincerely: 'Alex Johnson, Coordinator',
        status: 'rejected',
        date: '1/8/2024'
    },
    {
        id: '4',
        clubName: 'Music Club',
        subject: 'Annual Music Concert 2024',
        body: 'We request permission to organize our annual music concert featuring classical and contemporary performances.',
        sincerely: 'Maria Garcia, President',
        status: 'pending',
        date: '1/5/2024'
    },
    {
        id: '5',
        clubName: 'Drama Club',
        subject: 'Inter-College Drama Competition',
        body: 'Request for hosting an inter-college drama competition with multiple participating colleges.',
        sincerely: 'Robert Wilson, Director',
        status: 'pending',
        date: '1/3/2024'
    },
    {
        id: '6',
        clubName: 'Sports Club',
        subject: 'Annual Sports Day Event',
        body: 'Permission required for organizing the annual sports day with track and field events, team sports, and prizes.',
        sincerely: 'Sarah Davis, Captain',
        status: 'approved',
        date: '1/1/2024'
    }
];

export default function DemoPage() {
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [selectedLetter, setSelectedLetter] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredLetters = mockLetters.filter(letter => letter.status === filter);

    const handleCardClick = (letter: any) => {
        setSelectedLetter(letter);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLetter(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold">Permission Letters - Grid Format Demo</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Redesigned Grid Layout</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Filter Buttons */}
                    <div className="mb-6 flex space-x-2">
                        <button 
                            onClick={() => setFilter('pending')} 
                            className={`px-3 py-2 rounded-md text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Pending ({mockLetters.filter(l => l.status === 'pending').length})
                        </button>
                        <button 
                            onClick={() => setFilter('approved')} 
                            className={`px-3 py-2 rounded-md text-sm ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Approved ({mockLetters.filter(l => l.status === 'approved').length})
                        </button>
                        <button 
                            onClick={() => setFilter('rejected')} 
                            className={`px-3 py-2 rounded-md text-sm ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Rejected ({mockLetters.filter(l => l.status === 'rejected').length})
                        </button>
                    </div>

                    {/* Grid Layout */}
                    {filteredLetters.length === 0 ? (
                        <p className="text-center text-gray-500">No {filter} letters to display.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredLetters.map(letter => (
                                <DemoLetterCard 
                                    key={letter.id} 
                                    letter={letter} 
                                    onClick={() => handleCardClick(letter)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">✨ New Grid Format Features:</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Grid Layout:</strong> Letters are now displayed in a responsive card grid instead of a vertical list</li>
                            <li>• <strong>Compact Cards:</strong> Each card shows only essential info - club name, subject, and submission date</li>
                            <li>• <strong>Click to Expand:</strong> Click any card to view complete letter details in a modal popup</li>
                            <li>• <strong>Responsive Design:</strong> Grid adapts from 1 column on mobile to 4 columns on large screens</li>
                            <li>• <strong>Hover Effects:</strong> Cards have subtle hover animations for better user experience</li>
                            <li>• <strong>Status Indicators:</strong> Color-coded status badges for quick identification</li>
                        </ul>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-600">
                                <strong>Try it:</strong> Use the filter buttons above and click on any card to see the modal in action!
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal */}
            <DemoLetterModal 
                letter={selectedLetter}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
}