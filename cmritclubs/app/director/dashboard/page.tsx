'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DirectorDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official">
            <OfficialDashboard role="director" />
        </ProtectedRoute>
    );
}