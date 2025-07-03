'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ClubApplication } from '@/types/auth';
import { Sidebar } from './Sidebar';

interface OfficialDashboardProps {
    role: 'admin' | 'director' | 'hod';
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({ role }) => {
    const { user, signOut } = useAuth();
    const [applications, setApplications] = useState<ClubApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const q = query(collection(db, 'applications'), where('status', '==', filter));
                const querySnapshot = await getDocs(q);
                const fetchedApplications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubApplication));
                setApplications(fetchedApplications);
            } catch (error) {
                console.error('Error fetching applications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [user, filter]);

    const handleApprove = async (id: string) => {
        try {
            const appRef = doc(db, 'applications', id);
            await updateDoc(appRef, { status: 'approved', reviewedBy: user?.uid, reviewedAt: new Date() });
            setApplications(prev => prev.filter(app => app.id !== id));
        } catch (error) {
            console.error('Error approving application:', error);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            try {
                const appRef = doc(db, 'applications', id);
                await updateDoc(appRef, { status: 'rejected', rejectionReason: reason, reviewedBy: user?.uid, reviewedAt: new Date() });
                setApplications(prev => prev.filter(app => app.id !== id));
            } catch (error) {
                console.error('Error rejecting application:', error);
            }
        }
    };

    return (
        <div className="min-h-screen flex">
            <Sidebar setFilter={setFilter} signOut={signOut} />
            <main className="flex-1 p-8 bg-gray-100">
                <h1 className="text-3xl font-bold mb-8 capitalize">{filter.replace('_', ' ')} Applications</h1>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : applications.length === 0 ? (
                    <p>No {filter.replace('_', ' ')} applications found.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {applications.map(app => (
                            <div key={app.id} className="bg-white p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold mb-2">{app.clubName}</h2>
                                <p><strong>Applicant:</strong> {app.fullName}</p>
                                <p><strong>Roll No:</strong> {app.rollNo}</p>
                                <p><strong>Email:</strong> {app.email}</p>
                                <p><strong>Club Type:</strong> {app.clubType}</p>
                                <a href={app.letterOfProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    View Letter of Proof
                                </a>
                                {filter === 'pending' && (role === 'director' || role === 'hod') && (
                                    <div className="mt-4 flex space-x-4">
                                        <button onClick={() => handleApprove(app.id)} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                                            Approve
                                        </button>
                                        <button onClick={() => handleReject(app.id)} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};