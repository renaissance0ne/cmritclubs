'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function HodDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official">
            <OfficialDashboard  view="applications" />
        </ProtectedRoute>
    );
}