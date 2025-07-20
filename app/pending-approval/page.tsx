'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- Interface Definitions ---
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

interface ApplicationData {
    fullName: string;
    email: string;
    rollNo: string;
    department: string;
    clubName: string;
    clubInchargeFaculty: string;
    yearOfStudy: string;
    letterOfProof: string;
    approvals: ApprovalStatus;
    submittedAt: Date;
    overallStatus: 'pending' | 'approved' | 'rejected';
    phoneNumber: string;
    expectedGraduationYear?: number;
    expectedGraduationMonth?: string;
}

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

// --- DYNAMIC COUNT: Get the total number of roles from the object ---
const totalRoles = Object.keys(officialRoles).length;

// --- Component ---
export default function PendingApprovalPage() {
    const { user, signOut } = useAuth();
    const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchApplicationData();
        }
    }, [user]);

    const fetchApplicationData = async () => {
        try {
            if (!user) return;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const approvals = userData.approvals || {
                    director: 'pending', dsaa: 'pending', tpo: 'pending',
                    cseHod: 'pending', csmHod: 'pending', csdHod: 'pending',
                    frshHod: 'pending', eceHod: 'pending'
                };

                setApplicationData({
                    fullName: userData.displayName || '',
                    email: userData.email || '',
                    rollNo: userData.rollNo || '',
                    department: userData.department || '',
                    clubName: userData.clubName || '',
                    clubInchargeFaculty: userData.clubInchargeFaculty || '',
                    yearOfStudy: userData.yearOfStudy || '',
                    letterOfProof: userData.letterOfProof || '',
                    approvals,
                    submittedAt: userData.createdAt?.toDate() || new Date(),
                    overallStatus: calculateOverallStatus(approvals),
                    phoneNumber: userData.phoneNumber || 'Not provided',
                    expectedGraduationYear: userData.expectedGraduationYear,
                    expectedGraduationMonth: userData.expectedGraduationMonth || 'Not provided',
                });
            }
        } catch (error) {
            console.error('Error fetching application data:', error);
            setError('Failed to load application data');
        } finally {
            setLoading(false);
        }
    };

    const calculateOverallStatus = (approvals: ApprovalStatus): 'pending' | 'approved' | 'rejected' => {
        const statuses = Object.values(approvals);
        if (statuses.some(status => status === 'rejected')) return 'rejected';
        if (statuses.every(status => status === 'approved')) return 'approved';
        return 'pending';
    };

    const canApproveRole = (role: keyof ApprovalStatus): boolean => {
        if (!user || user.role !== 'college_official') return false;
        const userOfficialRole = user.officialRole;
        switch (role) {
            case 'director': return userOfficialRole === 'director';
            case 'dsaa': return userOfficialRole === 'dsaa';
            case 'tpo': return userOfficialRole === 'tpo';
            case 'cseHod': return userOfficialRole === 'cse_hod';
            case 'csmHod': return userOfficialRole === 'csm_hod';
            case 'csdHod': return userOfficialRole === 'csd_hod';
            case 'frshHod': return userOfficialRole === 'frsh_hod';
            case 'eceHod': return userOfficialRole === 'ece_hod';
            default: return false;
        }
    };

    const handleApprovalUpdate = async (role: keyof ApprovalStatus, status: 'approved' | 'rejected') => {
        if (!user || !applicationData) return;
        setUpdating(true);
        try {
            const updatedApprovals = { ...applicationData.approvals, [role]: status };
            const newOverallStatus = calculateOverallStatus(updatedApprovals);
            await updateDoc(doc(db, 'users', user.uid), {
                approvals: updatedApprovals,
                overallStatus: newOverallStatus,
                updatedAt: serverTimestamp()
            });
            if (newOverallStatus === 'approved' || newOverallStatus === 'rejected') {
                await updateDoc(doc(db, 'users', user.uid), { status: newOverallStatus });
            }
            setApplicationData(prev => prev ? { ...prev, approvals: updatedApprovals, overallStatus: newOverallStatus } : null);
        } catch (error) {
            console.error('Error updating approval:', error);
            setError('Failed to update approval status');
        } finally {
            setUpdating(false);
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return '✓';
            case 'rejected': return '✗';
            case 'pending': return '⏳';
            default: return '?';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!applicationData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No Application Found</h2>
                    <p className="text-gray-600">Please submit your club application first.</p>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-semibold">CMRIT Clubs Portal</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">
                                    Welcome, {user?.displayName || user?.email}
                                </span>
                                <button
                                    onClick={signOut}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-4xl mx-auto py-8 px-4">
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Application Status</h2>
                            <p className="text-gray-600 mt-1">
                                Submitted on {applicationData.submittedAt.toLocaleDateString()}
                            </p>
                        </div>

                        <div className="px-6 py-4">
                            <div className="mb-8">
                                <div className="flex items-center">
                                    <span className="text-lg font-semibold mr-3 text-gray-900">Overall Status:</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(applicationData.overallStatus)}`}>
                                        {getStatusIcon(applicationData.overallStatus)} {applicationData.overallStatus.toUpperCase()}
                                    </span>
                                </div>
                                {applicationData.overallStatus === 'approved' && (
                                    <p className="text-green-600 mt-2">🎉 Congratulations! Your application has been approved.</p>
                                )}
                                {applicationData.overallStatus === 'rejected' && (
                                    <p className="text-red-600 mt-2">Your application has been rejected.</p>
                                )}
                            </div>

                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">📝 Application Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-900">
                                    <div><strong>Name:</strong> {applicationData.fullName}</div>
                                    <div><strong>Email:</strong> {applicationData.email}</div>
                                    <div><strong>Phone Number:</strong> {applicationData.phoneNumber}</div>
                                    <div><strong>Roll No:</strong> {applicationData.rollNo}</div>
                                    <div><strong>Department:</strong> {applicationData.department}</div>
                                    <div><strong>Year of Study:</strong> {applicationData.yearOfStudy}</div>
                                    <div><strong>Expected Graduation:</strong> {applicationData.expectedGraduationMonth} {applicationData.expectedGraduationYear || ''}</div>
                                    <div><strong>Club Name:</strong> {applicationData.clubName}</div>
                                    <div><strong>Faculty In-charge:</strong> {applicationData.clubInchargeFaculty}</div>
                                    <div>
                                        <strong>Letter of Proof:</strong>
                                        {applicationData.letterOfProof ? (
                                            <a
                                                href={applicationData.letterOfProof}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline ml-2"
                                            >
                                                View Document 🔗
                                            </a>
                                        ) : (
                                            ' Not provided'
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">Approval Status by Officials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(officialRoles).map(([key, title]) => {
                                        const role = key as keyof ApprovalStatus;
                                        const status = applicationData.approvals[role];
                                        const canApprove = canApproveRole(role);

                                        return (
                                            <div key={role} className={`p-4 border rounded-lg ${status === 'approved' ? 'border-green-200 bg-green-50' : status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-800">{title}</h4>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                                                        {getStatusIcon(status)} {status.toUpperCase()}
                                                    </span>
                                                </div>

                                                {canApprove && status === 'pending' && (
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => handleApprovalUpdate(role, 'approved')} disabled={updating} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50">Approve</button>
                                                        <button onClick={() => handleApprovalUpdate(role, 'rejected')} disabled={updating} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50">Reject</button>
                                                    </div>
                                                )}

                                                {!canApprove && (
                                                    <p className="text-xs text-gray-500">
                                                        {status === 'pending' ? 'Awaiting decision' : `Decision: ${status}`}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Progress</span>
                                    {/* DYNAMIC COUNT: Use the totalRoles variable here */}
                                    <span>{Object.values(applicationData.approvals).filter(s => s === 'approved').length}/{totalRoles} approvals</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        // DYNAMIC COUNT: Use the totalRoles variable for the percentage calculation
                                        style={{ width: `${(Object.values(applicationData.approvals).filter(s => s === 'approved').length / totalRoles) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}