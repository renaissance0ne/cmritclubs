'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionLetterForm } from '@/components/dashboard/PermissionLetterForm';

export default function NewPermissionLetterPage() {
    return (
        <ProtectedRoute requiredStatus="approved">
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-bold text-gray-900">Draft New Permission Letter</h1>
                            </div>
                             <div className="flex items-center">
                                <a href="/dashboard/letters" className="text-sm text-blue-600 hover:underline">
                                    Back to Letters
                                </a>
                            </div>
                        </div>
                    </div>
                </nav>
                <main className="max-w-4xl mx-auto py-8 px-4">
                    <PermissionLetterForm />
                </main>
            </div>
        </ProtectedRoute>
    );
}