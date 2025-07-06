'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { LettersList } from '@/components/dashboard/LetterList';
import { ApprovedLettersList } from '@/components/dashboard/ApprovedLettersList'; 

export default function LettersPage() {
    const { user } = useAuth();
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

    return (
        <ProtectedRoute requiredStatus="approved">
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-semibold">Permission Letters</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
                                    Back to Dashboard
                                </a>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="flex justify-center border-b border-gray-200">
                            <button
                                onClick={() => setFilter('pending')}
                                className={`px-4 py-2 text-sm font-medium ${filter === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pending
                            </button>
                             {/* MODIFIED: Changed 'approved' to 'finalized' for clarity */}
                            <button
                                onClick={() => setFilter('approved')}
                                className={`px-4 py-2 text-sm font-medium ${filter === 'approved' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Approved Letters (PDF)
                            </button>
                            <button
                                onClick={() => setFilter('rejected')}
                                className={`px-4 py-2 text-sm font-medium ${filter === 'rejected' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Rejected
                            </button>
                        </div>
                        <div className="mt-6">
                            {/* Render different component based on filter */}
                            {filter === 'approved' ? (
                                <ApprovedLettersList />
                            ) : (
                                <LettersList filter={filter} />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}