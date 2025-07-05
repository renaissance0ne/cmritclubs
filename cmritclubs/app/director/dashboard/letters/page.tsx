'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DirectorLettersDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official" requiredOfficialRoles={['director', 'tpo', 'dsaa']}>
            <OfficialDashboard role="director" view="letters" />
        </ProtectedRoute>
    );
}