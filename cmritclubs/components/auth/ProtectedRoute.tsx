'use client';

// components/auth/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'club_leader' | 'college_official';
    requiredStatus?: 'email_verified' | 'pending_review' | 'approved' | 'rejected';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
                                                                  children,
                                                                  requiredRole,
                                                                  requiredStatus,
                                                              }) => {
    const { user, firebaseUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // Not authenticated at all
            if (!firebaseUser) {
                router.push('/signin');
                return;
            }

            // Email not verified
            if (!firebaseUser.emailVerified) {
                router.push('/verify-email');
                return;
            }

            // User data not loaded yet
            if (!user) {
                return;
            }

            // Check role requirement
            if (requiredRole && user.role !== requiredRole) {
                router.push('/unauthorized');
                return;
            }

            // Check status requirement
            if (requiredStatus && user.status !== requiredStatus) {
                // Handle different status redirects
                switch (user.status) {
                    case 'email_verified':
                        router.push('/application');
                        break;
                    case 'pending_review':
                        router.push('/pending-approval');
                        break;
                    case 'rejected':
                        router.push('/application-rejected');
                        break;
                    case 'approved':
                        if (requiredStatus === 'email_verified' || requiredStatus === 'pending_review') {
                            // User is approved but trying to access earlier stage
                            router.push('/dashboard');
                        }
                        break;
                }
                return;
            }
        }
    }, [loading, firebaseUser, user, requiredRole, requiredStatus, router]);

    // Show loading spinner while checking authentication
    if (loading || !firebaseUser || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Show unauthorized message if role/status requirements aren't met
    if (requiredRole && user.role !== requiredRole) {
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