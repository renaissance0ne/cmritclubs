'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OfficialLettersDashboardPage() {
    const params = useParams();
    const [requiredRoles, setRequiredRoles] = useState<string[]>([]);

    const officialType = params.official as string;

    useEffect(() => {
        // Define which roles can access the letters page based on the URL
        if (officialType === 'hod') {
            setRequiredRoles(['cse_hod', 'csm_hod', 'csd_hod', 'frsh_hod', 'ece_hod']);
        } else if (officialType) {
            // Assuming director, tpo, dsaa can also see letters
            setRequiredRoles([officialType]);
        }
    }, [officialType]);
    
    if (requiredRoles.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredRole="college_official" requiredOfficialRoles={requiredRoles}>
            <OfficialDashboard view="letters" />
        </ProtectedRoute>
    );
}
