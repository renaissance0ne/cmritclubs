'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function OfficialDashboardPage() {
    const params = useParams();
    const { user } = useAuth();
    const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
    
    const officialType = params.official as string;

    useEffect(() => {
        // This logic determines which official roles are allowed to view this page.
        // e.g., if the URL is /hod/dashboard, only users with a role like 'cse_hod', 'ece_hod', etc., can access it.
        if (officialType === 'hod') {
            setRequiredRoles(['cse_hod', 'csm_hod', 'csd_hod', 'frsh_hod', 'ece_hod']);
        } else if (officialType) {
            setRequiredRoles([officialType]);
        }
    }, [officialType]);

    // Render the protected route only when the required roles have been determined
    if (requiredRoles.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredRole="college_official" requiredOfficialRoles={requiredRoles}>
            <OfficialDashboard view="applications" />
        </ProtectedRoute>
    );
}
