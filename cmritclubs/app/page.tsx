'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (firebaseUser && user) {
        // Redirect based on user status
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
      } else if (!firebaseUser) {
        // Not signed in, stay on landing page
      }
    }
  }, [loading, firebaseUser, user, router]);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              CMRIT Clubs Portal
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Streamlined club management and permission system
            </p>

            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <a
                  href="/signup"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Sign Up for Clubs
              </a>
              <a
                  href="/signin"
                  className="inline-block bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-6 rounded-lg border border-blue-600 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Easy Registration
              </h3>
              <p className="text-gray-600">
                Sign up with your college email and get verified quickly
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Permission Letters
              </h3>
              <p className="text-gray-600">
                Submit and track permission letters for your club events
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Official Review
              </h3>
              <p className="text-gray-600">
                Streamlined approval process with college officials
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}