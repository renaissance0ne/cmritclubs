'use client'

import {useState} from "react";
import {useAuth} from "@/contexts/AuthContext";

export const EmailVerification: React.FC = () => {
    const { firebaseUser, sendEmailVerification } = useAuth();
    const [emailSent, setEmailSent] = useState(false);
    const [loading, setLoading] = useState(false);

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

                        <p className="mt-4 text-xs text-gray-500">
                            After verifying your email, refresh this page to continue.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};