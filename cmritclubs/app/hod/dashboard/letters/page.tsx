'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function HodLettersDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official">
            <OfficialDashboard role="hod" view="letters" />
        </ProtectedRoute>
    );
}