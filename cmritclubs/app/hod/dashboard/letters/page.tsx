'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function HodLettersDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official" requiredOfficialRoles={['cse_hod', 'csm_hod', 'csd_hod', 'frsh_hod', 'ece_hod']}>
            <OfficialDashboard role="hod" view="letters" />
        </ProtectedRoute>
    );
}