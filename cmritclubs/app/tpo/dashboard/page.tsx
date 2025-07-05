'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function TpoDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official" requiredOfficialRoles={['tpo']}>
            <OfficialDashboard view="applications" />
        </ProtectedRoute>
    );
}
