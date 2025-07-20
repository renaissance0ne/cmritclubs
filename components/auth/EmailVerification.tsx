'use client'

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export const EmailVerification: React.FC = () => {
    const { firebaseUser, user, sendEmailVerification, signOut, loading: authLoading } = useAuth();
    const router = useRouter();
    const [emailSent, setEmailSent] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If user signs out, firebaseUser becomes null, so redirect to signin
        if (!authLoading && !firebaseUser) {
            router.push('/signin');
            return;
        }

        if (firebaseUser?.emailVerified) {
            // Once email is verified, redirect user to the appropriate page
            if (user?.status === 'pending') {
                router.push('/pending-approval');
            } else {
                router.push('/dashboard');
            }
        }
    }, [firebaseUser, user, router, authLoading]);

    const handleResendEmail = async () => {
        setLoading(true);
        try {
            await sendEmailVerification();
            setEmailSent(true);
        } catch (error) {
            console.error('Error sending verification email:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Verify Your Email
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        We sent a verification email to <strong>{firebaseUser?.email}</strong>
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Check Your Email
                        </h3>

                        <p className="text-sm text-gray-600 mb-6">
                            Click the verification link in your email to continue. If you don't see the email, check your spam folder.
                        </p>

                        {emailSent && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                                Verification email sent successfully!
                            </div>
                        )}

                        <button
                            onClick={handleResendEmail}
                            disabled={loading || emailSent}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : emailSent ? 'Email Sent!' : 'Resend Verification Email'}
                        </button>

                        <button
                            onClick={signOut}
                            className="mt-4 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign Out
                        </button>

                        <p className="mt-4 text-xs text-gray-500">
                            After verifying your email, this page should refresh automatically.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};