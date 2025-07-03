'use client';

import { OfficialDashboard } from '@/components/official/OfficialDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminDashboardPage() {
    return (
        <ProtectedRoute requiredRole="college_official">
            <OfficialDashboard role="admin" />
        </ProtectedRoute>
    );
}