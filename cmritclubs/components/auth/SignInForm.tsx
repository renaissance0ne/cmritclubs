'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export const SignInForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle, firebaseUser, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (firebaseUser && user) {
            if (user.role === 'college_official') {
                // Updated redirection logic for all official roles
                if (user.officialRole === 'director') {
                    router.push('/director/dashboard');
                } else if (user.officialRole === 'tpo') {
                    router.push('/tpo/dashboard');
                } else if (user.officialRole === 'dsaa') {
                    router.push('/dsaa/dashboard');
                } else if (user.officialRole?.includes('hod')) {
                    router.push('/hod/dashboard');
                } else {
                    router.push('/admin/dashboard'); // Fallback
                }
            } else {
                switch (user.status) {
                    case 'approved':
                        router.push('/dashboard');
                        break;
                    case 'pending':
                        router.push('/pending-approval');
                        break;
                    case 'rejected':
                        router.push('/application-rejected');
                        break;
                    case 'email_verified':
                        router.push('/application');
                        break;
                    default:
                        router.push('/dashboard');
                }
            }
        }
    }, [firebaseUser, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (error: any) {
            setError(error.message || 'Failed to sign in');
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            setError(error.message || 'Failed to sign in with Google');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-black">Sign In</h2>
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        College Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 disabled:opacity-50"
                        placeholder="your.email@college.edu"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:opacity-50"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div className="mt-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                </div>
            </div>

            <p className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/signup" className="text-blue-600 hover:text-blue-500">
                    Sign up for clubs
                </a>
            </p>
        </div>
    );
};
