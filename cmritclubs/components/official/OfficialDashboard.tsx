'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { PermissionLettersDashboard } from './PermissionLettersDashboard';
import { Sidebar } from './Sidebar';

interface ApprovalStatus {
    director: 'pending' | 'approved' | 'rejected';
    cseHod: 'pending' | 'approved' | 'rejected';
    csmHod: 'pending' | 'approved' | 'rejected';
    csdHod: 'pending' | 'approved' | 'rejected';
    frshHod: 'pending' | 'approved' | 'rejected';
    eceHod: 'pending' | 'approved' | 'rejected';
    tpo: 'pending' | 'approved' | 'rejected';
    dsaa: 'pending' | 'approved' | 'rejected';
}

interface UserApplication {
    uid: string;
    displayName: string;
    email: string;
    rollNo: string;
    phoneNumber: string;
    department: string;
    clubName: string;
    clubInchargeFaculty: string;
    yearOfStudy: string;
    expectedGraduationYear?: number;
    expectedGraduationMonth?: string;
    letterOfProof?: string;
    approvals: ApprovalStatus;
    overallStatus: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    status: string;
}

interface OfficialDashboardProps {
    role: 'admin' | 'director' | 'hod';
    view: 'applications' | 'letters';
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({ role, view }) => {
    const { user, signOut } = useAuth();
    const [applications, setApplications] = useState<UserApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user || view !== 'applications') return;
            setLoading(true);
            try {
                // Query users collection for club leaders with submitted applications
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'club_leader')
                );
                const querySnapshot = await getDocs(q);

                const fetchedApplications = querySnapshot.docs
                    .map(doc => ({ uid: doc.id, ...doc.data() } as UserApplication))
                    .filter(app => {
                        // Only show applications that have been submitted (have required fields)
                        return app.clubName && app.displayName && app.rollNo;
                    })
                    .filter(app => {
                        // Get the current user's role for filtering
                        const myRole = getMyApprovalRole();
                        if (!myRole) return false;

                        // Initialize approvals if not present
                        const approvals = app.approvals || {
                            director: 'pending', dsaa: 'pending', tpo: 'pending',
                            cseHod: 'pending', csmHod: 'pending', csdHod: 'pending',
                            frshHod: 'pending', eceHod: 'pending'
                        };
                        const myApprovalStatus = approvals[myRole];
                        const overallStatus = app.overallStatus || calculateOverallStatus(approvals);

                        // Filter based on what this official wants to see
                        if (filter === 'pending') {
                            // Show applications that are pending overall AND this official hasn't decided yet
                            return overallStatus === 'pending' && myApprovalStatus === 'pending';
                        } else if (filter === 'approved') {
                            // Show applications that this official has approved
                            return myApprovalStatus === 'approved';
                        } else if (filter === 'rejected') {
                            // Show applications that this official has rejected
                            return myApprovalStatus === 'rejected';
                        }
                        return false;
                    });

                setApplications(fetchedApplications);
            } catch (error) {
                console.error('Error fetching applications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [user, filter, view]);

    const calculateOverallStatus = (approvals: ApprovalStatus): 'pending' | 'approved' | 'rejected' => {
        const statuses = Object.values(approvals);
        if (statuses.every(status => status === 'approved')) return 'approved';
        if (statuses.some(status => status === 'rejected')) return 'rejected';
        return 'pending';
    };

    const getMyApprovalRole = (): keyof ApprovalStatus | null => {
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
    };

    const handleApprovalUpdate = async (uid: string, status: 'approved' | 'rejected') => {
        const myRole = getMyApprovalRole();
        if (!myRole) return;

        setUpdating(uid);
        try {
            const application = applications.find(app => app.uid === uid);
            if (!application) return;

            // Initialize approvals if not present
            const currentApprovals = application.approvals || {
                director: 'pending', dsaa: 'pending', tpo: 'pending',
                cseHod: 'pending', csmHod: 'pending', csdHod: 'pending',
                frshHod: 'pending', eceHod: 'pending'
            };
            const updatedApprovals = {
                ...currentApprovals,
                [myRole]: status
            };
            const newOverallStatus = calculateOverallStatus(updatedApprovals);

            const updateData: any = {
                approvals: updatedApprovals,
                overallStatus: newOverallStatus,
                updatedAt: serverTimestamp()
            };

            // If fully approved, update main status
            if (newOverallStatus === 'approved') {
                updateData.status = 'approved';
            } else if (newOverallStatus === 'rejected') {
                updateData.status = 'rejected';
            }

            await updateDoc(doc(db, 'users', uid), updateData);

            // Refetch applications to update the view
            const q = query(
                collection(db, 'users'),
                where('role', '==', 'club_leader')
            );
            const querySnapshot = await getDocs(q);

            const fetchedApplications = querySnapshot.docs
                .map(doc => ({ uid: doc.id, ...doc.data() } as UserApplication))
                .filter(app => {
                    return app.clubName && app.displayName && app.rollNo;
                })
                .filter(app => {
                    const myRole = getMyApprovalRole();
                    if (!myRole) return false;

                    const approvals = app.approvals || {
                        director: 'pending', dsaa: 'pending', tpo: 'pending',
                        cseHod: 'pending', csmHod: 'pending', csdHod: 'pending',
                        frshHod: 'pending', eceHod: 'pending'
                    };

                    const myApprovalStatus = approvals[myRole];
                    const overallStatus = app.overallStatus || calculateOverallStatus(approvals);

                    if (filter === 'pending') {
                        return overallStatus === 'pending' && myApprovalStatus === 'pending';
                    } else if (filter === 'approved') {
                        return myApprovalStatus === 'approved';
                    } else if (filter === 'rejected') {
                        return myApprovalStatus === 'rejected';
                    }
                    return false;
                });

            setApplications(fetchedApplications);

        } catch (error) {
            console.error('Error updating approval:', error);
        } finally {
            setUpdating(null);
        }
    };

    const canApproveApplication = (application: UserApplication): boolean => {
        const myRole = getMyApprovalRole();
        if (!myRole) {
            console.log('No approval role found for user:', user?.officialRole);
            return false;
        }

        // Initialize approvals if not present
        if (!application.approvals) {
            console.log('No approvals object found for application:', application.uid);
            return true; // Can approve if no approvals structure exists yet
        }

        const currentStatus = application.approvals[myRole];
        console.log(`Current approval status for ${myRole}:`, currentStatus);

        // Check if this official hasn't already approved/rejected
        return currentStatus === 'pending';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const officialRoles = {
        director: 'Director',
        dsaa: 'DSAA',
        tpo: 'TPO',
        cseHod: 'CSE HOD',
        csmHod: 'CSM HOD',
        csdHod: 'CSD HOD',
        frshHod: 'Freshman HOD',
        eceHod: 'ECE HOD'
    };

    return (
        <div className="min-h-screen flex">
            <Sidebar setFilter={setFilter} signOut={signOut} />
            <main className="flex-1 p-8 bg-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold capitalize">{filter} {view}</h1>
                    <div className="text-sm text-gray-600">
                        Role: {user?.officialRole?.replace('_', ' ').toUpperCase()}
                    </div>
                </div>

                {view === 'applications' ? (
                    loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No {filter} applications found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {applications.map(app => (
                                <div key={app.uid} className="bg-white p-6 rounded-lg shadow-md">
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800">{app.clubName}</h2>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.overallStatus || 'pending')}`}>
                                            {(app.overallStatus || 'pending').toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <p><strong>Applicant:</strong> {app.displayName}</p>
                                        <p><strong>Roll No:</strong> {app.rollNo}</p>
                                        <p><strong>Email:</strong> {app.email}</p>
                                        <p><strong>Department:</strong> {app.department}</p>
                                        <p><strong>Year:</strong> {app.yearOfStudy}</p>
                                        <p><strong>Faculty In-charge:</strong> {app.clubInchargeFaculty}</p>
                                        <p><strong>Phone:</strong> {app.phoneNumber}</p>
                                        {app.expectedGraduationYear && (
                                            <p><strong>Graduation:</strong> {app.expectedGraduationMonth} {app.expectedGraduationYear}</p>
                                        )}
                                    </div>

                                    {app.letterOfProof && (
                                        <div className="mb-4">
                                            <a
                                                href={app.letterOfProof}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                📄 View Letter of Proof
                                            </a>
                                        </div>
                                    )}

                                    {app.approvals && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Approval Status:</p>
                                            <div className="grid grid-cols-2 gap-1 text-xs">
                                                {Object.entries(officialRoles).map(([key, title]) => {
                                                    const roleKey = key as keyof ApprovalStatus;
                                                    const status = app.approvals[roleKey];
                                                    return (
                                                        <div key={key} className="flex justify-between">
                                                            <span className="text-gray-600">{title}:</span>
                                                            <span className={`px-1 rounded ${getStatusColor(status)}`}>
                                                                {status}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action buttons for pending applications */}
                                    {filter === 'pending' && canApproveApplication(app) && (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleApprovalUpdate(app.uid, 'approved')}
                                                disabled={updating === app.uid}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50"
                                            >
                                                {updating === app.uid ? 'Approving...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleApprovalUpdate(app.uid, 'rejected')}
                                                disabled={updating === app.uid}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50"
                                            >
                                                {updating === app.uid ? 'Rejecting...' : 'Reject'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Show if already reviewed by this official */}
                                    {app.approvals && getMyApprovalRole() && app.approvals[getMyApprovalRole()!] !== 'pending' && (
                                        <div className="mt-4 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                            You have already {app.approvals[getMyApprovalRole()!]} this application.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <PermissionLettersDashboard />
                )}
            </main>
        </div>
    );
};