'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
    const { user, signOut } = useAuth();

    return (
        <ProtectedRoute requiredStatus="approved">
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-semibold">CMRIT Clubs Portal</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">
                                    Welcome, {user?.displayName || user?.email}
                                </span>
                                <a href="/dashboard/letters/new" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                                    Draft New Letter
                                </a>
                                <button
                                    onClick={signOut}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Dashboard
                                </h2>
                                <p className="text-gray-600">
                                    Welcome to your {user?.role === 'college_official' ? 'admin' : 'club leader'} dashboard!
                                </p>
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-semibold text-blue-900">Account Status</h3>
                                    <p className="text-blue-800">Status: {user?.status}</p>
                                    <p className="text-blue-800">Role: {user?.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
