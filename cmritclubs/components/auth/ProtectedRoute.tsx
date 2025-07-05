'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'club_leader' | 'college_official';
    requiredStatus?: 'email_verified' | 'pending' | 'approved' | 'rejected';
    requiredOfficialRoles?: string[]; // Added this prop
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole,
    requiredStatus,
    requiredOfficialRoles, // Added this prop
}) => {
    const { user, firebaseUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!firebaseUser) {
                router.push('/signin');
                return;
            }

            if (!firebaseUser.emailVerified) {
                router.push('/verify-email');
                return;
            }

            if (!user) {
                return;
            }

            if (requiredRole && user.role !== requiredRole) {
                router.push('/unauthorized');
                return;
            }

            // New check for specific official roles
            if (requiredOfficialRoles && !requiredOfficialRoles.includes(user.officialRole || '')) {
                router.push('/unauthorized');
                return;
            }

            if (requiredStatus && user.status !== requiredStatus) {
                switch (user.status) {
                    case 'email_verified':
                        router.push('/application');
                        break;
                    case 'pending':
                        router.push('/pending-approval');
                        break;
                    case 'rejected':
                        router.push('/application-rejected');
                        break;
                    case 'approved':
                        if (requiredStatus === 'email_verified' || requiredStatus === 'pending') {
                            router.push('/dashboard');
                        }
                        break;
                }
                return;
            }
        }
    }, [loading, firebaseUser, user, requiredRole, requiredStatus, requiredOfficialRoles, router]);

    if (loading || !firebaseUser || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if ((requiredRole && user.role !== requiredRole) || (requiredOfficialRoles && !requiredOfficialRoles.includes(user.officialRole || ''))) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    if (requiredStatus && user.status !== requiredStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
                    <p className="text-gray-600">Your account status doesn't allow access to this page.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};