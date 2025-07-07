'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ApplicationRejectedPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleReapply = async () => {
        if (!user) {
            setError('You must be logged in to re-apply.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                status: 'pending',
                overallStatus: 'pending',
                approvals: {
                    director: 'pending',
                    dsaa: 'pending',
                    tpo: 'pending',
                    cseHod: 'pending',
                    csmHod: 'pending',
                    csdHod: 'pending',
                    frshHod: 'pending',
                    eceHod: 'pending',
                },
                updatedAt: serverTimestamp()
            });
            // Redirect to the pending approval page to see the status reset
            router.push('/pending-approval');
        } catch (err) {
            console.error('Error during re-application:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute requiredStatus="rejected">
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Application Rejected
                    </h2>
                    <p className="text-gray-600 mb-6">
                        We are sorry to inform you that your application to become a club leader has been rejected. You may re-apply if you believe this was an error.
                    </p>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={handleReapply}
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Re-apply for Position'}
                        </button>
                        <button
                            onClick={signOut}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}