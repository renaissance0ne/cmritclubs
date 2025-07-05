'use client';

import React, { useState } from 'react';

// Mock data for demonstration
const mockLetters = [
    {
        id: '1',
        clubName: 'Tech Club',
        subject: 'Permission for Tech Workshop',
        createdAt: new Date('2024-01-15'),
        body: 'We request permission to conduct a technology workshop...',
        sincerely: 'Tech Club President',
        rollNos: { cse: '21CS001\n21CS002', csm: '21CM001', csd: '', frsh: '24FR001', ece: '' },
        rollNoApprovals: {}
    },
    {
        id: '2',
        clubName: 'Drama Club',
        subject: 'Cultural Event Permission',
        createdAt: new Date('2024-01-10'),
        body: 'We seek permission to organize a cultural event...',
        sincerely: 'Drama Club Secretary',
        rollNos: { cse: '21CS003', csm: '', csd: '21CD001', frsh: '', ece: '21EC001' },
        rollNoApprovals: {}
    },
    {
        id: '3',
        clubName: 'Sports Club',
        subject: 'Inter-college Tournament',
        createdAt: new Date('2024-01-12'),
        body: 'Request for organizing inter-college sports tournament...',
        sincerely: 'Sports Club Captain',
        rollNos: { cse: '', csm: '21CM002', csd: '', frsh: '24FR002\n24FR003', ece: '21EC002' },
        rollNoApprovals: {}
    },
    {
        id: '4',
        clubName: 'Music Club',
        subject: 'Concert Permission Request',
        createdAt: new Date('2024-01-08'),
        body: 'We would like to organize a musical concert...',
        sincerely: 'Music Club Lead',
        rollNos: { cse: '21CS004', csm: '', csd: '21CD002', frsh: '', ece: '' },
        rollNoApprovals: {}
    }
];

export default function DemoGridPage() {
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

    // Filter mock letters (for demo, all are pending)
    const letters = mockLetters;

    // If a letter is selected, show detailed view
    if (selectedLetter) {
        const letter = letters.find(l => l.id === selectedLetter);
        if (!letter) return <div className="text-black">Letter not found</div>;
        
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-4 flex items-center space-x-4">
                        <button 
                            onClick={() => setSelectedLetter(null)}
                            className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                        >
                            <span>←</span>
                            <span>Back to Grid</span>
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
                        <p className="text-sm text-black">Submitted: {letter.createdAt.toLocaleDateString()}</p>
                        <p className="mt-4 text-black"><strong>Subject:</strong> {letter.subject}</p>
                        <p className="mt-2 whitespace-pre-wrap text-black">{letter.body}</p>
                        <p className="mt-4 text-black"><strong>Sincerely,</strong><br/>{letter.sincerely}</p>

                        <div className="mt-6">
                            <h4 className="font-semibold text-black">Roll Numbers for Approval:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
                                {Object.entries(letter.rollNos).map(([dept, rollNos]) => {
                                    if (!rollNos) return null;
                                    return (
                                        <div key={dept}>
                                            <h5 className="text-sm font-bold capitalize text-black">{dept === 'frsh' ? 'Freshman' : dept}</h5>
                                            <ul className="text-xs list-inside space-y-1 text-black">
                                                {rollNos.split('\n').filter(rn => rn.trim()).map(rn => (
                                                    <li key={rn} className="flex items-center justify-between">
                                                        <span>{rn}</span>
                                                        <span className="text-xs font-semibold text-gray-400">Pending</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-6 flex space-x-2">
                            <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm">Approve Letter</button>
                            <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm">Reject Letter</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Grid view (default)
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-black mb-6">Permission Letters Dashboard - Demo</h1>
                
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {letters.map(letter => (
                            <div 
                                key={letter.id} 
                                className="bg-white p-6 rounded-lg shadow-md text-black cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => setSelectedLetter(letter.id)}
                            >
                                <h3 className="text-lg font-bold text-black mb-2">{letter.clubName}</h3>
                                <p className="text-sm text-gray-600 mb-2"><strong>Subject:</strong> {letter.subject}</p>
                                <p className="text-sm text-gray-500">Submitted: {letter.createdAt.toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}