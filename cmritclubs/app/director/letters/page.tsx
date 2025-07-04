'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DirectorLettersDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official">
            <OfficialDashboard role="director" view="letters" />
        </ProtectedRoute>
    );
}