'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DsaaLettersDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official" requiredOfficialRoles={['dsaa']}>
            <OfficialDashboard view="letters" />
        </ProtectedRoute>
    );
}
